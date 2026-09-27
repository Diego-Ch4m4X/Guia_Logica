# Guia Lógica — source/build canônico

Estado: **Etapa N — release final v1.1.0 em fechamento**.

Esta árvore industrializa o corpus T01–T35 em um site estático reproduzível para GitHub Pages.

## Baselines e genealogia

- corpus corrente: `TOPICOS_01_35_GATE_GLOBAL_FINAL_E_PATCH01.zip` (`SHA-256 cc6c79034ab08ca209f87ce6f645d32ea480338a4cfe5234c9970d5cb1a61e37`);
- golden master Web histórico: `LOGICA_HOME_T25_PILOTO_v1.0.54.zip`;
- release candidate histórica aprovada: `v1.1.0-rc.1`;
- release final corrente: `v1.1.0`;
- produção: `https://diego-ch4m4x.github.io/Guia_Logica/`.

## Regras

- `content/topics/` é a única fonte canônica do conteúdo T01–T35.
- `src/assets/` contém os assets aprovados; o único patch compartilhado posterior ao piloto foi o ajuste responsivo controlado em `code.css`, revalidado em QA.
- `tests/fixtures/*/golden.html` são saídas históricas de referência; **não são fontes editáveis**.
- `scripts/` implementa preflight, build, validate e validação do artefato Pages.
- `dist/` é derivado e não deve ser versionado nem editado manualmente.
- Node está pinado em `24.21.0`; `engines` mantém `>=24 <25`.
- nenhum `LICENSE` foi inventado; licenciamento do conteúdo exige decisão explícita do autor.

## Gates

- Etapa E / preflight 35/35: **PASS**;
- Etapa F / build mínimo Home + T25: **PASS**;
- Etapa G / reprodutibilidade T25: **PASS**;
- Etapa H / T24 stress test: **PASS**;
- Etapa I / build completo: **PASS**;
- Etapa J / QA global: **PASS**;
- Etapa K / versionamento e RC: **PASS**;
- Etapa L / GitHub Actions hospedado: **PASS**;
- Etapa M / GitHub Pages + smoke produção: **PASS**;
- Etapa N / release final `v1.1.0`: **em fechamento**.

## GitHub Actions / Pages

Workflow: `.github/workflows/pages.yml`.

Pipeline de `main`:

```text
npm ci
→ preflight
→ build Home + T01–T35
→ validate
→ testes
→ validate:pages
→ upload github-pages
→ deploy-pages
→ smoke HTTP de produção
```

O build usa `contents: read`; somente o job de deploy recebe `pages: write` e `id-token: write`. Actions externas permanecem pinadas por SHA completo.

## Release corrente

- classificação: **MINOR**;
- versão: `1.1.0`;
- cache-busters e metadata derivados: `1.1.0`;
- Home + T01–T35 publicados;
- fixtures v1.0.54 preservadas byte-for-byte.
