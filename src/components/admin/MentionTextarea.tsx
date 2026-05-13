import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  id: string;
  full_name: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  teamMembers: TeamMember[];
  minRows?: number;
}

// Render note content with @mentions highlighted
export function renderWithMentions(text: string) {
  const parts = text.split(/(@\w[\w\s]*\w|\w+)/g);
  return parts.map((part, i) =>
    /^@\w/.test(part)
      ? <span key={i} className="text-primary font-medium">{part}</span>
      : part
  );
}

export function MentionTextarea({ value, onChange, placeholder, className, teamMembers, minRows = 3 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = mentionQuery !== null
    ? teamMembers.filter(m => m.full_name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursor = e.target.selectionStart;
    // Find last @ before cursor with no space after it
    const before = text.slice(0, cursor);
    const match = before.match(/@([\w]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
      setSelectedIdx(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member: TeamMember) => {
    if (!ref.current) return;
    const cursor = ref.current.selectionStart;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const inserted = `@${member.full_name} `;
    const next = before + inserted + after;
    onChange(next);
    setMentionQuery(null);
    // Restore focus and cursor position after state update
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const pos = (before + inserted).length;
      ref.current.focus();
      ref.current.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery === null || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filtered[selectedIdx]);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
    }
  };

  // Close if clicked outside
  useEffect(() => {
    const close = () => setMentionQuery(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={minRows}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
      />
      {mentionQuery !== null && filtered.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-56 rounded-md border bg-popover shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.slice(0, 6).map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent",
                i === selectedIdx && "bg-accent"
              )}
              onClick={() => insertMention(m)}
            >
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {m.full_name[0]}
              </span>
              {m.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
