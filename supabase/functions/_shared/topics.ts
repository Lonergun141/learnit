export interface TopicCandidate {
  id: string;
  name: string;
  normalizedName: string;
}

function singularizeWord(word: string): string {
  if (word.length <= 3 || /(ss|us|is)$/.test(word)) return word;
  if (/ies$/.test(word)) return `${word.slice(0, -3)}y`;
  return word.endsWith("s") ? word.slice(0, -1) : word;
}

function initialism(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("");
}

export function normalizeTopicName(name: string): string {
  const displayName = name.trim().replace(/\s+/g, " ");

  if (displayName.length > 30) {
    throw new Error("Topic names must be 30 characters or fewer");
  }

  const normalized = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(singularizeWord)
    .join(" ");

  if (!normalized) throw new Error("Topic name is required");
  return normalized;
}

export function findDuplicateTopic(
  name: string,
  topics: readonly TopicCandidate[],
): TopicCandidate | null {
  const normalized = normalizeTopicName(name);

  return (
    topics.find((topic) => {
      const existing = normalizeTopicName(topic.normalizedName || topic.name);
      return (
        existing === normalized ||
        initialism(existing) === normalized ||
        initialism(normalized) === existing
      );
    }) ?? null
  );
}
