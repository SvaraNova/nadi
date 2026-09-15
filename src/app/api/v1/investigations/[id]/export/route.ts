import { Pool } from "pg";
import { investigationFilename, renderInvestigationMarkdown } from "../../../../../../domain/investigation-export";
import { canAccessRequest } from "../../../../../../server/access";
import { readInvestigation } from "../../../../../../server/repositories/investigations";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!canAccessRequest(request.headers)) return Response.json({ error: { code: "FORBIDDEN", message: "Local access is required." } }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: { code: "NOT_FOUND", message: "Investigation not found." } }, { status: 404 });
  if (!process.env.DATABASE_URL) return Response.json({ error: { code: "NOT_CONFIGURED", message: "Database is not configured." } }, { status: 503 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const result = await readInvestigation(pool, id);
    if (!result) return Response.json({ error: { code: "NOT_FOUND", message: "Investigation is not complete." } }, { status: 404 });
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") === "id" ? "id" : "en";
    const markdown = renderInvestigationMarkdown(result.brief, new Date().toISOString(), lang);
    return new Response(markdown, { status: 200, headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${investigationFilename(id)}"`, "cache-control": "no-store" } });
  } finally { await pool.end(); }
}
