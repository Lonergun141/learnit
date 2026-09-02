export interface DigestItem {
  topicId: string;
  topicName: string;
  title: string | null;
}

export interface DigestContent {
  items: DigestItem[];
  failedCount: number;
}

export function formatDigestMessage(
  content: DigestContent,
  appBaseUrl: string,
): string | null {
  if (content.items.length === 0 && content.failedCount === 0) return null;

  const groups = new Map<string, { name: string; titles: string[] }>();
  for (const item of content.items) {
    const group = groups.get(item.topicId) ?? { name: item.topicName, titles: [] };
    group.titles.push(item.title?.trim() || "Untitled source");
    groups.set(item.topicId, group);
  }

  const sections: string[] = ["LearnIT Daily Digest"];
  const baseUrl = appBaseUrl.replace(/\/+$/, "");
  for (const [topicId, group] of groups) {
    sections.push(
      [
        group.name,
        ...group.titles.map((title) => `• ${title}`),
        `${baseUrl}/topics/${encodeURIComponent(topicId)}`,
      ].join("\n"),
    );
  }

  if (content.failedCount > 0) {
    const noun = content.failedCount === 1 ? "item needs" : "items need";
    sections.push(
      `${content.failedCount} ${noun} attention. Check LearnIT for details.`,
    );
  }

  return sections.join("\n\n");
}
