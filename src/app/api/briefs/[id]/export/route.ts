import { NextResponse } from "next/server";
import { getBrief } from "../../../../../server/briefs/brief-service";
import { renderBriefMarkdown } from "../../../../../domain/brief";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const brief = getBrief(id);
  if (!brief) {
    return new NextResponse("Brief not found", { status: 404 });
  }

  const markdown = renderBriefMarkdown(brief);
  const safeFilename = `nadi-brief-${brief.cohortId}-${brief.period.replace(/[^a-zA-Z0-9-]/g, "_")}-v${brief.currentVersion}.md`;

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
    },
  });
}
