import type { PostPreviewCliente } from "./PostPreview";

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Cabeçalho de post com avatar do cliente + handle. Usado por Feed/Reels/Stories. */
export function CabecalhoCliente({ cliente, tema = "claro" }: { cliente: PostPreviewCliente; tema?: "claro" | "escuro" }) {
  const nome = cliente.nomeFantasia || cliente.nome || "";
  const escuro = tema === "escuro";
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid size-8 place-items-center overflow-hidden rounded-full ring-2"
        style={{ background: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)", boxShadow: "inset 0 0 0 2px white" }}
      >
        {cliente.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cliente.logoUrl} alt={nome} className="size-6 rounded-full bg-white object-cover" />
        ) : (
          <span className="grid size-6 place-items-center rounded-full bg-white text-[10px] font-bold text-neutral-800">
            {iniciais(nome) || "•"}
          </span>
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <p className={`truncate text-[13px] font-semibold ${escuro ? "text-white" : "text-neutral-900"}`}>{nome || "cliente"}</p>
        <p className={`truncate text-[11px] ${escuro ? "text-white/80" : "text-neutral-500"}`}>Patrocinado</p>
      </div>
    </div>
  );
}

/** Legenda com truncamento visual (não interativo). */
export function LegendaTruncada({ nome, legenda }: { nome: string; legenda?: string | null }) {
  if (!legenda) return null;
  const t = legenda.trim();
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-snug text-neutral-800">
      <span className="font-semibold">{nome}</span>{" "}
      <span className="text-neutral-700">{t.length > 220 ? `${t.slice(0, 220)}… ` : t}</span>
      {t.length > 220 && <span className="text-neutral-500">mais</span>}
    </p>
  );
}
