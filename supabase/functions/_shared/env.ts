interface RuntimeEnvironment {
  Deno?: { env: { get(name: string): string | undefined } };
  process?: { env?: Record<string, string | undefined> };
}

export function readRuntimeEnvironment(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & RuntimeEnvironment;
  return runtime.Deno?.env.get(name) ?? runtime.process?.env?.[name];
}

export function requireRuntimeEnvironment(names: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  const missing: string[] = [];

  for (const name of names) {
    const value = readRuntimeEnvironment(name)?.trim();
    if (value) values[name] = value;
    else missing.push(name);
  }

  if (missing.length > 0) {
    throw new Error(`Missing required runtime configuration: ${missing.join(", ")}`);
  }

  return values;
}
