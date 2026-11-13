import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function FoundationMark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 19V5h12" strokeWidth={2.6} />
      <path d="M8 12h7" strokeWidth={2.6} />
      <circle cx="18.2" cy="17.2" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.42 1.42M17.12 17.12l1.42 1.42M18.54 5.46l-1.42 1.42M6.88 17.12l-1.42 1.42" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.4 8.4 0 1 0 11.2 11.2Z" />
    </svg>
  );
}

export function SystemIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 3.75v16.5" />
      <path d="M12 3.75a8.25 8.25 0 0 1 0 16.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h5M13 7h7" />
      <circle cx="11" cy="7" r="1.75" />
      <path d="M4 17h7M15 17h5" />
      <circle cx="13" cy="17" r="1.75" />
      <path d="M4 12h2M10 12h10" />
      <circle cx="8" cy="12" r="1.75" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16" />
      <path d="m14.5 6.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11" />
      <path d="m7.5 10 4.5 4.5 4.5-4.5" />
      <path d="M4.5 17.5v2h15v-2" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="m15.2 15.2 4.3 4.3" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 20 4.2-1 10.9-10.9a2.3 2.3 0 0 0-3.2-3.2L5 15.8 4 20Z" />
      <path d="m14.8 5.9 3.3 3.3" />
    </svg>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="17" r="2.2" />
      <circle cx="17.5" cy="6" r="2.2" />
      <circle cx="18" cy="17" r="1.6" />
      <path d="m7.8 15.6 8-8M8.2 17h8.2" />
    </svg>
  );
}

export function NotesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h9.5L20 8v12.5H6z" />
      <path d="M15 3.5V8h5" />
      <path d="M9 12h8M9 15.5h8M9 8.5h3" />
    </svg>
  );
}

export function ReviewIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 9.5A8 8 0 0 1 19 8" />
      <path d="M19.5 14.5A8 8 0 0 1 5 16" />
      <path d="M4.5 4.5v5h5M19.5 19.5v-5h-5" />
    </svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c2.6 3 4.7 5 4.7 8.2a4.7 4.7 0 0 1-9.4 0c0-1.7.7-2.8 1.9-4.2.5 1.3 1.2 2 2.1 2.3-.5-2.3-.3-4.2.7-6.3Z" />
      <path d="M9.4 17.5c.3 1.5 1.2 2.3 2.6 2.6" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 13.8 10l6.7 2-6.7 2-1.8 6.5-1.8-6.5-6.7-2 6.7-2Z" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5H4.5v2.5A3.5 3.5 0 0 0 8 11M16 5h3.5v2.5A3.5 3.5 0 0 1 16 11" />
      <path d="M12 13v4M8.5 20.5h7M9.5 20.5V17h5v3.5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6.5h15M9 6.5v-2h6v2M7 6.5l.8 14h8.4l.8-14" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1Z" />
      <path d="m3.5 12.4 8.5 4.6 8.5-4.6" />
      <path d="m3.5 16.6 8.5 4.6 8.5-4.6" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r=".8" fill="currentColor" />
      <circle cx="4" cy="12" r=".8" fill="currentColor" />
      <circle cx="4" cy="18" r=".8" fill="currentColor" />
    </svg>
  );
}

export function FlowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="6" height="5" rx="1" />
      <rect x="15" y="15" width="6" height="5" rx="1" />
      <path d="M9 6.5h4.5a2 2 0 0 1 2 2v6.5" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-1.8 5-4.6 1.4 1.8-5Z" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.75v2.1M12 18.15v2.1M3.75 12h2.1M18.15 12h2.1" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.4C10.4 4.9 8 4.4 4.5 4.7v13.1c3.5-.3 5.9.2 7.5 1.7 1.6-1.5 4-2 7.5-1.7V4.7C16 4.4 13.6 4.9 12 6.4Z" />
      <path d="M12 6.4v13.1" />
    </svg>
  );
}

export function ZapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 2.8 5 13.4h5.3L9.8 21l8.7-10.8h-5.4Z" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 6.5c-2.8 1-4 3-4 6.5 0 2.4 1.2 4 3.2 4 1.7 0 2.9-1.2 2.9-2.8 0-1.6-1.1-2.7-2.6-2.7h-.5c.2-1.3 1-2.2 2.3-2.9ZM19 6.5c-2.8 1-4 3-4 6.5 0 2.4 1.2 4 3.2 4 1.7 0 2.9-1.2 2.9-2.8 0-1.6-1.1-2.7-2.6-2.7h-.5c.2-1.3 1-2.2 2.3-2.9Z" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.8 12S6 5.9 12 5.9 21.2 12 21.2 12 18 18.1 12 18.1 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function PenLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20l4-4 9.5-9.5a2.1 2.1 0 0 0-3-3L5 13l-1 7Z" />
      <path d="M4 20h16" />
    </svg>
  );
}
