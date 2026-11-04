import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Hook to detect whether the component has mounted on the client.
 * Uses useSyncExternalStore to guarantee clean SSR hydration without cascading renders.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
