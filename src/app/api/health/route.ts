export function GET(): Response {
  return Response.json(
    { status: "ok", service: "learnit-web" },
    { headers: { "cache-control": "no-store" } },
  );
}
