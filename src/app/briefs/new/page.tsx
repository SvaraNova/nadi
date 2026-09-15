"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";

function NewBriefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get("investigationId");

  useEffect(() => {
    async function create() {
      if (!investigationId) {
        router.push("/briefs");
        return;
      }
      try {
        const res = await fetch("/api/briefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ investigationId }),
        });
        if (res.ok) {
          const data = await res.json();
          router.push(`/briefs/${data.id}`);
        } else {
          router.push("/briefs");
        }
      } catch {
        router.push("/briefs");
      }
    }
    create();
  }, [investigationId, router]);

  return (
    <div style={{ padding: "48px", textAlign: "center" }}>
      <h2>Generating Decision Brief Draft...</h2>
      <p style={{ color: "var(--slate-600)" }}>
        Synthesizing claims, citations, counterevidence, and register into an immutable deliverable.
      </p>
    </div>
  );
}

export default function NewBriefPage() {
  return (
    <AppShell dataMode="synthetic">
      <Suspense fallback={<div style={{ padding: "48px", textAlign: "center" }}>Loading...</div>}>
        <NewBriefContent />
      </Suspense>
    </AppShell>
  );
}
