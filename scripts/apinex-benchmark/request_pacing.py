"""Cross-process request pacing shared by benchmark workers and task batches."""
import json
import os
import pathlib
import time


def wait_for_request_slot(state_file, minimum_interval_seconds=5.0):
    """Wait for a globally reserved request slot and persist the next slot atomically.

    Multiple run.py subprocesses use the same state file. An exclusive lock file
    serializes reservations, so retries and separate task batches share one schedule.
    Returns the deliberate wait in seconds.
    """
    if not state_file:
        return 0.0
    interval = float(minimum_interval_seconds)
    if interval <= 0:
        raise ValueError("minimum_interval_seconds must be greater than zero")

    state_path = pathlib.Path(state_file)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = state_path.with_name(state_path.name + ".lock")
    lock_started = time.monotonic()

    while True:
        try:
            descriptor = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            break
        except FileExistsError:
            try:
                if time.time() - lock_path.stat().st_mtime > 120:
                    lock_path.unlink(missing_ok=True)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() - lock_started > 180:
                raise TimeoutError("Timed out waiting for the benchmark request-pacing lock")
            time.sleep(0.05)

    wait_seconds = 0.0
    try:
        try:
            current = json.loads(state_path.read_text(encoding="utf-8"))
            next_request_at = float(current.get("next_request_at_epoch", 0.0))
        except FileNotFoundError:
            next_request_at = 0.0
        except (json.JSONDecodeError, TypeError, ValueError, AttributeError) as exc:
            raise RuntimeError("The shared request-pacing state is invalid; refusing an unpaced request") from exc

        now = time.time()
        scheduled_at = max(now, next_request_at)
        wait_seconds = max(0.0, scheduled_at - now)
        state = {
            "next_request_at_epoch": scheduled_at + interval,
            "minimum_interval_seconds": interval,
            "updated_at_epoch": now,
        }
        temporary_path = state_path.with_name(state_path.name + f".{os.getpid()}.tmp")
        temporary_path.write_text(json.dumps(state) + "\n", encoding="utf-8")
        os.replace(temporary_path, state_path)
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)

    if wait_seconds:
        time.sleep(wait_seconds)
    return wait_seconds
