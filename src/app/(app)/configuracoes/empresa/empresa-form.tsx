"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { salvarEmpresa, type EmpresaState } from "./actions";
import type { EmpresaDados } from "@/lib/empresa";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar dados da empresa"}</Button>;
}

export function EmpresaForm({ inicial }: { inicial: EmpresaDados }) {
  const [state, action] = useActionState<EmpresaState, FormData>(salvarEmpresa, {});

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div role="status" className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> Dados salvos. Os próximos documentos já usam estes dados.
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" name="marca" defaultValue={inicial.marca} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="razaoSocial">Razão social</Label>
          <Input id="razaoSocial" name="razaoSocial" defaultValue={inicial.razaoSocial} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" name="cnpj" defaultValue={inicial.cnpj} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={inicial.telefone} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail comercial <span className="text-xs font-normal text-muted-foreground">(propostas)</span></Label>
          <Input id="email" name="email" type="email" defaultValue={inicial.email} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emailFinanceiro">E-mail financeiro <span className="text-xs font-normal text-muted-foreground">(PI / produção)</span></Label>
          <Input id="emailFinanceiro" name="emailFinanceiro" type="email" defaultValue={inicial.emailFinanceiro} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" name="cep" defaultValue={inicial.cep} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Textarea id="endereco" name="endereco" rows={2} defaultValue={inicial.endereco} required />
        </div>
      </div>

      <fieldset className="space-y-5 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Dados fiscais (NFS-e)</legend>
        <p className="text-xs text-muted-foreground">
          Necessários para emitir Nota Fiscal de Serviço. Confirme com a contabilidade — em
          especial a <strong>alíquota de ISS</strong> e o <strong>item da lista de serviço</strong>.
        </p>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inscricaoMunicipal">Inscrição municipal</Label>
            <Input id="inscricaoMunicipal" name="inscricaoMunicipal" defaultValue={inicial.inscricaoMunicipal} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoMunicipioIbge">Código IBGE do município</Label>
            <Input id="codigoMunicipioIbge" name="codigoMunicipioIbge" defaultValue={inicial.codigoMunicipioIbge} placeholder="Betim = 3106705" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemListaServico">Item da lista de serviço (LC 116)</Label>
            <Input id="itemListaServico" name="itemListaServico" defaultValue={inicial.itemListaServico} placeholder="ex.: 17.06" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoTributarioMunicipio">Código de serviço / CNAE municipal</Label>
            <Input id="codigoTributarioMunicipio" name="codigoTributarioMunicipio" defaultValue={inicial.codigoTributarioMunicipio} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliquotaIss">Alíquota de ISS (%)</Label>
            <Input id="aliquotaIss" name="aliquotaIss" inputMode="decimal" defaultValue={inicial.aliquotaIss} placeholder="ex.: 2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regimeTributario">Regime tributário</Label>
            <Input id="regimeTributario" name="regimeTributario" defaultValue={inicial.regimeTributario} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="optanteSimplesNacional" defaultChecked={inicial.optanteSimplesNacional} className="size-4" />
            Optante pelo Simples Nacional
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="incentivadorCultural" defaultChecked={inicial.incentivadorCultural} className="size-4" />
            Incentivador cultural
          </label>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="urlEmissaoNfse">Link de emissão de NFS-e</Label>
            <Input id="urlEmissaoNfse" name="urlEmissaoNfse" type="url" defaultValue={inicial.urlEmissaoNfse} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">Portal onde a Plante emite a nota (Emissor Nacional ou o site da prefeitura de Betim). É o destino do botão &quot;Emitir nota&quot; nos lançamentos de receita.</p>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Metas</legend>
        <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="metaFaturamentoMensal">Meta de faturamento mensal (R$)</Label>
          <Input id="metaFaturamentoMensal" name="metaFaturamentoMensal" inputMode="decimal" defaultValue={inicial.metaFaturamentoMensal} placeholder="ex.: 50000" />
          <p className="text-xs text-muted-foreground">Usada no painel de Indicadores para comparar com a receita recebida no mês. Deixe vazio para não exibir meta.</p>
        </div>
      </fieldset>

      <Salvar />
    </form>
  );
}
