import { NextResponse } from "next/server";
import { getBrief, updateBrief } from "../../../../server/briefs/brief-service";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const brief = getBrief(id);
  if (!brief) {
    return NextResponse.json({ error: "brief_not_found" }, { status: 404 });
  }
  return NextResponse.json({ brief });
}

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  try {
    const updates = await req.json();
    const updated = updateBrief(id, updates);
    return NextResponse.json({ brief: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "update_failed" }, { status: 500 });
  }
}
