import { NextResponse } from "next/server";
import { listInvestigations, createInvestigation } from "../../../server/investigation/investigation-service";

export async function GET() {
  const items = listInvestigations();
  return NextResponse.json({ investigations: items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cohortId, signalRunId, question } = body;
    if (!cohortId || !signalRunId || !question) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }
    const inv = createInvestigation(cohortId, signalRunId, question);
    return NextResponse.json({ id: inv.id, investigation: inv });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "internal_error" }, { status: 500 });
  }
}
