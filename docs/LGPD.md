# Registro de tratamento de dados (LGPD) — TREM / Plante

> Registro interno das operações de tratamento (LGPD Art. 37). Modelo operacional —
> **revisar com o jurídico** antes de considerar conformidade plena.

## Controlador
Plante Ideias LTDA (Plante Comunicação) — CNPJ 48.560.442/0001-19.
**Encarregado (contato):** financeiro@planteideias.com.br *(definir DPO formal)*.

## Operadores (sub-processadores)
| Operador | Função | Local | Observação |
|---|---|---|---|
| Neon | Banco de dados | EUA (us-east-2) | DPA/cláusulas contratuais |
| Netlify | Hospedagem do app | EUA | DPA |
| Resend | Envio de e-mail | EUA | quando ativado |
| Focus NFe | Emissão de NFS-e | Brasil | quando ativado |

## Dados tratados, finalidade e base legal
| Categoria | Dados | Finalidade | Base legal (Art. 7) |
|---|---|---|---|
| Equipe | nome, e-mail, telefone, CPF, função, admissão, nascimento, **remuneração** (restrita) | gestão de pessoal e operação | execução de contrato / obrigação legal trabalhista |
| Clientes/Fornecedores | razão social, CNPJ/CPF, contato, endereço, condições | atendimento, contratos, fiscal | execução de contrato / obrigação legal |
| Operação | projetos, tarefas, comentários, anexos (links), financeiro | gestão da agência | legítimo interesse / execução de contrato |

## Transferência internacional (Art. 33)
Dados armazenados nos **EUA** (Neon/AWS us-east-2) por desempenho. Garantias: cláusulas
contratuais de proteção de dados dos operadores. **Pendência:** anexar os DPAs de
Neon/Netlify ao dossiê e registrar a decisão de transferência.

## Retenção e eliminação
Enquanto durar a relação + prazos legais (fiscais ~5 anos; trabalhistas conforme lei).
Preferir **arquivar** a excluir; eliminação/anonimização ao fim do prazo.

## Direitos do titular
Acesso, correção, eliminação, portabilidade e informação sobre compartilhamento —
atendidos via contato do encarregado.

## Medidas de segurança (técnicas e organizacionais)
- Acesso por **perfil/permissão** verificado no servidor; campos sensíveis (remuneração) só admin.
- Senhas com **hash bcrypt**; **bloqueio por tentativas** (anti-brute-force).
- **HTTPS/TLS**; banco fechado (só o app acessa).
- **Auditoria** (tabela Log) das ações relevantes; histórico por entidade.
- Backup: snapshots do Neon + banco antigo (SP) retido temporariamente.

## Pendências de conformidade (a fazer)
- [ ] **2FA** para perfis sensíveis (Sócio/Gestor/Financeiro).
- [ ] DPO formal nomeado.
- [ ] Anexar DPAs dos operadores; registrar decisão de transferência internacional.
- [ ] Rotina formal de retenção/eliminação.
- [ ] Rotacionar segredos que circularam (AUTH_SECRET, senha do banco).
- [ ] Revisão do Aviso de Privacidade (`/privacidade`) pelo jurídico.
