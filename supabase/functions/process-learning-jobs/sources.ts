export const MAX_TOPIC_SOURCES = 20;
export const MAX_TOPIC_INPUT_CHARACTERS = 100_000;

interface TopicSourceRow {
  id: string;
  title: string | null;
  transcript: string;
  createdAt: string;
}

export interface SelectedTopicSource {
  id: string;
  title: string | null;
  content: string;
}

export function selectTopicSources(
  rows: readonly TopicSourceRow[],
  options: {
    maxSources?: number;
    maxCharacters?: number;
  } = {},
): SelectedTopicSource[] {
  const maxSources = Math.max(1, options.maxSources ?? MAX_TOPIC_SOURCES);
  const maxCharacters = Math.max(
    1,
    options.maxCharacters ?? MAX_TOPIC_INPUT_CHARACTERS,
  );
  const sorted = [...rows].sort((left, right) => {
    const byDate = right.createdAt.localeCompare(left.createdAt);
    return byDate || left.id.localeCompare(right.id);
  });
  const selected: SelectedTopicSource[] = [];
  let remainingCharacters = maxCharacters;

  for (const row of sorted) {
    if (selected.length >= maxSources || remainingCharacters <= 0) break;
    const content = row.transcript.trim().slice(0, remainingCharacters);
    if (!content) continue;

    selected.push({ id: row.id, title: row.title, content });
    remainingCharacters -= content.length;
  }

  return selected;
}
