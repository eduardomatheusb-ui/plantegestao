import { InstagramFeed } from "./InstagramFeed";
import { InstagramReels } from "./InstagramReels";
import { InstagramStories } from "./InstagramStories";
import { GenericPreview } from "./GenericPreview";

export type PostPreviewImagem = {
  id: string;
  src: string;
  alt?: string;
  contentType?: string | null;
};

export type PostPreviewCliente = {
  nome: string;
  nomeFantasia?: string | null;
  logoUrl?: string | null;
};

export type PostPreviewProps = {
  formato: string; // chave em FORMATOS_POST
  cliente: PostPreviewCliente;
  imagens: PostPreviewImagem[];
  legenda?: string | null;
};

/** Roteador visual — escolhe a moldura conforme a rede/formato. */
export function PostPreview(props: PostPreviewProps) {
  const f = (props.formato || "").toLowerCase();
  if (f === "instagram_feed" || f === "carrossel") return <InstagramFeed {...props} />;
  if (f === "reels" || f === "reels_capa") return <InstagramReels {...props} />;
  if (f === "stories") return <InstagramStories {...props} />;
  return <GenericPreview {...props} />;
}
