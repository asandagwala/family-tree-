/** An umbrella tree on the horizon: a wide, flat crown on a forked trunk. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      {/* Crown: flat-topped foliage, much wider than tall. */}
      <path
        d="M2.5 15.2 C1.6 13.8 3 12.6 4.8 12.8 C5.3 11.2 7.6 10.6 9.2 11.3 C10.2 9.6 13 9.1 14.6 10 C16.2 8.5 19.4 8.8 20.6 10.4 C22.4 9.8 24.9 10.6 25.4 12.2 C27.4 12 29.6 13.2 29.2 15 C27.2 16.1 22.4 15.9 19.8 15.5 C17.2 16.1 13 16.1 10.9 15.6 C8.2 16.2 4.2 16.2 2.5 15.2 Z"
        fill="currentColor"
      />
      {/* Trunk forking into spreading limbs. */}
      <path
        d="M15.8 27.5 C16 24.5 15.4 22.4 13.6 20.4 C12 18.6 10.2 17.2 7.8 15.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15.8 23.6 C17.2 21.2 19.2 19.2 21.4 17.8 C23 16.8 24.4 16 26 15.4 M13.6 20.4 C14 18.4 14.8 16.8 15.6 15.6 M19.6 19.2 C19.2 17.8 18.8 16.6 18.2 15.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* The horizon. */}
      <path d="M4 27.6 H28" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
