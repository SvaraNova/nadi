"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { useLanguage } from "../../../../lib/i18n";
import type { Route } from "next";

interface Props {
  params: Promise<{ signalRunId: string; cohortId: string }>;
}

export default function SignalDetailRedirectPage({ params }: Props) {
  const router = useRouter();
  const { signalRunId } = use(params);
  const { language } = useLanguage();
  const isId = language === "id";

  useEffect(() => {
    router.replace(`/radar/stored/${signalRunId}` as Route);
  }, [router, signalRunId]);

  return (
    <AppShell dataMode="live">
      <div className="card" style={{ padding: "48px", textAlign: "center" }}>
        <h2>{isId ? "Membuka data live..." : "Opening live data..."}</h2>
        <p>{isId ? "Mengambil putaran sinyal tersimpan dari PostgreSQL." : "Loading the persisted signal run from PostgreSQL."}</p>
      </div>
    </AppShell>
  );
}
