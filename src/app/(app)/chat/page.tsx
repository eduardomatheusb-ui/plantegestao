import { requireUser } from "@/lib/rbac";
import { listarConversas, listarMensagens, podeAcessarCanal, CANAL_GERAL } from "@/lib/chat/queries";
import { PageHeader } from "@/components/shared/page-header";
import { ChatJanela } from "@/components/chat/chat-janela";

type PageProps = { searchParams: Promise<{ c?: string }> };

export default async function ChatPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const sp = await searchParams;

  let canal = sp.c && podeAcessarCanal(sp.c, user.id) ? sp.c : CANAL_GERAL;

  const [conversas, mensagens] = await Promise.all([
    listarConversas(user.id),
    listarMensagens(canal, user.id),
  ]);

  // Se o canal pedido não existe na lista (segurança), cai no Geral.
  if (!conversas.some((c) => c.canal === canal)) canal = CANAL_GERAL;

  return (
    <div className="space-y-4">
      <PageHeader titulo="Chat" descricao="Conversa livre da equipe — mural geral e mensagens diretas." />
      <ChatJanela
        conversas={conversas}
        canalAtual={canal}
        mensagensIniciais={mensagens}
        meuId={user.id}
      />
    </div>
  );
}
