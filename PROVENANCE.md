# PROVENANCE.md

## Proveniência, autoria, processo de criação e uso de inteligência artificial

Este documento registra a proveniência do projeto **Guia de Lógica, Fundamentos, Algoritmos e Estruturas de Dados (T01–T35)**, descrevendo a participação humana, o uso de ferramentas de inteligência artificial, os mecanismos de versionamento, os critérios de validação e as evidências de integridade preservadas ao longo do desenvolvimento.

Seu objetivo é documentar **como o projeto foi concebido, desenvolvido, revisado, validado e publicado**, distinguindo decisões humanas, assistência de IA, fontes canônicas e artefatos derivados.

> Este documento é um registro técnico de proveniência. Não substitui orientação jurídica nem eventual registro formal de obra ou software.

---

## 1. Identificação do projeto

- **Projeto:** Guia de Lógica, Fundamentos, Algoritmos e Estruturas de Dados
- **Escopo:** 35 tópicos, identificados de `T01` a `T35`
- **Fonte canônica:** arquivos Markdown dos tópicos
- **Controle de versão:** Git
- **Publicação prevista:** GitHub / GitHub Pages
- **Responsável pela curadoria e manutenção:** Diego

O projeto foi concebido como material técnico e educacional para estudo, consulta, revisão e publicação.

---

## 2. Princípio de responsabilidade humana

Ferramentas de inteligência artificial são utilizadas como **instrumentos auxiliares**, não como autoridade editorial ou decisória final.

As decisões finais permanecem sob responsabilidade humana.

Entre as contribuições humanas documentáveis estão:

- definição do objetivo e do escopo do projeto;
- divisão e ordenação dos tópicos `T01–T35`;
- definição da taxonomia curricular;
- definição da progressão pedagógica;
- criação e evolução dos contratos editoriais e técnicos;
- escolha das linguagens e tecnologias usadas nos exemplos;
- definição dos critérios de profundidade, qualidade e aceite;
- criação das regras de QA e Gate;
- seleção, rejeição, transformação ou aprovação de sugestões;
- reconciliação de análises divergentes;
- revisão técnica e editorial;
- definição de quais arquivos poderiam ou não ser alterados;
- versionamento;
- validação de regressões;
- aprovação das releases;
- definição da arquitetura de publicação.

A participação humana deve ser entendida como um processo de **concepção, direção, seleção, organização, transformação, revisão, validação e decisão**.

---

## 3. Papel das ferramentas de IA

Ferramentas de IA foram utilizadas, conforme a etapa, para:

- geração de rascunhos;
- geração de alternativas de explicação;
- sugestões de código;
- revisão técnica e textual;
- comparação entre abordagens;
- identificação de inconsistências;
- análise de regressões;
- proposição de exemplos;
- troubleshooting;
- auxílio na criação e execução de QA;
- síntese de pareceres;
- apoio à pesquisa;
- geração de artefatos derivados.

Saídas de IA **não são incorporadas automaticamente**.

Fluxo conceitual:

```text
requisito humano
      ↓
proposta assistida por IA
      ↓
análise
      ↓
comparação
      ↓
aceitação, rejeição ou alteração
      ↓
validação
      ↓
integração
      ↓
release
```

---

## 4. IA não é fonte única de decisão

O projeto não considera a concordância entre modelos como prova técnica.

Quando múltiplas IAs são utilizadas, suas respostas são tratadas como:

- pareceres;
- hipóteses;
- revisões independentes;
- mecanismos de descoberta de possíveis problemas.

A decisão final deve ser confrontada com:

- arquivos canônicos;
- documentação oficial;
- fontes técnicas;
- contratos do projeto;
- critérios de QA;
- evidências reproduzíveis.

Princípio:

```text
consenso entre modelos
≠
prova técnica
```

Preferência:

```text
reprodução
+
evidência
+
validação
+
decisão humana
```

---

## 5. Fonte canônica e artefatos derivados

Os 35 arquivos Markdown são a fonte canônica do conteúdo.

```text
Markdown T01–T35
        ↓
validação
        ↓
Gate Global
        ↓
release congelada
        ↓
build
        ↓
HTML / JSON / busca / PDF / outros derivados
```

Artefatos como HTML, JSON, índices, busca, PDF ou EPUB não substituem os Markdown como fonte de verdade.

Regra:

> **Editar conteúdo em um único lugar: o Markdown canônico.**

---

## 6. Governança documental

O processo de desenvolvimento utilizou documentos de controle e evidência, incluindo:

