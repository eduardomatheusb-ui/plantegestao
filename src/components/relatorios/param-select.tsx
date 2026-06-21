"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ParamSelect({
  paramKey,
  options,
  placeholder,
  ariaLabel,
}: {
  paramKey: string;
  options: { id: string; nome: string }[];
  placeholder: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(paramKey, value);
    else params.delete(paramKey);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      aria-label={ariaLabel}
      defaultValue={searchParams.get(paramKey) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 min-w-56 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
    </select>
  );
}
