import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogScrollProps {
  className?: string;
  children: ReactNode;
}

/**
 * The scrolling body of a dialog.
 *
 * `data-fade-b` is present only while content sits past the bottom edge;
 * `.dialog-scroll` reads it to open the mask. `HourlyCard` uses the same idiom
 * on its horizontal edges.
 *
 * The observer watches the child as well as the container: at `minmax(0,1fr)`
 * the container's own box does not change when its content grows.
 */
export function DialogScroll({ className, children }: DialogScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setMore(el.scrollTop < el.scrollHeight - el.clientHeight - 1);
    check();

    el.addEventListener("scroll", check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("dialog-scroll min-h-0 overflow-y-auto overscroll-contain", className)}
      data-fade-b={more ? "" : undefined}
    >
      {children}
    </div>
  );
}
