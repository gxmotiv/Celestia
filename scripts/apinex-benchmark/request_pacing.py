"""Cross-process request pacing shared by benchmark workers and task batches."""
import json
import os
import pathlib
import time


class BenchmarkHaltedError(RuntimeError):
    """Raised when a shared rate-limit/authentication guard stops queued requests."""


def _acquire_lock(lock_path):
    started = time.monotonic()
    while True:
        try:
            return os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            try:
                if time.time() - lock_path.stat().st_mtime > 120:
                    lock_path.unlink(missing_ok=True)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() - started > 180:
                raise TimeoutError("Timed out waiting for the benchmark request-pacing lock")
            time.sleep(0.05)


def _read_state(state_path):
    try:
        current = json.loads(state_path.read_text(encoding="utf-8"))
        if not isinstance(current, dict):
            raise ValueError("State root must be an object")
        return current
    except FileNotFoundError:
        return {}
    except (json.JSONDecodeError, TypeError, ValueError, AttributeError) as exc:
        raise RuntimeError("The shared request-pacing state is invalid; refusing an unpaced request") from exc


def _write_state(state_path, state):
    temporary_path = state_path.with_name(state_path.name + f".{os.getpid()}.tmp")
    temporary_path.write_text(json.dumps(state) + "\\n", encoding="utf-8")
    os.replace(temporary_path, state_path)


def _state_is_halted(state_path):
    lock_path = state_path.with_name(state_path.name + ".lock")
    descriptor = _acquire_lock(lock_path)
    try:
        state = _read_state(state_path)
        return bool(state.get("halted")), state.get("halt_reason")
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)


def mark_request_schedule_halted(state_file, reason):
    """Atomically stop queued workers after a shared account safety condition."""
    if not state_file:
        return
    state_path = pathlib.Path(state_file)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = state_path.with_name(state_path.name + ".lock")
    descriptor = _acquire_lock(lock_path)
    try:
        state = _read_state(state_path)
        state["halted"] = True
        state["halt_reason"] = str(reason)[:300]
        state["updated_at_epoch"] = time.time()
        state.setdefault("next_request_at_epoch", time.time())
        state.setdefault("minimum_interval_seconds", None)
        _write_state(state_path, state)
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)


def wait_for_request_slot(state_file, minimum_interval_seconds=5.0):
    """Wait for a globally reserved request slot and persist the next slot atomically.

    Multiple run.py subprocesses use the same state file. An exclusive lock file
    serializes reservations, so retries and separate task batches share one schedule.
    A halt marker is checked both before reserving and after waiting, so queued
    workers can stop when any worker receives a rate-limit response.
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
    descriptor = _acquire_lock(lock_path)
    wait_seconds = 0.0
    try:
        current = _read_state(state_path)
        if current.get("halted"):
            raise BenchmarkHaltedError(current.get("halt_reason") or "The benchmark request schedule is halted")
        now = time.time()
        scheduled_at = max(now, float(current.get("next_request_at_epoch", 0.0)))
        wait_seconds = max(0.0, scheduled_at - now)
        current.update({
            "next_request_at_epoch": scheduled_at + interval,
            "minimum_interval_seconds": interval,
            "updated_at_epoch": now,
        })
        _write_state(state_path, current)
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)

    if wait_seconds:
        time.sleep(wait_seconds)
    halted, reason = _state_is_halted(state_path)
    if halted:
        raise BenchmarkHaltedError(reason or "The benchmark request schedule was halted while waiting")
    return wait_seconds
