/**
 * Clima atual via Open-Meteo (gratuito, sem chave de API). Fixa a cidade de Betim/MG.
 * Não usa dado pessoal — só a coordenada da cidade. Falha silenciosa (retorna null).
 */

export type Clima = { temp: number; descricao: string; cidade: string };

const CIDADE = { nome: "Betim", lat: -19.9678, lon: -44.198 };

/** Mapeia o código WMO do Open-Meteo para uma descrição curta em pt-BR. */
function descricaoDoCodigo(code: number): string {
  if (code === 0) return "céu limpo";
  if (code <= 2) return "parcialmente nublado";
  if (code === 3) return "nublado";
  if (code <= 48) return "neblina";
  if (code <= 57) return "garoa";
  if (code <= 67) return "chuva";
  if (code <= 77) return "neve";
  if (code <= 82) return "pancadas de chuva";
  if (code <= 86) return "neve";
  return "tempestade";
}

export async function getClima(): Promise<Clima | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${CIDADE.lat}&longitude=${CIDADE.lon}` +
      `&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;
    if (typeof temp !== "number" || typeof code !== "number") return null;
    return { temp: Math.round(temp), descricao: descricaoDoCodigo(code), cidade: CIDADE.nome };
  } catch {
    return null;
  }
}
