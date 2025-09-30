import { useEffect, useRef, useState } from "react";

export function useHoverWithin<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inside, setInside] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onEnter = () => setInside(true);
    const onLeave = () => setInside(false);

    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mouseleave", onLeave);

    return () => {
      node.removeEventListener("mouseenter", onEnter);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return { ref, inside };
}
