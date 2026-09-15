import { NextResponse } from "next/server";
import { listBriefs, createBriefFromInvestigation } from "../../../server/briefs/brief-service";

export async function GET() {
  const briefs = listBriefs();
  return NextResponse.json({ briefs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { investigationId } = body;
    if (!investigationId) {
      return NextResponse.json({ error: "missing_investigation_id" }, { status: 400 });
    }
    const brief = createBriefFromInvestigation(investigationId);
    return NextResponse.json({ id: brief.id, brief });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "internal_error" }, { status: 500 });
  }
}