- Prompt Mestre;
- Guia Curricular;
- planos de ação;
- relatórios de revisão;
- relatórios de reconciliação;
- relatórios de QA;
- manifests;
- relatórios de Gate;
- históricos de versão;
- relatórios de patches;
- checksums SHA-256.

Esses documentos ajudam a demonstrar a evolução do projeto e as decisões tomadas durante sua construção.

---

## 7. Evolução dos tópicos

Os tópicos passaram por ciclos sucessivos de:

```text
criação
↓
revisão
↓
pareceres
↓
reconciliação
↓
correção
↓
QA
↓
nova versão
```

Sempre que aplicável:

- a versão foi incrementada;
- o histórico foi atualizado;
- o escopo da mudança foi registrado;
- regressões foram verificadas;
- alterações fora do escopo foram tratadas como falha de Gate.

---

## 8. Gate Global T01–T35

Antes da camada de publicação, o corpus completo passou por um Gate Global.

O ciclo final de patches autorizou alterações somente em:

```text
T13
T14
T22
T23
T24
T28
T32
T33
T34
```

Os demais **26 tópicos permaneceram byte-for-byte idênticos** ao baseline.

Resultado final:

```text
GATE GLOBAL: FECHADO
CORPUS: TECNICAMENTE CONGELÁVEL
PRÓXIMA ETAPA: RELEASE / CAMADA DE PUBLICAÇÃO
```

---

## 9. Release canônica congelada

Arquivo de referência:

```text
TOPICOS_01_35_GATE_GLOBAL_FINAL.zip
```

SHA-256:

```text
fb2974ecdcd492a220bbd9e021d4e5b1a1470183e03d22a696d2a59aa13ac04c
```

Esse hash identifica exatamente os bytes da release congelada.

> SHA-256 demonstra integridade e identidade do arquivo, não autoria isoladamente.

---

## 10. Baseline anterior ao Gate Delta

Baseline utilizado na regressão final:

```text
TOPICOS_01_35.zip
```

SHA-256:

```text
3c16d9a8294d3107a895bcf264811d2acd2b248abf8de1c3b3be8a704d19f771
```

Resultado da regressão:

```text
26/26 tópicos não autorizados
=
SHA-256 individual idêntico
```

Somente os 9 tópicos explicitamente autorizados foram alterados.

---

## 11. Evidências preservadas

Entre os artefatos de evidência produzidos no fechamento estão:

- `GATE_GLOBAL_DELTA.md`;
- `GATE_GLOBAL_PATCH_REPORT.md`;
- `GATE_GLOBAL_REGRESSION_26_SHA256.md`;
- `GATE_GLOBAL_DELTA_QA.json`;
- `GATE_GLOBAL_DELTA_QA.py`;
- `GATE_GLOBAL_DELTA_QA_README.md`;
- `TOPICOS_01_35_GATE_GLOBAL_FINAL_SHA256SUMS.txt`;
- `GATE_GLOBAL_DELTA_PACOTE_EVIDENCIAS.zip`.

Esses artefatos devem ser preservados junto às releases relevantes.

---

## 12. Git como trilha de proveniência

O Git deve preservar, sempre que possível:

- commits progressivos;
- mensagens de commit descritivas;
- diffs;
- tags;
- releases;
- datas;
- autoria dos commits;
- branches relevantes;
- documentação relacionada às mudanças.

O Git não é prova absoluta e isolada de autoria, mas constitui evidência importante quando combinado com:

```text
documentação
+
histórico de versões
+
decisões registradas
+
artefatos
+
hashes
+
releases
```

---

## 13. Registro de decisões

Decisões arquiteturais ou editoriais relevantes devem ser registradas.

Exemplo:

```text
Decisão:
Markdown permanece como fonte canônica.

Motivo:
Evitar manutenção duplicada entre Markdown e HTML.

Consequência:
HTML, JSON e índices são gerados automaticamente pelo build.
```

Decisões estruturais futuras podem ser registradas também como ADRs (*Architecture Decision Records*).

---

## 14. Conteúdo e software

O projeto contém ou poderá conter categorias diferentes de criação.

### Conteúdo

- textos;
- explicações;
- exercícios;
- exemplos;
- diagramas;
- taxonomia;
- organização curricular;
- estrutura editorial.

### Software

- scripts de build;
- JavaScript do site;
- CSS;
- templates;
- validadores;
- ferramentas de QA;
- automações;
- workflows do GitHub Actions.

Essas categorias podem utilizar licenças diferentes.

---

## 15. Licenciamento

Este documento não define automaticamente a licença do projeto.

O repositório deve indicar separadamente, quando aplicável:

