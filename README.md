# Guia Lógica — source tree pós-piloto

Estado: **Etapa L — GitHub Actions / Pages artifact preparado para v1.1.0-rc.1**.

Esta árvore foi criada a partir das duas baselines congeladas pelo `CHECKPOINT_SOURCE_00`:

- conteúdo corrente: `TOPICOS_01_35_GATE_GLOBAL_FINAL_E_PATCH01.zip` (`SHA-256 cc6c79034ab08ca209f87ce6f645d32ea480338a4cfe5234c9970d5cb1a61e37`), derivado por patch controlado da baseline `(3)`;
- implementação Web: `LOGICA_HOME_T25_PILOTO_v1.0.54.zip`.

## Regras

- `content/topics/` é a única fonte canônica do conteúdo T01–T35.
- `src/assets/` deriva dos assets aprovados da v1.0.54; na Etapa J apenas `code.css` recebeu patch responsivo controlado (`J-REFLOW-001`), revalidado contra Home/T25.
- `tests/fixtures/*/golden.html` são saídas de referência para regressão; **não são fontes editáveis de conteúdo**.
- `scripts/` implementa o pipeline validado: preflight, build reproduzível e validate para Home + T01–T35.
- `dist/` é derivado e não deve ser editado manualmente.
- o build permanece sem dependências npm externas; `package-lock.json` é mantido e `npm ci` foi validado com Node 24.11.1 na Etapa J.
- Node está pinado exatamente em `24.21.0` para CI por `.node-version`; `engines` mantém o contrato `>=24 <25`.
- nenhum `LICENSE` foi inventado nesta etapa; termos de licenciamento exigem decisão/autorização própria.

## Templates

`src/templates/base.html` define o shell comum. `home.html` e `topic.html` são fragmentos por slots (`SLOT:*`) a serem consumidos pelo build futuro. O conteúdo pedagógico de tópico não é duplicado nos templates.

## Estado dos gates

- Etapa E / preflight 35/35: **PASS**;
- Etapa F / build mínimo Home + T25: **PASS**;
- Etapa G / reprodutibilidade T25: **PASS**;
- Etapa H / T24 stress test: **PASS**;
- Etapa I / build completo em staging: **PASS**;
- Etapa J / QA global: **PASS**.

## Release candidate corrente

- classificação de incremento (convenção interna): **MINOR**;
- baseline Web anterior: `v1.0.54`;
- versão-alvo: `v1.1.0`;
- candidata corrente: `v1.1.0-rc.1`;
- publicação: **não executada**;
- cache-busters e metadata derivados usam `1.1.0-rc.1`;
- fixtures históricas Home/T25 permanecem congeladas em `v1.0.54`.

## GitHub Actions

- workflow: `.github/workflows/pages.yml`;
- runner: `ubuntu-24.04`;
- permissões: `contents: read`;
- ações externas pinadas por SHA completo;
- pipeline: `npm ci` → preflight → build → validate → testes → validação do input Pages → upload do artefato `github-pages`;
- deploy não faz parte desta etapa e permanece reservado à Etapa M.

## Próximo gate

Etapa M — GitHub Pages, após o primeiro run hospedado da Etapa L e disponibilização do repositório para deploy.
