/** Valor monetário por extenso em pt-BR (para recibos). Cobre até milhões. */

const UNI = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CEM = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  let s = c ? CEM[c] : "";
  if (r) {
    if (s) s += " e ";
    if (r < 20) s += UNI[r];
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      s += DEZ[d] + (u ? " e " + UNI[u] : "");
    }
  }
  return s;
}

function inteiroExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (milhoes) partes.push(ate999(milhoes) + (milhoes === 1 ? " milhão" : " milhões"));
  if (milhares) partes.push(milhares === 1 ? "mil" : ate999(milhares) + " mil");
  if (resto) partes.push(ate999(resto));
  return partes.join(" e ");
}

/** Ex.: 1234.56 → "mil duzentos e trinta e quatro reais e cinquenta e seis centavos". */
export function valorPorExtenso(valor: number): string {
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  let s = `${inteiroExtenso(reais)} ${reais === 1 ? "real" : "reais"}`;
  if (centavos > 0) {
    s += ` e ${inteiroExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`;
  }
  return s;
}
