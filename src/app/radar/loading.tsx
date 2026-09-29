import { AppShell } from "../../components/layout/AppShell";

export default function RadarLoading() {
  return <AppShell dataMode="live"><main aria-busy="true" aria-live="polite" className="loading-page">
    <div className="loading-breadcrumb shimmer-line shimmer-line-short" />
    <div className="loading-header">
      <div className="shimmer-line shimmer-line-label" />
      <div className="shimmer-line shimmer-line-title" />
      <div className="shimmer-line shimmer-line-subtitle" />
    </div>
    <section className="loading-explainer card">
      <div className="shimmer-line shimmer-line-label" />
      <div className="shimmer-line" />
      <div className="shimmer-line shimmer-line-medium" />
    </section>
    <section className="loading-metrics" aria-label="Loading signal summary">
      <div className="loading-card card"><div className="shimmer-line shimmer-line-label" /><div className="shimmer-block" /><div className="shimmer-line shimmer-line-medium" /></div>
      <div className="loading-card card"><div className="shimmer-line shimmer-line-label" /><div className="shimmer-block" /><div className="shimmer-line shimmer-line-medium" /></div>
      <div className="loading-card card"><div className="shimmer-line shimmer-line-label" /><div className="shimmer-block" /><div className="shimmer-line shimmer-line-medium" /></div>
    </section>
    <section className="loading-table card">
      <div className="shimmer-line shimmer-line-title" />
      <div className="shimmer-table-row" />
      <div className="shimmer-table-row" />
      <div className="shimmer-table-row" />
      <div className="shimmer-table-row" />
    </section>
  </main></AppShell>;
}
