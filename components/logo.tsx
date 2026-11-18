/** A trunk branching into beadwork diamonds: a family tree in one mark. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <path
        d="M16 30 V17 M16 21 C12 20 9 17 8.5 13 M16 21 C20 20 23 17 23.5 13 M16 17 V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M16 2 L19.5 5.5 L16 9 L12.5 5.5 Z" fill="currentColor" />
      <path d="M8.5 6.5 L11.5 9.5 L8.5 12.5 L5.5 9.5 Z" fill="currentColor" opacity="0.75" />
      <path d="M23.5 6.5 L26.5 9.5 L23.5 12.5 L20.5 9.5 Z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
