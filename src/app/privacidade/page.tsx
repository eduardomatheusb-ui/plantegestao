import Link from "next/link";

export const metadata = { title: "Privacidade — TREM / Plante" };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-foreground">{titulo}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Aviso de Privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Sistema interno <strong>TREM</strong> — Plante Comunicação · última atualização: 21/06/2026
        </p>
      </header>

      <Secao titulo="1. Quem trata os dados">
        <p>
          O TREM é o sistema interno de gestão da <strong>Plante Comunicação</strong> (Plante Ideias LTDA,
          CNPJ 48.560.442/0001-19). Os dados são tratados pela Plante para operar a agência.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados tratamos">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Equipe:</strong> nome, e-mail, telefone, CPF, função, datas de admissão/nascimento e, com acesso restrito, remuneração.</li>
          <li><strong>Clientes/Fornecedores:</strong> razão social, CNPJ/CPF, contato, endereço e condições comerciais.</li>
          <li><strong>Operação:</strong> projetos, tarefas, comentários, anexos (links), histórico e dados financeiros.</li>
        </ul>
      </Secao>

      <Secao titulo="3. Finalidade e base legal">
        <p>
          Tratamos os dados para <strong>gestão interna da agência</strong> (projetos, prazos, financeiro,
          atendimento e cumprimento de obrigações fiscais/trabalhistas). Bases legais (LGPD Art. 7):
          execução de contrato, cumprimento de obrigação legal/regulatória e legítimo interesse.
        </p>
      </Secao>

      <Secao titulo="4. Compartilhamento e operadores">
        <p>Usamos prestadores que atuam como operadores, apenas para viabilizar o serviço:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Neon</strong> (banco de dados) e <strong>Netlify</strong> (hospedagem).</li>
          <li><strong>Resend</strong> (e-mail) e <strong>Focus NFe</strong> (nota fiscal) — quando ativados.</li>
        </ul>
        <p>Não vendemos dados nem os usamos para finalidades alheias à operação da agência.</p>
      </Secao>

      <Secao titulo="5. Transferência internacional">
        <p>
          Os dados são armazenados em servidores nos <strong>Estados Unidos</strong> (Neon/AWS, região us-east-2),
          por razões técnicas e de desempenho. A transferência ocorre com garantias contratuais do operador
          (cláusulas de proteção de dados), conforme LGPD Art. 33.
        </p>
      </Secao>

      <Secao titulo="6. Retenção">
        <p>
          Mantemos os dados enquanto durar a relação (trabalhista/comercial) e pelos prazos legais aplicáveis.
          Após isso, são eliminados ou anonimizados. Preferimos <strong>arquivar</strong> a excluir registros
          relevantes, preservando o histórico.
        </p>
      </Secao>

      <Secao titulo="7. Segurança">
        <p>
          Acesso por <strong>perfil/permissão</strong>, conexão criptografada (HTTPS/TLS), senhas com hash,
          bloqueio por tentativas e <strong>registro de auditoria</strong> das ações relevantes. Campos
          sensíveis (ex.: remuneração) só são visíveis a administradores.
        </p>
      </Secao>

      <Secao titulo="8. Direitos do titular">
        <p>
          Você pode solicitar acesso, correção, eliminação ou portabilidade dos seus dados. Contato:
          <strong> financeiro@planteideias.com.br</strong>.
        </p>
      </Secao>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        Este aviso é um resumo operacional e deve ser revisado pelo jurídico da Plante. ·{" "}
        <Link href="/login" className="underline hover:text-foreground">Voltar ao login</Link>
      </p>
    </main>
  );
}
