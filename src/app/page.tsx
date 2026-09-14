import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <p className="eyebrow">NADI · ON DEVELOPMENT</p>
      <h1>Discover the signal. Follow the evidence.</h1>
      <p className="lede">The application foundation is ready. Data ingestion, deterministic discovery, evidence, and investigation will be delivered through the roadmap gates.</p>
      <p className="mode">Current mode: <strong>synthetic development foundation</strong></p>
      <Link href="/evidence">Explore synthetic evidence examples</Link>
      <br /><Link href="/radar">Explore synthetic signal radar</Link>
    </main>
  );
}
