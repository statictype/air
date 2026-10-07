/**
 * Springs and durations for the nav's search sheet. Nothing asserts these; the
 * tests read the geometry in `components/nav/contract.ts`.
 */

export interface Spring {
  type: "spring";
  stiffness: number;
  damping: number;
  mass?: number;
}

/** A spring given as the time it takes to come to rest plus how far it passes
 *  its target on the way. Motion solves stiffness and damping from the pair. */
export interface TimedSpring {
  type: "spring";
  duration: number;
  bounce: number;
}

/** The search sheet, in and out. Bounce 0: it reaches its edge and stops,
 *  without passing it. */
export const SHEET_SPRING: TimedSpring = {
  type: "spring",
  duration: 0.45,
  bounce: 0,
};

/** Applied when a dismiss drag is released short of the threshold. */
export const DRAG_RELEASE_SPRING: Spring = {
  type: "spring",
  stiffness: 480,
  damping: 42,
};

/** `dragTransition` takes its springback stiffness and damping under these
 *  names rather than as a `Spring`. */
export const DISMISS_BOUNCE = {
  bounceStiffness: DRAG_RELEASE_SPRING.stiffness,
  bounceDamping: DRAG_RELEASE_SPRING.damping,
};

/** The focus pill that slides between menu rows. */
export const PILL_SPRING: Spring = {
  type: "spring",
  stiffness: 480,
  damping: 36,
  mass: 0.7,
};

/** Seconds. The whole of the reduced-motion path — crossfade, no movement. */
export const REDUCED_MOTION_FADE = { duration: 0.15 };

/** Scrim fade, both directions. Seconds. */
export const SCRIM_FADE = { duration: 0.22 };

/** Past either of these on release, the dismiss drag closes the panel. */
export const DISMISS_DISTANCE_PX = 96;
export const DISMISS_VELOCITY_PX_PER_S = 500;
