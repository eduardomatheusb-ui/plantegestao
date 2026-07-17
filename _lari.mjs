import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const u = await db.usuario.findFirst({ where:{ nome:{ contains:"Larissa" } }, select:{ id:true, nome:true } });
const base = { arquivado:false, status:{ isConcluido:false } };
const comoResp = await db.job.count({ where:{ ...base, responsavelId:u.id } });
const comoEnv = await db.job.count({ where:{ ...base, envolvidos:{ some:{ usuarioId:u.id } }, responsavelId:{ not:u.id } } });
console.log(`${u.nome}: na pauta → responsável=${comoResp}, envolvida(não resp)=${comoEnv}`);
// desses, quantos têm tarefa DELA já concluída (parte feita) e tarefa pendente de OUTRO?
const jobs = await db.job.findMany({ where:{ ...base, OR:[{responsavelId:u.id},{envolvidos:{some:{usuarioId:u.id}}}] },
  select:{ id:true, numero:true, titulo:true, responsavelId:true, tarefas:{ select:{ titulo:true, responsavelId:true, concluida:true, ordem:true } } } });
let parteFeita=0, semTarefa=0;
for(const j of jobs){
  const minhas = j.tarefas.filter(t=>t.responsavelId===u.id);
  const pendentesOutros = j.tarefas.filter(t=>!t.concluida && t.responsavelId && t.responsavelId!==u.id);
  if(j.tarefas.length===0){ semTarefa++; continue; }
  if(minhas.length>0 && minhas.every(t=>t.concluida) && pendentesOutros.length>0) parteFeita++;
}
console.log(`Total na pauta: ${jobs.length} | sem tarefas: ${semTarefa} | com a parte dela FEITA e pendente com outro: ${parteFeita}`);
await db.$disconnect();
