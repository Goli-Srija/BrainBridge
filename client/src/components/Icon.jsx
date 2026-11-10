// Inline SVG icon set (stroke icons, 24x24) — no external icon library needed.
const P = {
  dashboard: 'M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z',
  roadmap: 'M9 20l-6-3V4l6 3m0 13l6-3m-6 3V7m6 10l6 3V7l-6-3m0 13V4',
  calc: 'M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm1 4h8M8 11h2m4 0h2m-8 4h2m4 0h2',
  puzzle: 'M10 3a2 2 0 114 0v2h4v4h-2a2 2 0 100 4h2v4h-4v-2a2 2 0 10-4 0v2H6v-4h2a2 2 0 100-4H6V5h4V3z',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zm0 14a2 2 0 012-2h13',
  code: 'M8 9l-4 3 4 3m8-6l4 3-4 3M14 5l-4 14',
  chat: 'M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zm-9-9h18M12 3c2.5 2.7 3.5 5.7 3.5 9S14.5 18.3 12 21c-2.5-2.7-3.5-5.7-3.5-9S9.5 5.7 12 3z',
  bulb: 'M9 18h6m-5 3h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z',
  building: 'M4 21V5l8-3v19M12 21h8V9l-8-3M8 8v.01M8 12v.01M8 16v.01M16 12v.01M16 16v.01',
  mic: 'M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v3',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12l2 2 4-4',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zm8-3l2-1-2-4-2 .5a7 7 0 00-1.7-1L16 4h-4l-.3 2.5a7 7 0 00-1.7 1L8 7 6 11l2 1a7 7 0 000 2l-2 1 2 4 2-.5a7 7 0 001.7 1L12 22h4l.3-2.5a7 7 0 001.7-1l2 .5 2-4-2-1a7 7 0 000-2z',
  video: 'M15 10l5-3v10l-5-3M3 6h12v12H3z',
  logout: 'M15 17l5-5-5-5M20 12H9M11 21H5V3h6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-4a5 5 0 100-10 5 5 0 000 10zm0-4a1 1 0 100-2 1 1 0 000 2z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-14v5l3 3',
  check: 'M5 13l4 4L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  play: 'M7 4l13 8-13 8z',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  arrowLeft: 'M19 12H5m6-6l-6 6 6 6',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.3-4.3',
  download: 'M12 3v12m-5-5l5 5 5-5M4 21h16',
  upload: 'M12 21V9m-5 5l5-5 5 5M4 3h16',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3',
  external: 'M14 4h6v6m0-6L10 14M18 14v6H4V6h6',
  refresh: 'M4 4v6h6M20 20v-6h-6M5 15a8 8 0 0014 3M19 9A8 8 0 005 6',
  trophy: 'M8 21h8m-4-4v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 3m10-3h3a3 3 0 01-3 3',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5M3 16l9 5 9-5',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
};

export default function Icon({ name, size, className }) {
  const d = P[name] || P.dashboard;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
