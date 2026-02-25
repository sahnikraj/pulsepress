export function AnalyticsGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {["Targeted", "Sent", "Shown", "CTR"].map((label) => (
        <article key={label} className="panel">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold">--</p>
        </article>
      ))}
      <article className="panel md:col-span-2">
        <h2 className="text-sm text-slate-400">Line Chart (CTR trend)</h2>
        <div className="mt-3 h-40 rounded bg-slate-800" />
      </article>
      <article className="panel">
        <h2 className="text-sm text-slate-400">Pie (Browser split)</h2>
        <div className="mt-3 h-40 rounded bg-slate-800" />
      </article>
      <article className="panel">
        <h2 className="text-sm text-slate-400">Heatmap (Hour x Weekday)</h2>
        <div className="mt-3 h-40 rounded bg-slate-800" />
      </article>
      <article className="panel md:col-span-2">
        <h2 className="text-sm text-slate-400">Geo Map</h2>
        <div className="mt-3 h-56 rounded bg-slate-800" />
      </article>
      <article className="panel md:col-span-2">
        <h2 className="text-sm text-slate-400">Paginated Table</h2>
        <div className="mt-3 h-56 rounded bg-slate-800" />
      </article>
    </section>
  );
}
