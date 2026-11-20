/**
 * "Ask the family": a speech bubble holding two beads (ochre and turquoise),
 * a conversation rather than a machine.
 */
export function AskIcon({
  size = 18,
  className = "",
  beads = true,
}: {
  size?: number;
  className?: string;
  beads?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17.5h-1A1.5 1.5 0 0 1 3 16V7a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {beads && (
        <>
          <path d="M9 9.2 L11.3 11.5 L9 13.8 L6.7 11.5 Z" fill="var(--ochre)" />
          <path d="M15 9.2 L17.3 11.5 L15 13.8 L12.7 11.5 Z" fill="var(--bead-blue)" />
        </>
      )}
    </svg>
  );
}
