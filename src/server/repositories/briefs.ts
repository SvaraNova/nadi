import type { Pool } from "pg";
import type { InvestigationBrief } from "../../domain/investigation";
import { renderInvestigationMarkdown } from "../../domain/investigation-export";

export async function persistInvestigationBrief(pool: Pool, investigationId: string, brief: InvestigationBrief, author = "nadi-live-review"): Promise<string> {
  const markdown = renderInvestigationMarkdown(brief, new Date().toISOString());
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id: string; current_version: number }>("SELECT id,current_version FROM brief WHERE investigation_id=$1 ORDER BY created_at DESC LIMIT 1", [investigationId]);
    let briefId = existing.rows[0]?.id;
    const version = (existing.rows[0]?.current_version ?? 0) + 1;
    if (!briefId) {
      const created = await client.query<{ id: string }>("INSERT INTO brief(investigation_id,cohort_id,title,status,current_version) VALUES($1,$2,$3,'draft',$4) RETURNING id", [investigationId, brief.cohortId, brief.title, version]);
      briefId = created.rows[0].id;
    } else {
      await client.query("UPDATE brief SET current_version=$2,updated_at=now() WHERE id=$1", [briefId, version]);
    }
    await client.query("INSERT INTO brief_version(brief_id,version_number,content,markdown_export,author) VALUES($1,$2,$3,$4,$5)", [briefId, version, brief, markdown, author]);
    await client.query("COMMIT");
    return briefId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
