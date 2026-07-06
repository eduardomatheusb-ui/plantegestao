/** Símbolo de acessibilidade: bonequinho (braços/pernas abertos) dentro de um círculo. */
export function IconeAcessibilidade({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      <path d="M6.8 10.3h10.4" />
      <path d="M12 8.6v4.2" />
      <path d="M9.2 17.4 12 12.8l2.8 4.6" />
    </svg>
  );
}
