import { JobCard } from "./job-card";
import type { JobListItem } from "@/lib/jobs/queries";

const DIA = 24 * 60 * 60 * 1000;

/** Agrupa jobs por proximidade do prazo. */
export function Timeline({
  jobs,
  statuses,
}: {
  jobs: JobListItem[];
  statuses: { id: string; nome: string }[];
}) {
  const agora = Date.now();
  const hojeFim = new Date();
  hojeFim.setHours(23, 59, 59, 999);

  const grupos: { titulo: string; jobs: JobListItem[] }[] = [
    { titulo: "Atrasados", jobs: [] },
    { titulo: "Hoje", jobs: [] },
    { titulo: "Próximos 7 dias", jobs: [] },
    { titulo: "Mais tarde", jobs: [] },
    { titulo: "Sem prazo", jobs: [] },
  ];

  for (const job of jobs) {
    if (!job.prazo) {
      grupos[4].jobs.push(job);
      continue;
    }
    const t = new Date(job.prazo).getTime();
    if (!job.status.isConcluido && t < agora && t < hojeFim.getTime() - DIA) grupos[0].jobs.push(job);
    else if (t <= hojeFim.getTime()) grupos[1].jobs.push(job);
    else if (t <= agora + 7 * DIA) grupos[2].jobs.push(job);
    else grupos[3].jobs.push(job);
  }

  const visiveis = grupos.filter((g) => g.jobs.length > 0);

  return (
    <div className="space-y-6">
      {visiveis.map((g) => (
        <section key={g.titulo} className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {g.titulo} <span className="tabular-nums">({g.jobs.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.jobs.map((job) => (
              <JobCard key={job.id} job={job} statuses={statuses} mostrarMover={false} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
