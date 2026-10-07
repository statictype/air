import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA_LG, MEDIA_XL, type NavPlacement, placementFromMatches } from "./contract";

/**
 * Two subscriptions rather than a resize listener, so a width change between
 * two states inside one band costs no render.
 */
export function useNavPlacement(): NavPlacement {
  const lg = useMediaQuery(MEDIA_LG);
  const xl = useMediaQuery(MEDIA_XL);
  return placementFromMatches(lg, xl);
}
