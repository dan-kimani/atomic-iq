/**
 * Applies WhatsApp formatting to text.
 * - Inline wrappers (*, _, ~, `): wraps selected text or inserts at cursor.
 * - Line prefixes (* , 1. , > ): prepends to the start of the line at cursor.
 */
export function applyFormat(
  text: string,
  selection: { start: number; end: number },
  wrapper: string,
  linePrefix?: boolean,
): string {
  if (linePrefix) {
    let lineStart = selection.start;
    while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;
    const before = text.slice(0, lineStart);
    const after = text.slice(lineStart);
    return before + wrapper + after;
  }

  const { start, end } = selection;
  if (start === end) {
    return text.slice(0, start) + wrapper + wrapper + text.slice(end);
  }
  return text.slice(0, start) + wrapper + text.slice(start, end) + wrapper + text.slice(end);
}