- licença do conteúdo;
- licença do código;
- exceções;
- créditos de terceiros;
- dependências utilizadas.

Exemplo conceitual:

```text
content/
→ licença de conteúdo

src/
scripts/
→ licença de software

assets/
→ licença própria quando aplicável
```

---

## 16. Conteúdo e direitos de terceiros

O uso de IA não elimina a necessidade de respeitar direitos de terceiros.

Antes de incorporar materiais externos, verificar conforme aplicável:

- origem;
- autoria;
- licença;
- permissão de uso;
- atribuição;
- restrições de redistribuição;
- compatibilidade de licenças.

Isso se aplica a código, imagens, fontes, ícones, diagramas, textos, datasets e documentação.

---

## 17. Código gerado ou sugerido por IA

Código produzido com assistência de IA deve ser tratado como código sujeito a revisão.

Antes da incorporação, avaliar:

- correção;
- segurança;
- legibilidade;
- manutenção;
- compatibilidade;
- dependências;
- licenciamento;
- adequação arquitetural;
- similaridade suspeita com código externo.

Princípio:

```text
IA
+
code review
+
testes
+
QA
+
validação humana
```

---

## 18. Declaração pública de uso de IA

Texto recomendado para o repositório:

> Este projeto foi desenvolvido com assistência de ferramentas de inteligência artificial. A arquitetura, organização, curadoria, seleção, revisão, validação técnica, critérios de qualidade e decisões finais são realizadas pelo mantenedor humano. Saídas produzidas por IA são tratadas como propostas ou artefatos auxiliares e somente são incorporadas após análise e validação.

Versão curta:

> Desenvolvido com assistência de IA e curadoria, revisão e decisão humana.

---

## 19. O que este documento pretende demonstrar

Este documento **não** pretende afirmar que:

- todo caractere foi digitado manualmente;
- nenhuma automação foi utilizada;
- nenhuma IA participou do desenvolvimento.

Ele documenta a existência de um processo humano identificável de:

```text
concepção
+
direção
+
seleção
+
organização
+
transformação
+
revisão
+
validação
+
decisão
```

---

## 20. Conjunto de evidências

A proveniência deve ser observada pelo conjunto das evidências:

```text
Prompt Mestre
+
Guia Curricular
+
versões intermediárias
+
Git
+
diffs
+
relatórios
+
Gate
+
QA
+
manifests
+
SHA-256
+
release
```

Nenhum desses elementos, isoladamente, resolve toda questão de autoria. Em conjunto, formam uma trilha técnica consistente do processo de criação e manutenção.

---

## 21. Preservação

Para releases importantes, preservar:

- código-fonte e conteúdo canônico;
- documentos de governança;
- artefatos de QA;
- manifests;
- hashes;
- tags Git;
- GitHub Releases;
- changelog;
- documentos de decisão;
- pacotes de evidência.

---

## 22. Atualização deste documento

Este `PROVENANCE.md` deve ser atualizado quando houver mudança material em:

- processo de criação;
- uso de IA;
- governança;
- fonte canônica;
- arquitetura de publicação;
- QA;
- política de release;
- política de licenciamento.

---

## 23. Estado atual do projeto

```text
CONTEÚDO T01–T35
        ↓
Gate Global
        ↓
FECHADO
        ↓
corpus tecnicamente congelável
        ↓
release canônica
        ↓
camada de publicação
```

A partir desta release, o projeto entra na etapa de criação da camada de publicação, mantendo os Markdown T01–T35 como fonte canônica.

---

## 24. Resumo de proveniência

```text
IDEIA E OBJETIVO
      │
      ▼
REQUISITOS E TAXONOMIA
      │
      ▼
CRIAÇÃO ASSISTIDA POR FERRAMENTAS E IA
      │
      ▼
SELEÇÃO E TRANSFORMAÇÃO
      │
      ▼
REVISÃO E QA
      │
      ▼
GATE
      │
      ▼
RELEASE
      │
      ├── Git
      ├── versionamento
      ├── manifests
      └── SHA-256
      │
      ▼
PUBLICAÇÃO
```

---

## 25. Declaração final

Este projeto adota inteligência artificial como ferramenta de apoio ao desenvolvimento e documenta essa participação de forma transparente.

A responsabilidade pela definição do projeto, sua estrutura, seleção de conteúdo, decisões técnicas e editoriais, validação, incorporação das alterações e aprovação das releases permanece humana.

A rastreabilidade é preservada por meio de documentação, controle de versão, histórico de alterações, validações, relatórios, manifests e hashes criptográficos.

---

## 26. Patch de preflight da camada de publicação — 2026-09-26

