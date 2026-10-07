import { type PanInfo, useDragControls } from "motion/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  DISMISS_BOUNCE,
  DISMISS_DISTANCE_PX,
  DISMISS_VELOCITY_PX_PER_S,
} from "@/lib/motion/constants";
import type { DragAxis } from "./contract";

/** Motion writes `touch-action` onto the draggable only while it owns the
 *  listener. Starting the drag from `dragControls` instead leaves the panel's
 *  own scrolling to the browser, which is what lets scroll take precedence. */
const NO_DRAG = { drag: false as const };

interface DismissDragOptions {
  axis: DragAxis;
  enabled: boolean;
  onDismiss: () => void;
}

/**
 * Below 1280 a drag pushes the sheet back past the edge it came from. It maps
 * 1:1 in the placement's direction and does not move at all against it;
 * released past a distance or a velocity it closes, carrying the release
 * velocity into the exit, otherwise it springs back open.
 */
export function useDismissDrag({ axis, enabled, onDismiss }: DismissDragOptions) {
  const controls = useDragControls();

  if (!enabled || axis === null) {
    return { containerProps: NO_DRAG, onPointerDown: undefined };
  }

  const isHorizontal = axis === "left";
  const sign = axis === "down" ? 1 : -1;

  const containerProps = {
    drag: (isHorizontal ? "x" : "y") as "x" | "y",
    dragListener: false,
    dragControls: controls,
    dragDirectionLock: true,
    dragConstraints: { top: 0, right: 0, bottom: 0, left: 0 },
    // Elastic 1 on the dismiss side is the 1:1 mapping; 0 on the other three
    // means the panel does not move against its own collapse.
    dragElastic: {
      top: 0,
      bottom: axis === "down" ? 1 : 0,
      left: axis === "left" ? 1 : 0,
      right: 0,
    },
    dragTransition: DISMISS_BOUNCE,
    onDragEnd: (_event: unknown, info: PanInfo) => {
      const offset = isHorizontal ? info.offset.x : info.offset.y;
      const velocity = isHorizontal ? info.velocity.x : info.velocity.y;
      if (offset * sign >= DISMISS_DISTANCE_PX || velocity * sign >= DISMISS_VELOCITY_PX_PER_S) {
        onDismiss();
      }
    },
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (canScrollFurther(event.target, event.currentTarget, axis)) return;
    controls.start(event);
  };

  return { containerProps, onPointerDown };
}

/**
 * The panel's own scroll position takes precedence: a drag that starts on
 * content still able to scroll in the direction the drag would consume scrolls
 * instead of dismissing.
 */
function canScrollFurther(target: EventTarget | null, root: HTMLElement, axis: DragAxis): boolean {
  if (axis === "left") return false;
  let node = target instanceof Element ? target : null;
  while (node && node !== root.parentElement) {
    if (node instanceof HTMLElement && node.scrollHeight > node.clientHeight + 1) {
      return node.scrollTop > 0;
    }
    node = node.parentElement;
  }
  return false;
}
