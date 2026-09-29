import StoredRadar from "../../stored";

export default async function StoredLiveRadarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoredRadar id={id} />;
}
