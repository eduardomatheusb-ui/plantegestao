"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarCadastro, type FormState } from "@/lib/cadastros/actions";
import type { FieldDef } from "@/lib/cadastros/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar"}
    </Button>
  );
}

export function CrudForm({
  slug,
  id,
  fields,
  initial = {},
  dynamicOptions = {},
  cancelHref,
}: {
  slug: string;
  id: string | null;
  fields: FieldDef[];
  initial?: Record<string, unknown>;
  dynamicOptions?: Record<string, Option[]>;
  cancelHref: string;
}) {
  const action = salvarCadastro.bind(null, slug, id);
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        {fields.map((campo) => {
          const erro = state.fieldErrors?.[campo.name];
          const valorInicial = initial[campo.name];
          const opcoes = campo.dynamicOptions
            ? (dynamicOptions[campo.dynamicOptions] ?? [])
            : (campo.options ?? []);

          return (
            <div
              key={campo.name}
              className={cn("space-y-2", campo.colSpan === 2 && "sm:col-span-2")}
            >
              {campo.type !== "checkbox" && (
                <Label htmlFor={campo.name}>
                  {campo.label}
                  {campo.required && <span className="text-destructive"> *</span>}
                </Label>
              )}

              {campo.type === "textarea" ? (
                <Textarea
                  id={campo.name}
                  name={campo.name}
                  defaultValue={(valorInicial as string) ?? ""}
                  placeholder={campo.placeholder}
                  aria-invalid={!!erro}
                  aria-describedby={erro ? `${campo.name}-erro` : undefined}
                />
              ) : campo.type === "select" ? (
                <select
                  id={campo.name}
                  name={campo.name}
                  defaultValue={(valorInicial as string) ?? ""}
                  aria-invalid={!!erro}
                  aria-describedby={erro ? `${campo.name}-erro` : undefined}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{campo.required ? "Selecione…" : "— (nenhum)"}</option>
                  {opcoes.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : campo.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id={campo.name}
                    name={campo.name}
                    type="checkbox"
                    defaultChecked={Boolean(valorInicial)}
                    className="size-4 rounded border-input"
                  />
                  {campo.label}
                </label>
              ) : (
                <Input
                  id={campo.name}
                  name={campo.name}
                  type={
                    campo.type === "currency"
                      ? "number"
                      : campo.type === "number"
                        ? "number"
                        : campo.type
                  }
                  step={campo.type === "currency" ? "0.01" : undefined}
                  defaultValue={
                    valorInicial === null || valorInicial === undefined
                      ? ""
                      : campo.type === "date"
                        ? new Date(valorInicial as string | Date).toISOString().slice(0, 10)
                        : String(valorInicial)
                  }
                  placeholder={campo.placeholder}
                  aria-invalid={!!erro}
                  aria-describedby={erro ? `${campo.name}-erro` : undefined}
                />
              )}

              {campo.help && !erro && (
                <p className="text-xs text-muted-foreground">{campo.help}</p>
              )}
              {erro && (
                <p id={`${campo.name}-erro`} className="text-xs text-destructive">
                  {erro}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton />
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
