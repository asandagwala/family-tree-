import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Renders the assistant's small Markdown subset: paragraphs, bullet lists,
 * **bold**, *italic*, `code`, and person links written as [Name](person:ID).
 */
export function RichText({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length > 0 && lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rotate-45 bg-sage" />
                  <span>{inline(l.replace(/^\s*[-*•]\s+/, ""), onNavigate)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, onNavigate)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string, onNavigate?: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(person:([a-z0-9]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(
        <Link
          key={m.index}
          href={`/people/${m[2]}`}
          onClick={onNavigate}
          className="rounded-sm font-medium text-slate underline decoration-sage decoration-2 underline-offset-2 hover:text-night"
        >
          {m[1]}
        </Link>,
      );
    } else if (m[3]) out.push(<strong key={m.index}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={m.index}>{m[4]}</em>);
    else if (m[5])
      out.push(
        <code key={m.index} className="rounded bg-mist px-1 text-[0.9em]">
          {m[5]}
        </code>,
      );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
