const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[),.!?:;\]}]+$/;

export function extractTelegramUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  return [...new Set(matches.map((url) => url.replace(TRAILING_PUNCTUATION, "")))];
}

function splitLongText(text: string, limit: number): string[] {
  if (text.length <= limit || /https?:\/\/\S+/.test(text)) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const candidate = remaining.slice(0, limit + 1);
    const breakAt = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(" "));
    const splitAt = breakAt > 0 ? breakAt : limit;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

export function splitTelegramMessage(message: string, limit = 3500): string[] {
  if (!message.trim()) return [];

  const paragraphs = message.trim().split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs.flatMap((part) => splitLongText(part, limit))) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= limit || !current) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) chunks.push(current);
  return chunks;
}
