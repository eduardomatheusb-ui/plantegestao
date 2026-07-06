import { requireUser, PAPEL_LABEL } from "@/lib/rbac";
import { carregarAcesso } from "@/lib/permissoes.server";
import { contarNaoLidas, listarNotificacoes } from "@/lib/notificacoes";
import { contarChatNaoLidas } from "@/lib/chat/queries";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AvisoSessao } from "@/components/layout/aviso-sessao";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [acesso, naoLidas, recentes, chatNaoLidas] = await Promise.all([
    carregarAcesso(user.id),
    contarNaoLidas(user.id),
    listarNotificacoes(user.id, 6),
    contarChatNaoLidas(user.id),
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-brand-yellow px-4 py-2 font-semibold text-ink-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <Sidebar caps={acesso.caps} chatNaoLidas={chatNaoLidas} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          nome={user.name}
          email={user.email}
          papelLabel={PAPEL_LABEL[acesso.papel]}
          podeAdmin={acesso.admin}
          caps={acesso.caps}
          naoLidas={naoLidas}
          recentes={recentes}
        />
        <Breadcrumbs />
        <main id="conteudo" tabIndex={-1} className="flex-1 p-4 focus:outline-none lg:p-8">{children}</main>
      </div>
      <ChatWidget meuId={user.id} naoLidasIniciais={chatNaoLidas} />
      <AvisoSessao />
    </div>
  );
}
