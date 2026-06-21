"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

function InlineButton({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Botão-ícone que dispara uma server action (bound) via form. */
export function InlineAction({
  action,
  children,
  className,
  title,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <form action={action}>
      <InlineButton className={className} title={title}>
        {children}
      </InlineButton>
    </form>
  );
}
