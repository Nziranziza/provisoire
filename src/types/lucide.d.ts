// Hand-rolled declaration for the untyped `lucide` package (framework-agnostic core).
// Each named export is an array of [tagName, attrs] tuples — icon node data.
declare module 'lucide' {
  export type IconNode = [string, Record<string, string | number>][];

  // Declare every icon used in src/lib/icons.ts
  export const Lightbulb: IconNode;
  export const Zap: IconNode;
  export const Timer: IconNode;
  export const BookOpen: IconNode;
  export const Download: IconNode;
  export const Smartphone: IconNode;
  export const PartyPopper: IconNode;
  export const CircleCheck: IconNode;
  export const Check: IconNode;
  export const Info: IconNode;
  export const TriangleAlert: IconNode;
  export const CircleAlert: IconNode;
  export const TrafficCone: IconNode;
  export const Signpost: IconNode;
  export const Scale: IconNode;
  export const Target: IconNode;
  export const Flame: IconNode;
  export const Flag: IconNode;
  export const Bookmark: IconNode;
  export const SkipForward: IconNode;
  export const ArrowLeft: IconNode;
  export const ArrowRight: IconNode;
  export const ArrowUp: IconNode;
  export const ArrowDown: IconNode;
  export const ChevronDown: IconNode;
  export const ChevronRight: IconNode;
  export const Search: IconNode;
  export const SearchX: IconNode;
  export const Inbox: IconNode;
  export const X: IconNode;
  export const Menu: IconNode;
  export const House: IconNode;
  export const ListChecks: IconNode;
  export const GraduationCap: IconNode;
  export const WifiOff: IconNode;
  export const Wifi: IconNode;
  export const RefreshCw: IconNode;
  export const Share2: IconNode;
  export const Languages: IconNode;
  export const Sun: IconNode;
  export const Moon: IconNode;
  export const Monitor: IconNode;
}
