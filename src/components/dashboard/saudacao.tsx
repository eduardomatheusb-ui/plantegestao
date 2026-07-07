"use client";

import { useEffect, useState } from "react";
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudFog, Zap } from "lucide-react";
import type { Clima } from "@/lib/clima";

function iconeClima(descricao: string) {
  if (descricao.includes("limpo")) return Sun;
  if (descricao.includes("parcial")) return CloudSun;
  if (descricao.includes("nublado")) return Cloud;
  if (descricao.includes("neblina")) return CloudFog;
  if (descricao.includes("chuva") || descricao.includes("garoa")) return CloudRain;
  if (descricao.includes("neve")) return CloudSnow;
  if (descricao.includes("tempestade")) return Zap;
  return CloudSun;
}

export function Saudacao({
  nome,
  subtitulo,
  clima,
  mensagem,
}: {
  nome: string;
  subtitulo: string;
  clima: Clima | null;
  mensagem: string;
}) {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hora = agora?.getHours();
  const madrugada = hora !== undefined && hora < 5; // 0h–5h
  const saudacao =
    hora === undefined ? "Olá" : hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const dataFmt = agora
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(agora)
    : "";
  const horaFmt = agora
    ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(agora)
    : "";

  const IconeClima = clima ? iconeClima(clima.descricao) : null;

  return (
    <div className="space-y-1.5">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {madrugada ? <>Madrugando hoje, ein, {nome}? 🌙</> : <>{saudacao}, {nome} 👋</>}
      </h1>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground" suppressHydrationWarning>
        {dataFmt && <span className="first-letter:uppercase">{dataFmt}</span>}
        {horaFmt && <><span aria-hidden="true">·</span><span>{horaFmt}</span></>}
        {clima && IconeClima && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <IconeClima className="size-4" aria-hidden="true" />
              {clima.cidade} {clima.temp}°C, {clima.descricao}
            </span>
          </>
        )}
      </p>
      <p className="text-xs text-muted-foreground">{subtitulo}</p>
      {mensagem && <p className="pt-1 text-sm font-medium text-foreground">{mensagem}</p>}
    </div>
  );
}
