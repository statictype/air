import { SearchIcon } from "lucide-react";
import type { Ref } from "react";
import { markGeometry, type NavPlacement, searchGeometry, unitsGeometry } from "./contract";
import { NavMark } from "./nav-mark";
import { NavTrigger } from "./nav-trigger";
import { NavUnitToggle } from "./nav-unit-toggle";

/** One glass piece. Below the scrim, so an open sheet dims it. */
const PIECE = "nav-surface fixed z-30 flex items-center justify-center rounded-full";

interface NavBarProps {
  placement: NavPlacement;
  isOpen: boolean;
  onOpenSearch: () => void;
  searchRef: Ref<HTMLButtonElement>;
}

/**
 * A units capsule and a round search button. Below `lg` they sit in the two
 * bottom corners; at `lg` and wider they stack at the bottom of the left
 * column, under the mark.
 */
export function NavBar({ placement, isOpen, onOpenSearch, searchRef }: NavBarProps) {
  const isColumn = placement.edge === "left";
  return (
    <>
      {isColumn && (
        <div className="fixed z-30" style={markGeometry()}>
          <NavMark />
        </div>
      )}
      <div className={PIECE} style={unitsGeometry(placement)}>
        <NavUnitToggle vertical={isColumn} />
      </div>
      <div className={PIECE} style={searchGeometry(placement)}>
        <NavTrigger
          ref={searchRef}
          icon={SearchIcon}
          label="Search"
          isOpen={isOpen}
          onClick={onOpenSearch}
        />
      </div>
    </>
  );
}
