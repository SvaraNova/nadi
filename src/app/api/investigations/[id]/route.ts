import { NextResponse } from "next/server";
import { getInvestigation, executeInvestigation } from "../../../../server/investigation/investigation-service";
import { assertLocalRequest } from "../../../../server/access";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  try { assertLocalRequest(_req.headers); } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const inv = getInvestigation(id);
  if (!inv) {
    return NextResponse.json({ error: "investigation_not_found" }, { status: 404 });
  }
  return NextResponse.json({ investigation: inv });
}

export async function POST(req: Request, { params }: Props) {
  const { id } = await params;
  try {
    assertLocalRequest(req.headers);
    const body = await req.json().catch(() => ({}));
    if (body.action === "cancel") {
      const inv = getInvestigation(id);
      if (inv) {
        inv.status = "cancelled";
        inv.events.push({
          type: "cancelled",
          at: new Date().toISOString(),
          message: "Investigation manually cancelled by analyst.",
        });
      }
      return NextResponse.json({ investigation: inv });
    }

    const updated = await executeInvestigation(id);
    return NextResponse.json({ investigation: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "execution_failed" }, { status: 500 });
  }
}