Durante a Etapa E do pipeline de publicação, o preflight integral dos 35 Markdown reproduziu dois findings materiais na fonte canônica:

- `E-HTML-001` — T08: heading `Stream<T>` interpretado pelo CommonMark como raw HTML inline;
- `E-UTF8-NFC-001` — T24: duas ocorrências da palavra `corroboração` armazenadas em forma Unicode decomposta.

Com autorização explícita de continuidade, o corpus foi reaberto de forma mínima e controlada:

- T08 `0.4.2 → 0.4.3`;
- T24 `0.3.3 → 0.3.4`;
- 33/33 tópicos restantes permaneceram byte-for-byte idênticos à baseline anterior.

Baseline histórica preservada:

```text
TOPICOS_01_35_GATE_GLOBAL_FINAL(3).zip
SHA-256: fb2974ecdcd492a220bbd9e021d4e5b1a1470183e03d22a696d2a59aa13ac04c
```

Baseline corrente derivada para continuidade do pipeline:

```text
TOPICOS_01_35_GATE_GLOBAL_FINAL_E_PATCH01.zip
SHA-256: cc6c79034ab08ca209f87ce6f645d32ea480338a4cfe5234c9970d5cb1a61e37
```

Após o patch, a Etapa E foi reexecutada integralmente:

```text
PREFLIGHT: PASS
topics: 35/35
duplicate topic ids: 0
metadata errors: 0
unsupported constructs: 0
unicode normalization errors: 0
broken internal links: 0
```

O Gate Global histórico não é apagado nem reescrito: a nova baseline preserva sua genealogia e registra explicitamente que surgiu de findings do preflight da camada de publicação.

---
---

## 27. QA global da camada de publicação — Etapa J — 2026-09-26

Após a geração automática de Home + T01–T35, a Etapa J executou QA global sobre o staging completo.

Dois findings de implementação foram reproduzidos e corrigidos exclusivamente na camada de source/build:

- `J-HTML-001` — 51 saltos de hierarquia de headings em tópicos genéricos, como `h1 → h3`; o renderer passou a compactar somente saltos ascendentes não conformes, preservando IDs e conteúdo; T24/T25 foram excluídos da regra por já possuírem seus contratos validados;
- `J-REFLOW-001` — aproximadamente 5 CSS px de overflow horizontal em 320 px, causado pelo tooltip absoluto dos controles de código; o CSS responsivo passou a alinhar o tooltip pela borda direita em telas estreitas.

Arquivos de source alterados em J:

```text
scripts/build.js
scripts/lib/markdown.js
src/assets/css/code.css
```

O corpus T01–T35 permaneceu inalterado. Home, T24 e T25 permaneceram byte-for-byte idênticos em HTML à saída da Etapa I; a mudança CSS compartilhada foi revalidada em runtime e eliminou o overflow em 320 CSS px.

Validações principais:

```text
Node 24.11.1
npm ci: PASS
preflight: PASS
build Home + T01–T35: PASS
validate: PASS
broken local links/fragments: 0
duplicate ids: 0
ARIA IDREF inválidos: 0
heading-level jumps: 0
!important: 0
search-index targets: 11551/11551
build idempotente: PASS
negative gate / missing metadata: PASS (build bloqueou)
negative gate / unsupported construct: PASS (build bloqueou)
```

Deep tests de runtime confirmaram na T25: fallback local do Highlight.js, Mermaid local, tabs por clique e teclado, checklists, wrap de código, busca, tema, foco visível e drawer móvel. Em 320 CSS px, T25 e representantes de alto volume de tabelas/código/LABs/checklists não apresentaram overflow de documento; tabelas e código permaneceram contidos em regiões roláveis.

A Etapa J não promoveu release nem alterou versionamento/cache-busters. Essa decisão permanece reservada à Etapa K.

---

**Última atualização:** 2026-09-26  
**Estado:** Etapa J / QA global T01–T35 PASS; próxima etapa: Etapa K — versionamento real e release candidate.

---

## 28. Versionamento real e release candidate — Etapa K — 2026-09-26

Após o QA global PASS da Etapa J, a expansão funcional de Home + T25 para Home + T01–T35 foi classificada, pela convenção interna do projeto, como incremento **MINOR**.

Genealogia Web:

```text
baseline histórica: v1.0.54
versão-alvo:        v1.1.0
release candidate:  v1.1.0-rc.1
```

A baseline `v1.0.54` e suas fixtures não foram reescritas. O source corrente, os cache-busters, `package.json` e `data/package.json` da saída derivada passam a identificar `1.1.0-rc.1`.

