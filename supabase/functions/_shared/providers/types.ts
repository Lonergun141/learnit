export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface FetchedContent {
  content: string;
  title: string | null;
  author: string | null;
  providerMetadata: Record<string, JsonValue>;
}

export class ProviderError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean, options?: ErrorOptions) {
    super(message, options);
    this.name = "ProviderError";
    this.retryable = retryable;
  }
}
