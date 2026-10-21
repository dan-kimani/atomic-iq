interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  mono?: boolean;
}

interface PreviewLine {
  raw: string;
  prefix: string | null;
  prefixMuted: boolean;
  segments: Segment[];
}

function parseLine(line: string): Segment[] {
  const segments: Segment[] = [];
  const patterns = [
    { regex: /\*(.+?)\*/g, prop: "bold" as const },
    { regex: /_(.+?)_/g, prop: "italic" as const },
    { regex: /~(.+?)~/g, prop: "strike" as const },
    { regex: /`(.+?)`/g, prop: "mono" as const },
  ];

  interface Match {
    start: number;
    end: number;
    text: string;
    prop: "bold" | "italic" | "strike" | "mono";
  }
  const matches: Match[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        prop: pattern.prop,
      });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  let pos = 0;
  for (const match of matches) {
    if (match.start < pos) continue;
    if (match.start > pos) {
      segments.push({ text: line.slice(pos, match.start) });
    }
    segments.push({ text: match.text, [match.prop]: true });
    pos = match.end;
  }
  if (pos < line.length) {
    segments.push({ text: line.slice(pos) });
  }

  return segments.length > 0 ? segments : [{ text: line }];
}

/** Parses WhatsApp-style markup into lines and inline spans for the live preview. */
export function parseMessage(text: string): PreviewLine[] {
  return text.split("\n").map((rawLine) => {
    let prefix: string | null = null;
    let line = rawLine;
    let prefixMuted = false;

    if (rawLine.startsWith("* ")) {
      prefix = "  •  ";
      line = rawLine.slice(2);
    } else if (/^\d+\.\s/.test(rawLine)) {
      const num = rawLine.match(/^(\d+)\.\s/)![1];
      prefix = `  ${num}.  `;
      line = rawLine.slice(num.length + 2);
    } else if (rawLine.startsWith("> ")) {
      prefix = "│ ";
      line = rawLine.slice(2);
      prefixMuted = true;
    }

    return { raw: rawLine, prefix, prefixMuted, segments: parseLine(line) };
  });
}
