import { useEffect, useRef } from "react";

/**
 * Returns a stable function reference that always invokes the latest
 * version of the supplied callback. Use this when a long-lived callback
 * (a useCallback-stable function, an event handler stored in a ref, an
 * imperative API consumer, etc.) needs to call another callback whose
 * identity changes on every render, without either side entering a
 * dependency loop.
 *
 * This is the "useEvent" / "useEventCallback" pattern popularized by
 * RFC https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 * but implemented with useRef + useEffect so it works on every React 19
 * release without waiting for an experimental compiler flag.
 *
 * Caveats:
 *   - The returned function is stable across renders (=== identity).
 *   - Calling it always invokes the LATEST callback, even if the caller
 *     captured the reference before the callback was last re-created.
 *   - The callback is invoked synchronously; React does NOT observe
 *     state updates triggered by it as a "render that depends on" the
 *     caller.
 */
export function useEvent<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const ref = useRef(fn);

  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  // useRef returns the same object identity forever; the returned arrow
  // function therefore has a stable identity too.
  return useRef((...args: TArgs) => ref.current(...args)).current;
}