A promoção para `v1.1.0` final permanece condicionada aos gates posteriores de GitHub Actions, GitHub Pages, smoke de produção e release final.

**Estado:** Etapa K / RC `v1.1.0-rc.1`; publicação ainda não executada.


---

## 29. GitHub Actions — Etapa L — 2026-09-26

Foi criado `.github/workflows/pages.yml` para produzir o artefato de GitHub Pages sem executar deploy. O workflow usa `ubuntu-24.04`, Node `24.21.0` pinado em `.node-version`, `npm ci --ignore-scripts`, preflight, build, validate, testes de contrato e validação do input de Pages.

Ações GitHub oficiais foram fixadas por SHA completo: `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0 e `actions/upload-pages-artifact` v5.0.0. As permissões do `GITHUB_TOKEN` foram limitadas a `contents: read`; `pages: write` e `id-token: write` não são concedidas nesta etapa porque não há deploy.

O repositório do projeto não estava disponível entre os repositórios GitHub conectados nesta sessão; portanto nenhum run hospedado foi inventado ou declarado. A Etapa L valida localmente o source/workflow e produz evidência compatível com o contrato do artefato Pages; a execução hospedada passa a ser pré-condição externa para o deploy da Etapa M.

**Estado:** Etapa L / workflow e artefato Pages preparados; deploy não executado.

---

## 30. GitHub Actions hospedado — Etapa L — 2026-09-27

O source foi publicado em `Diego-Ch4m4X/Guia_Logica`. O run hospedado canônico da Etapa L executou Node 24.21.0, `npm ci`, preflight, build, validate, testes 4/4, `validate:pages` e upload do artefato `github-pages`, todos com PASS. O artefato hospedado continha 83 arquivos e foi confirmado byte-for-byte contra o `dist/` validado.

**Estado:** Etapa L PASS.

---

## 31. GitHub Pages e smoke de produção — Etapa M — 2026-09-27

A fonte de publicação do GitHub Pages foi migrada para GitHub Actions. O workflow canônico passou a executar `actions/deploy-pages` com permissões restritas ao job de deploy (`pages: write` e `id-token: write`).

Produção:

`https://diego-ch4m4x.github.io/Guia_Logica/`

O run `36290915400`, no commit `75144c3a3b47d0ae8b1cbb3d0cc966635dea73ca`, concluiu build, deploy e smoke de produção com PASS. O smoke HTTP verificou Home, T01, T24, T25, T35, CSS, JavaScript, Mermaid local, Highlight.js local, `topics.json`, `search-index.json`, `data/package.json` e o cache-buster da RC. O artefato final da Etapa M manteve 83/83 arquivos byte-for-byte em relação ao artefato aprovado.

**Estado:** Etapa M PASS.

---

## 32. Promoção para release final — Etapa N — 2026-09-27

Após os gates hospedados de CI/CD e produção, a candidata `v1.1.0-rc.1` foi autorizada a ser promovida para a release final `v1.1.0`, mantendo a classificação interna **MINOR**.

A promoção altera somente metadata/versionamento/cache-busters correntes e documentação de estado. O corpus T01–T35, as fixtures históricas v1.0.54, os componentes, o conteúdo Web e os assets funcionais permanecem preservados.

A nova baseline canônica Web passa a ser `v1.1.0` somente após o manifesto e os artefatos finais da Etapa N passarem pela reabertura e verificação integral.


**Última atualização:** 2026-09-27
**Estado corrente:** Etapa N — promoção final v1.1.0 em fechamento.

---

## 33. Manutenção editorial e footer — v1.1.1 — 2026-09-27

A linha de manutenção `v1.1.1` é classificada como **PATCH** sobre a baseline canônica `v1.1.0`. O escopo é deliberadamente restrito e não altera o corpus técnico T01–T35, fixtures golden, vendor, CSS, templates estruturais fora do footer ou conteúdo pedagógico publicado.

Alterações desta manutenção:

- substituição do README técnico interno por um README editorial público alinhado à Home e ao estado real da coleção;
- uso do asset aprovado `src/assets/img/project-cover-hero.webp` no README;
- remoção de qualquer menção a FILOMATIA no README;
- correção do link GitHub no footer da Home e dos tópicos para `https://github.com/Diego-Ch4m4X/Guia_Logica`;
- remoção de `rel="me"` apenas do link para o repositório GitHub;
- sincronização do versionamento corrente, cache-busters, testes e smoke para `1.1.1`.

A baseline `v1.1.0` e sua tag permanecem imutáveis como referência histórica.

**Estado corrente:** linha de manutenção `v1.1.1`.
