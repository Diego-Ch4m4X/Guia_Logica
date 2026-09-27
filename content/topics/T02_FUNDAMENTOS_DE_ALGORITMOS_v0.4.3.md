---
title: "Fundamentos de Algoritmos"
slug: "fundamentos-de-algoritmos"
description: "Guia técnico e didático sobre conceito de algoritmo, problema computacional, entrada/saída, propriedades, estado, correção, término, pré-condições, pós-condições e formas de representação."
category: "Lógica de Programação"
status: "baseline-estavel"
version: "0.4.3"

contract:
  source: "PROMPT_MESTRE_LOGICA_FUNDAMENTOS_ALGORITMOS_E_ESTRUTURAS_DE_DADOS_v1.10.0.md"

taxonomy:
  source: "GUIA_LOGICA_FUNDAMENTOS_ALGORITMOS_E_ESTRUTURAS_DE_DADOS_v2.1.0.md"
  nodes:
    - "2"
    - "2.1"
    - "2.2"
    - "2.3"
    - "2.4"
    - "2.5"

languages:
  python: true
  javascript: true
  java: true
  bash: true

difficulty:
  - fundamental
  - intermediario

tags:
  - "logica-de-programacao"
  - "algoritmos"
  - "correcao"
  - "estado"
  - "pre-condicao"
  - "pos-condicao"
  - "pseudocodigo"
  - "fluxograma"

created: "2026-09-13"
last_reviewed: "2026-09-16"
---

<a id="inicio"></a>

# Fundamentos de Algoritmos

> **Classificação curricular:** `[D] Obrigatório dominar`  
> **Nível:** A — Lógica de Programação  
> **Posição na taxonomia:** tópico 2  
> **Pré-requisito principal:** Pensamento Computacional e Resolução de Problemas  
> **Aprofundamentos posteriores:** rastreamento, recursão, análise de algoritmos, invariantes, busca, ordenação, estruturas de dados e estratégias algorítmicas

> **Como interpretar esta classificação:** `[D]` indica uma capacidade que deve evoluir até aplicação, depuração e transferência. Não significa que o leitor precise dominar todo o tópico antes de avançar para o próximo. `Nível A` identifica o núcleo de Lógica de Programação da taxonomia canônica.
>
> **Legenda curricular usada no capítulo:** `[D]` = obrigatório dominar; `[C]` = obrigatório conhecer; `[E]` = extensão/recomendado; `[P]` = progressivo. Essas marcas indicam prioridade curricular, não o nível atual de proficiência do leitor.
>
> **Nível curricular × dificuldade:** `Nível A` indica a posição deste tópico na taxonomia — o núcleo de Lógica de Programação. Já o campo `difficulty` do Front Matter descreve a faixa de dificuldade interna do material; por isso um tópico de Nível A pode conter aprofundamentos intermediários, especialmente quando marcados como `[C]`, `[E]` ou `[P]`.

> **Sobre este material:** este é o **T02** de uma série curricular de 35 tópicos. Referências a outros `Txx` indicam onde determinados conceitos serão retomados ou aprofundados; elas não transformam esses tópicos em pré-requisitos ocultos. O T02 foi escrito para continuar compreensível isoladamente.

---

## Resumo executivo

Um algoritmo não é simplesmente “um código”.

É uma **descrição precisa de um procedimento computacional** que transforma instâncias de entrada em resultados de acordo com um problema definido.

Uma visão útil é:

```text
PROBLEMA
↓
define quais resultados são corretos

ALGORITMO
↓
define como produzir um resultado

EXECUÇÃO
↓
aplica o algoritmo a uma instância concreta

PROGRAMA
↓
implementa um ou mais algoritmos em uma linguagem/ambiente
```

No MIT 6.006, um problema é modelado como uma relação entre entradas e saídas corretas, e um algoritmo resolve esse problema quando produz uma saída correta para cada entrada pertencente ao domínio considerado. Essa distinção é essencial:

> **correção pertence à relação entre especificação e comportamento; sintaxe válida não prova correção.**

Neste capítulo, algoritmo será estudado por cinco eixos:

```text
1. CONCEITO
2. PROPRIEDADES
3. ESTADO
4. CONTRATO E CORREÇÃO
5. REPRESENTAÇÃO
```

A ideia central é:

> **um algoritmo precisa ser compreensível como procedimento antes de ser traduzido para Python, JavaScript, Java ou Bash.**

---

## Decisão rápida

| Pergunta | Conceito |
|---|---|
| “O que deve ser resolvido?” | Problema / especificação |
| “Quais dados chegam?” | Entrada |
| “Qual resultado é aceitável?” | Saída / pós-condição |
| “Quais condições precisam valer antes?” | Pré-condição |
| “Quais passos são executados?” | Algoritmo |
| “O que muda durante a execução?” | Estado |
| “Como sei que o resultado está correto?” | Correção |
| “Como sei que o procedimento termina?” | Término / finitude |
| “A mesma entrada sempre segue o mesmo caminho?” | Determinismo / randomização |
| “Como descrevo sem depender de linguagem?” | Pseudocódigo / linguagem estruturada / fluxograma |
| “Código compilou/executou; logo está certo?” | Não — execução ≠ correção |

> **Primeira vez aqui?** Para construir primeiro o modelo mental essencial, consulte a [rota de primeira passagem](#modo-primeira-passagem) antes de seguir a leitura completa.

---

# Índice

- [Resumo executivo](#resumo-executivo)
- [Decisão rápida](#decisão-rápida)
- [1. Posição deste assunto](#1-posição-deste-assunto)
  - [1.1 Fronteira deste capítulo](#11-fronteira-deste-capítulo)
  - [1.2 Rastreabilidade da taxonomia canônica](#12-rastreabilidade-da-taxonomia-canônica)
- [2. Visão panorâmica](#2-visão-panorâmica)
- [3. Problema computacional × algoritmo](#3-problema-computacional--algoritmo)
  - [3.1 Problema](#31-problema)
  - [3.2 Algoritmo](#32-algoritmo)
  - [3.3 Instância](#33-instância)
  - [3.4 Por que essa distinção importa](#34-por-que-essa-distinção-importa)
  - [3.5 Formulação do MIT 6.006](#35-formulação-do-mit-6006)
  - [3.6 Um problema pode admitir mais de uma saída correta](#36-um-problema-pode-admitir-mais-de-uma-saída-correta)
- [4. O que é um algoritmo](#4-o-que-é-um-algoritmo)
  - [4.1 “Procedimento”](#41-procedimento)
  - [4.2 “Computacional”](#42-computacional)
  - [4.3 “Bem definido”](#43-bem-definido)
  - [4.4 “Entrada”](#44-entrada)
  - [4.5 “Saída”](#45-saída)
  - [4.6 “Classe de instâncias”](#46-classe-de-instâncias)
  - [4.7 Algoritmo não é sinônimo de “fórmula”](#47-algoritmo-não-é-sinônimo-de-fórmula)
- [5. Entrada, processamento e saída](#5-entrada-processamento-e-saída)
  - [5.1 Entrada](#51-entrada)
  - [5.2 Processamento](#52-processamento)
  - [5.3 Saída](#53-saída)
  - [5.4 Entrada válida × inválida](#54-entrada-válida--inválida)
  - [5.5 Transformação de estado](#55-transformação-de-estado)
- [6. Características de um algoritmo](#6-características-de-um-algoritmo)
  - [6.1 Clareza](#61-clareza)
  - [6.2 Precisão](#62-precisão)
  - [6.3 Ordem](#63-ordem)
  - [6.4 Finitude](#64-finitude)
  - [6.5 Efetividade](#65-efetividade)
  - [6.6 Correção](#66-correção)
  - [6.7 Determinismo — quando aplicável](#67-determinismo--quando-aplicável)
  - [6.8 Generalidade](#68-generalidade)
- [7. Algoritmo × programa × função × heurística](#7-algoritmo--programa--função--heurística)
  - [7.1 Algoritmo](#71-algoritmo)
  - [7.2 Programa](#72-programa)
  - [7.3 Função](#73-função)
  - [7.4 Código](#74-código)
  - [7.5 Heurística](#75-heurística)
  - [7.6 Receita](#76-receita)
  - [7.7 Especificação](#77-especificação)
- [8. Estado de execução](#8-estado-de-execução)
  - [8.1 Estado inicial](#81-estado-inicial)
  - [8.2 Estado intermediário](#82-estado-intermediário)
  - [8.3 Estado final](#83-estado-final)
  - [8.4 Transição de estado](#84-transição-de-estado)
  - [8.5 Controle também faz parte do estado](#85-controle-também-faz-parte-do-estado)
  - [8.6 Estado observável × estado conceitual](#86-estado-observável--estado-conceitual)
- [9. Pré-condições e pós-condições](#9-pré-condições-e-pós-condições)
  - [9.1 Pré-condição](#91-pré-condição)
  - [9.2 Pós-condição](#92-pós-condição)
  - [9.3 Contrato](#93-contrato)
  - [9.4 Pré-condição não é validação](#94-pré-condição-não-é-validação)
  - [9.5 Pós-condição não é “saída de exemplo”](#95-postcondição-não-é-saída-de-exemplo)
  - [9.6 Por que contratos ajudam](#96-por-que-contratos-ajudam)
- [10. Correção](#10-correção)
  - [10.1 Correção para uma instância](#101-correção-para-uma-instância)
  - [10.2 Correção geral](#102-correção-geral)
  - [10.3 Teste ≠ prova](#103-teste--prova)
  - [10.4 Argumento de correção](#104-argumento-de-correção)
  - [10.5 Correção parcial × correção total `[E]`](#105-correção-parcial--correção-total-e)
  - [10.6 Exemplo de algoritmo incorreto](#106-exemplo-de-algoritmo-incorreto)
- [11. Término e finitude](#11-término-e-finitude)
  - [11.1 Um algoritmo clássico precisa terminar](#111-um-algoritmo-clássico-precisa-terminar)
  - [11.2 Loop infinito](#112-loop-infinito)
  - [11.3 Variante de loop `[E]`](#113-variante-de-loop-e)
  - [11.4 Recursão](#114-recursão)
  - [11.5 Programa que nunca termina pode estar correto?](#115-programa-que-nunca-termina-pode-estar-correto)
- [12. Determinismo e algoritmos randomizados](#12-determinismo-e-algoritmos-randomizados)
  - [12.1 Determinístico](#121-determinístico)
  - [12.2 Randomizado](#122-randomizado)
  - [12.3 Randomização não significa “sem regras”](#123-randomização-não-significa-sem-regras)
  - [12.4 Exemplo conceitual](#124-exemplo-conceitual)
  - [12.5 Por que esta seção existe aqui?](#125-por-que-esta-seção-existe-aqui)
- [13. Invariantes — primeira introdução](#13-invariantes--primeira-introdução)
  - [13.1 Exemplo](#131-exemplo)
  - [13.2 Estrutura clássica de prova com invariante](#132-estrutura-clássica-de-prova-com-invariante)
  - [13.3 Não confundir invariante com “variável que não muda”](#133-não-confundir-invariante-com-variável-que-não-muda)
  - [13.4 Por que invariantes importam](#134-por-que-invariantes-importam)
- [14. Representações de algoritmos](#14-representações-de-algoritmos)
  - [14.1 Linguagem natural](#141-linguagem-natural)
  - [14.2 Linguagem natural estruturada](#142-linguagem-natural-estruturada)
  - [14.3 Pseudocódigo](#143-pseudocódigo)
  - [14.4 Fluxograma](#144-fluxograma)
  - [14.5 Código](#145-código)
  - [14.6 Representação ≠ algoritmo](#146-representação--algoritmo)
- [15. Pseudocódigo](#15-pseudocódigo)
  - [15.1 Não existe uma gramática universal](#151-não-existe-uma-gramática-universal)
  - [15.2 Propriedades desejáveis](#152-propriedades-desejáveis)
  - [15.3 Convenções deste material](#153-convenções-deste-material)
  - [15.4 Pseudocódigo pode ser mais abstrato que código](#154-pseudocódigo-pode-ser-mais-abstrato-que-código)
  - [15.5 Cuidado com “mágica”](#155-cuidado-com-mágica)
  - [15.6 Farrell: pseudocódigo × fluxograma](#156-farrell-pseudocódigo--fluxograma)
- [16. Fluxograma](#16-fluxograma)
  - [16.1 Exemplo conceitual](#161-exemplo-conceitual)
  - [16.2 Vantagens](#162-vantagens)
  - [16.3 Limitações](#163-limitações)
  - [16.4 Regra deste guia](#164-regra-deste-guia)
- [17. Exemplo progressivo — encontrar o maior valor](#17-exemplo-progressivo--encontrar-o-maior-valor)
  - [17.1 Problema](#171-problema)
  - [17.2 Contrato](#172-contrato)
  - [17.3 Estratégia](#173-estratégia)
  - [17.4 Estado](#174-estado)
  - [17.5 Inicialização correta](#175-inicialização-correta)
  - [17.6 Inicialização incorreta](#176-inicialização-incorreta)
  - [17.7 Pseudocódigo](#177-pseudocódigo)
  - [17.8 Rastreamento](#178-rastreamento)
  - [17.9 Invariante](#179-invariante)
  - [17.10 Correção informal](#1710-correção-informal)
  - [17.11 Término](#1711-término)
  - [17.12 Complexidade — apenas intuição](#1712-complexidade--apenas-intuição)
- [18. Transferência para quatro linguagens](#18-transferência-para-quatro-linguagens)
  - [18.1 Python](#181-python)
  - [18.2 JavaScript](#182-javascript)
  - [18.3 Java](#183-java)
  - [18.4 Bash](#184-bash)
  - [18.5 Comparação semântica](#185-comparação-semântica)
- [19. Erros conceituais frequentes](#19-erros-conceituais-frequentes)
  - [19.1 “Algoritmo é código”](#191-algoritmo-é-código)
  - [19.2 “Se executou, está correto”](#192-se-executou-está-correto)
  - [19.3 “Se passou em vários testes, está provado”](#193-se-passou-em-vários-testes-está-provado)
  - [19.4 “Algoritmo sempre é determinístico”](#194-algoritmo-sempre-é-determinístico)
  - [19.5 “Todo programa deve terminar”](#195-todo-programa-deve-terminar)
  - [19.6 “Pré-condição é a mesma coisa que `if` de validação”](#196-pré-condição-é-a-mesma-coisa-que-if-de-validação)
  - [19.7 “Pós-condição é um exemplo”](#197-postcondição-é-um-exemplo)
  - [19.8 “Pseudocódigo possui sintaxe oficial”](#198-pseudocódigo-possui-sintaxe-oficial)
  - [19.9 “Fluxograma é obrigatório”](#199-fluxograma-é-obrigatório)
  - [19.10 “Inicializar máximo com zero funciona”](#1910-inicializar-máximo-com-zero-funciona)
  - [19.11 “Algoritmo correto automaticamente é eficiente”](#1911-algoritmo-correto-automaticamente-é-eficiente)
- [20. Como raciocinar sobre um algoritmo](#20-como-raciocinar-sobre-um-algoritmo)
  - [20.1 Qual é o problema?](#201-qual-é-o-problema)
  - [20.2 Qual é a pré-condição?](#202-qual-é-a-pré-condição)
  - [20.3 Qual é o estado?](#203-qual-é-o-estado)
  - [20.4 Qual é a inicialização?](#204-qual-é-a-inicialização)
  - [20.5 Qual é o progresso?](#205-qual-é-o-progresso)
  - [20.6 Qual propriedade deve permanecer verdadeira?](#206-qual-propriedade-deve-permanecer-verdadeira)
  - [20.7 Qual é a condição de término?](#207-qual-é-a-condição-de-término)
  - [20.8 O estado final implica a pós-condição?](#208-o-estado-final-implica-a-pós-condição)
  - [20.9 Existem contraexemplos?](#209-existem-contraexemplos)
  - [20.10 A representação esconde alguma operação difícil?](#2010-a-representação-esconde-alguma-operação-difícil)
- [Índice operacional de Problemas Reais `PR-*`](#problemas-reais)
  - [`PR-T02-01` — Descrição informal → contrato verificável](#pr-t02-01)
  - [`PR-T02-02` — Encontrar um contraexemplo mínimo](#pr-t02-02)
  - [`PR-T02-03` — Inicializar estado preservando o invariante](#pr-t02-03)
  - [`PR-T02-04` — Diagnosticar ausência de término](#pr-t02-04)
  - [`PR-T02-05` — Pseudocódigo preciso sem operação mágica](#pr-t02-05)
  - [`PR-T02-06` — Testar problema com múltiplas saídas corretas](#pr-t02-06)
- [🔎 Troubleshooting sistemático](#troubleshooting-sistematico)
  - [`TS-T02-01` — máximo incorreto quando todos os valores são negativos](#ts-t02-01)
  - [`TS-T02-02` — falha com entrada vazia: bug ou violação da pré-condição?](#ts-t02-02)
  - [`TS-T02-03` — loop não termina](#ts-t02-03)
  - [`TS-T02-04` — pseudocódigo não é implementável sem adivinhar a etapa central](#ts-t02-04)
  - [`TS-T02-05` — teste rejeita uma saída correta](#ts-t02-05)
  - [`TS-T02-06` — “passou em muitos testes” foi tratado como prova de correção](#ts-t02-06)
- [21. Laboratórios](#21-laboratórios)
  - [🧪 Laboratório 1 — Problema × algoritmo](#lab-t02-01)
  - [🧪 Laboratório 2 — Caça ao contraexemplo](#lab-t02-02)
  - [🧪 Laboratório 3 — Pré e pós-condição](#lab-t02-03)
  - [🧪 Laboratório 4 — Estado e rastreamento](#lab-t02-04)
  - [🧪 Laboratório 5 — Representações](#lab-t02-05)
  - [🧪 Laboratório 6 — Transferência](#lab-t02-06)
- [22. Exercícios](#22-exercícios)
  - [22.1 Classifique](#221-classifique)
  - [22.2 Corrija a definição](#222-corrija-a-definição)
  - [22.3 Domínio](#223-domínio)
  - [22.4 Estado](#224-estado)
  - [22.5 Pós-condição](#225-pós-condição)
  - [22.6 Término](#226-término)
  - [22.7 Não término](#227-não-término)
  - [22.8 Invariante](#228-invariante)
  - [22.9 Determinismo](#229-determinismo)
  - [22.10 Pseudocódigo](#2210-pseudocódigo)
  - [22.11 Contraexemplo](#2211-contraexemplo)
  - [22.12 Correção × eficiência](#2212-correção--eficiência)
  - [22.13 Desafio integrador](#2213-desafio-integrador)
- [23. Evidências de domínio](#23-evidências-de-domínio)
  - [Você deve conseguir explicar](#você-deve-conseguir-explicar)
  - [Você deve conseguir aplicar](#você-deve-conseguir-aplicar)
  - [Você deve conseguir depurar](#você-deve-conseguir-depurar)
  - [Você deve conseguir transferir](#você-deve-conseguir-transferir)
  - [Nível 5 — dominar/ensinar](#nível-5--dominarensinar)
- [24. Checklist de consulta rápida](#24-checklist-de-consulta-rápida)
- [25. Glossário](#25-glossário)
- [26. Referências](#26-referências)
  - [26.1 Taxonomia canônica](#261-taxonomia-canônica)
  - [26.2 Currículo](#262-currículo)
  - [26.3 MIT OpenCourseWare](#263-mit-opencourseware)
  - [26.4 Stanford](#264-stanford)
  - [26.5 Fontes locais efetivamente consultadas](#265-fontes-locais-efetivamente-consultadas)
  - [26.6 Como as fontes foram usadas](#266-como-as-fontes-foram-usadas)
- [27. Histórico de versões](#27-histórico-de-versões)

---

# 1. Posição deste assunto

No tópico anterior, o foco foi:

```text
ENTENDER
→ DECOMPOR
→ ABSTRAIR
→ MODELAR
→ PLANEJAR
```

Agora a pergunta muda:

> **o que transforma esse plano em um procedimento computacional suficientemente preciso para ser executado, analisado e verificado?**

Fluxo:

```text
PROBLEMA
↓
ESPECIFICAÇÃO
↓
ALGORITMO
↓
IMPLEMENTAÇÃO
↓
EXECUÇÃO
↓
RESULTADO
```

Cada camada pode estar certa ou errada independentemente das demais.

Exemplo:

```text
problema entendido corretamente
+
algoritmo incorreto
+
código que implementa perfeitamente o algoritmo incorreto
=
resultado incorreto
```

Ou:

```text
algoritmo correto
+
implementação errada
=
programa incorreto
```

## 1.1 Fronteira deste capítulo

Este capítulo introduz:

- conceito de algoritmo;
- propriedades fundamentais;
- entrada e saída;
- estado;
- pré-condição;
- pós-condição;
- correção;
- término;
- representação.

Ainda NÃO aprofunda:

- Big O;
- análise assintótica;
- provas formais completas;
- invariantes complexos;
- técnicas de projeto;
- estruturas de dados avançadas.

Esses assuntos aparecem depois.

## 1.2 Rastreabilidade da taxonomia canônica

Os números `2.1`–`2.5` abaixo pertencem ao **Guia curricular v2.1.0**; não são a numeração editorial das seções deste T02.

| Nó do Guia | Capacidade curricular | Destino principal neste tópico |
|---|---|---|
| `2.1` | conceito de algoritmo; entrada, processamento, saída, início e término | §§3–5 e §11 |
| `2.2` | clareza, precisão, finitude, ordem, determinismo quando aplicável e correção | §6 e §§10–12 |
| `2.3` | estado inicial, intermediário, final e transformações | §8 e exemplo progressivo §17 |
| `2.4` | pré-condições e pós-condições `[C]` | §9, com ligação à correção em §10 |
| `2.5` | linguagem natural, descrição estruturada, pseudocódigo e fluxograma | §§14–16 |

A tabela serve como rastreabilidade **Guia → conteúdo**. Conceitos auxiliares — problema computacional, instância, invariantes introdutórias e troubleshooting — existem para sustentar essas capacidades sem alterar a taxonomia-mãe.

[↑ Voltar ao índice](#índice)

---

# 2. Visão panorâmica

<a id="visao-panoramica"></a>

## 🗺️ Visão panorâmica — o mapa antes dos detalhes

Esta seção funciona como **caderno rápido de consulta** e como contrato de cobertura deste tópico. Depois de estudar o capítulo, a meta é permitir recuperar em pouco tempo as relações centrais entre problema, algoritmo, estado, contrato, correção, término e representação.

A síntese combina contribuições complementares: a taxonomia v2.1.0 delimita o núcleo curricular; o MIT 6.006 fornece uma formulação operacional de problema, saída correta e algoritmo; CLRS reforça pseudocódigo, invariantes e o raciocínio por inicialização, manutenção e término; Skiena enfatiza que a ideia do algoritmo deve permanecer visível e que contraexemplos simples são uma ferramenta central para refutar soluções incorretas; Farrell compara pseudocódigo e fluxogramas como representações da mesma lógica; Stanford CS161 reforça o papel de invariantes e argumentos de correção.

### 2.1 Mapa do domínio — o que existe

```text
FUNDAMENTOS DE ALGORITMOS
│
├── problema computacional
│   ├── domínio de entradas
│   ├── instâncias concretas
│   ├── critérios de saída correta
│   └── uma ou mais saídas válidas por entrada, conforme o problema
│
├── algoritmo
│   ├── procedimento
│   ├── passos / operações
│   ├── ordem
│   ├── decisões
│   ├── repetição / recursão
│   └── término
│
├── estado
│   ├── estado inicial
│   ├── estados intermediários
│   ├── estado final
│   └── transições
│
├── contrato
│   ├── pré-condição
│   ├── pós-condição
│   └── domínio assumido
│
├── correção
│   ├── resultado correto para uma instância
│   ├── correção geral
│   ├── contraexemplo
│   ├── invariante
│   └── término
│
├── propriedades
│   ├── clareza
│   ├── precisão
│   ├── ordem
│   ├── efetividade
│   ├── finitude
│   └── determinismo quando aplicável
│
└── representação
    ├── linguagem natural
    ├── linguagem natural estruturada
    ├── pseudocódigo
    ├── fluxograma
    └── código
```

### 2.2 Fluxo principal — problema → contrato → execução → verificação

```mermaid
flowchart LR
    P[Problema] --> D[Domínio e critérios de saída]
    D --> A[Algoritmo]
    A --> I[Estado inicial]
    I --> T[Transições de estado]
    T --> F[Estado final / saída]
    F --> C{Satisfaz a pós-condição?}
    C -- Não --> X[Contraexemplo / falha]
    C -- Sim --> U{Vale para todas as entradas válidas?}
    U -- Ainda não demonstrado --> R[Argumento de correção + testes]
    U -- Sim --> OK[Correção no escopo declarado]
```

Leitura textual:

1. o problema define quais entradas pertencem ao domínio e o que conta como saída correta;
2. o algoritmo define um procedimento para transformar uma instância em resultado;
3. a execução percorre estados por meio de transições;
4. o estado final deve satisfazer a pós-condição;
5. um único caso correto confirma apenas aquela instância;
6. um contraexemplo é suficiente para refutar uma afirmação universal de correção;
7. para correção total, além do resultado correto, é necessário que o procedimento termine no escopo assumido.

### 2.3 Consulta rápida — conceito × pergunta × risco

| Conceito | Pergunta central | Função | Risco se ignorado |
|---|---|---|---|
| Problema | “Que relação entre entrada e saída deve ser satisfeita?” | definir correção | implementar o procedimento certo para o problema errado |
| Instância | “Qual entrada concreta estou analisando?” | tornar raciocínio verificável | generalizar a partir de exemplo insuficiente |
| Algoritmo | “Qual procedimento produz uma saída?” | transformar entrada em resultado | confundir ideia com sintaxe ou API |
| Estado | “O que é verdadeiro agora durante a execução?” | rastrear comportamento | não localizar onde a execução divergiu |
| Pré-condição | “O que deve valer antes?” | delimitar o contrato | julgar algoritmo fora do domínio assumido |
| Pós-condição | “O que deve valer ao terminar?” | reconhecer sucesso | confundir saída específica com propriedade correta |
| Invariante | “O que permanece verdadeiro nos pontos definidos?” | apoiar raciocínio de correção | validar apenas exemplos isolados |
| Variante/progresso | “O que aproxima a execução do término?” | raciocinar sobre finitude | criar loop/recursão sem progresso |
| Contraexemplo | “Existe entrada válida que quebra a afirmação?” | refutar correção | aceitar solução plausível sem estressá-la |
| Pseudocódigo | “Como expresso a ideia com precisão suficiente?” | comunicar algoritmo sem prender à sintaxe | esconder operações vagas atrás de aparência formal |
| Fluxograma | “A estrutura visual ajuda a ver decisões e fluxo?” | comunicar controle | tratar diagrama como requisito ou prova de correção |
| Código | “Como esta linguagem realiza o procedimento?” | implementação concreta | confundir compilação/execução com correção |

### 2.4 Pergunta prática → mecanismo inicial

| Se você está pensando... | Comece por... |
|---|---|
| “Não sei exatamente o que seria uma resposta correta.” | escreva domínio, pré-condições e pós-condição antes do algoritmo |
| “Meu algoritmo funciona para estes exemplos.” | procure um contraexemplo pequeno e casos de fronteira |
| “A lista pode estar vazia?” | decida se vazio está fora da pré-condição ou se deve ser tratado pelo algoritmo |
| “O loop deveria terminar, mas não termina.” | identifique estado, condição de término e medida de progresso |
| “Não sei como inicializar o acumulador/máximo.” | escolha estado inicial que já satisfaça o invariante |
| “Pseudocódigo parece correto, mas não consigo implementar.” | procure operações vagas, mágicas ou sem contrato |
| “Duas saídas diferentes podem estar corretas?” | verifique se o problema permite múltiplas saídas válidas |
| “O programa executou sem erro.” | compare a saída com a pós-condição; execução não implica correção |
| “Quero provar que está errado.” | encontre uma instância válida cuja saída viole o contrato |
| “Quero comparar implementações em linguagens diferentes.” | preserve problema, contrato e estratégia; depois compare semântica concreta |

### 2.5 Não confundir

| Não confundir | Diferença |
|---|---|
| **Problema × algoritmo** | problema define o que é correto; algoritmo define como produzir uma saída |
| **Algoritmo × programa** | algoritmo é o procedimento/ideia; programa é uma implementação executável em ambiente concreto |
| **Instância × problema geral** | instância é uma entrada concreta; problema descreve uma classe de entradas e saídas corretas |
| **Pré-condição × validação** | pré-condição é parte do contrato assumido; validação é uma estratégia de implementação para detectar/recusar entrada |
| **Pós-condição × saída de exemplo** | pós-condição é uma propriedade geral; exemplo é apenas uma instância |
| **Teste × prova/argumento de correção** | teste encontra evidência e falhas; não cobre automaticamente todo o domínio |
| **Finitude × “todo programa deve encerrar”** | algoritmo clássico costuma ser especificado para terminar; servidores e sistemas reativos podem ter execução contínua |
| **Determinismo × correção** | um algoritmo pode ser randomizado e ainda possuir contrato/correção adequados ao seu modelo |
| **Invariante × valor imutável** | invariante é uma propriedade preservada; variáveis individuais podem mudar |
| **Representação × algoritmo** | pseudocódigo, fluxograma e código são formas de expressar o procedimento, não o procedimento em si |

### 2.6 Microexemplos canônicos

#### Exemplo A — inicialização que preserva o contrato

Problema:

```text
encontrar o maior valor de uma sequência não vazia
```

Inicialização frágil:

```text
max_so_far = 0
```

Contraexemplo:

```text
[-8, -2, -11]
```

Resultado incorreto:

```text
0
```

Inicialização coerente:

```text
max_so_far = values[0]
```

A diferença não é cosmética: a segunda inicialização começa com um valor pertencente ao domínio e permite estabelecer o invariante “`max_so_far` é o maior item já processado”.

#### Exemplo B — pré-condição não é a mesma coisa que `if`

Contrato:

```text
PRE: values não é vazio
POST: retorna o maior elemento de values
```

Duas implementações podem respeitar o mesmo problema de maneiras diferentes:

```text
A) o chamador garante a pré-condição
B) a função verifica vazio e sinaliza erro explicitamente
```

A pré-condição descreve o domínio assumido. O `if` é uma decisão de implementação.

#### Exemplo C — uma entrada pode admitir mais de uma saída correta

Problema conceitual:

```text
dado um conjunto com elementos duplicados,
retorne uma posição em que o valor alvo ocorre
```

Se o alvo aparece em várias posições, mais de uma resposta pode satisfazer a especificação. Um teste que exige uma única posição fixa pode estar testando uma implementação específica em vez do problema.

### 2.7 Problemas reais representativos

| ID | Problema | Capacidades centrais | Destino |
|---|---|---|---|
| `PR-T02-01` | transformar uma descrição de problema em contrato verificável | domínio, entrada, saída, pré/pós-condição | [Problemas Reais](#problemas-reais) |
| `PR-T02-02` | encontrar contraexemplo para algoritmo aparentemente correto | instância, correção, fronteira, contraexemplo | [Problemas Reais](#problemas-reais) |
| `PR-T02-03` | escolher inicialização que preserve o invariante | estado, inicialização, invariante | [Problemas Reais](#problemas-reais) |
| `PR-T02-04` | diagnosticar procedimento que não termina | estado, progresso, condição de término, variante | [Problemas Reais](#problemas-reais) |
| `PR-T02-05` | expressar algoritmo sem esconder operações vagas em pseudocódigo | precisão, representação, implementabilidade | [Problemas Reais](#problemas-reais) |
| `PR-T02-06` | validar uma solução quando o problema admite múltiplas saídas corretas | especificação, correção, oracle de teste | [Problemas Reais](#problemas-reais) |

### 2.8 Falha típica → primeira investigação

| Sintoma | Primeira investigação |
|---|---|
| funciona com positivos e falha com todos negativos | a inicialização criou estado que não pertence ao domínio? |
| falha apenas com coleção vazia | vazio viola a pré-condição ou falta tratamento explícito? |
| loop não termina | qual variável/estado deveria progredir e ela realmente progride? |
| pseudocódigo “parece” correto, mas ninguém consegue codificar | existe passo mágico ou operação não especificada? |
| teste rejeita uma saída que satisfaz a especificação | o problema admite múltiplas respostas válidas? |
| programa executa e produz valor plausível, mas errado | a pós-condição foi realmente verificada? |
| duas implementações diferem, mas ambas parecem razoáveis | estão resolvendo o mesmo problema/contrato ou especificações diferentes? |

Casos reproduzíveis completos aparecem em [🔎 Troubleshooting sistemático](#troubleshooting-sistematico).

### 2.9 Transferência entre Python, JavaScript, Java e Bash

Neste tópico, o que precisa permanecer entre linguagens é principalmente o **contrato e a estratégia**, não a aparência do código.

| Permanece | Pode mudar |
|---|---|
| problema | representação das coleções |
| domínio da entrada | sistema de tipos |
| pré/pós-condição | mecanismo de erro |
| estado conceitual | sintaxe e escopo |
| invariante | construção de loop |
| condição de término | detalhes de runtime |
| resultado conceitual | `return`, stdout, exit status etc. |

O exemplo de máximo deste capítulo materializa essa transferência nas quatro linguagens sem fingir que seus mecanismos de erro e retorno são idênticos.

<a id="modo-primeira-passagem"></a>

### 2.10 Modo primeira passagem × consulta × estudo completo

**Primeira passagem:**

```text
3–6   → problema, algoritmo e propriedades fundamentais
8–11  → estado, contrato, correção e término
14–17 → representações + exemplo progressivo
21.1–21.2 → dois LABs para fechar conceito e contraexemplo
22.1, 22.6, 22.11 → exercícios mínimos de verificação
```

A primeira passagem não substitui o restante do tópico. Ela existe para que o leitor construa o modelo mental central antes de retornar aos aprofundamentos, troubleshooting e prática completa.

**Consulta rápida:**

```text
2.3 → conceito × risco
2.4 → pergunta prática → mecanismo
2.5 → não confundir
2.6 → microexemplos
2.8 → primeira investigação de falha
24 → checklist de consulta rápida
```

**Estudo completo:**

```text
3–7  → problema, algoritmo, propriedades e fronteiras conceituais
8–13 → estado, contratos, correção, término, determinismo e invariantes
14–16 → representações, pseudocódigo e fluxograma
17–18 → exemplo progressivo e transferência entre linguagens
19–20 → erros e raciocínio sistemático
Problemas Reais → aplicação integrada
Troubleshooting → diagnóstico reproduzível
21–23 → LABs, exercícios e evidências de domínio
```

[↑ Voltar ao índice](#índice)

---

# 3. Problema computacional × algoritmo

Essa distinção é uma das mais importantes.

## 3.1 Problema

Um problema define:

```text
ENTRADAS POSSÍVEIS
+
CONDIÇÃO QUE UMA SAÍDA CORRETA DEVE SATISFAZER
```

Exemplo:

> **Problema MAXIMUM**

Entrada:

```text
sequência não vazia de números inteiros
```

Saída:

```text
um valor que seja maior ou igual a todos os elementos da sequência
e que pertença à sequência
```

Para:

```text
[7, 2, 9, 4]
```

a saída correta é:

```text
9
```

## 3.2 Algoritmo

Algoritmo é o procedimento que tenta resolver o problema.

Exemplo conceitual:

```text
max_so_far = first element

for each remaining value:
    if value > max_so_far:
        max_so_far = value

return max_so_far
```

## 3.3 Instância

Uma instância é uma entrada concreta:

```text
[7, 2, 9, 4]
```

Outra:

```text
[-8, -2, -11]
```

O problema é geral.

A instância é particular.

## 3.4 Por que essa distinção importa

Uma instância favorável não representa todo o problema. Um algoritmo defeituoso pode funcionar para `[7, 2, 9, 4]` e ainda violar a especificação em outra entrada válida.

O contraexemplo canônico deste capítulo — inicializar o máximo com `0` — aparece em forma compacta na [Visão Panorâmica](#26-microexemplos-canônicos) e é analisado em detalhe em [§10.6](#106-exemplo-de-algoritmo-incorreto). Em entradas formadas apenas por números negativos, essa inicialização pode produzir um valor que nem pertence à entrada.

A distinção importa porque **correção é uma propriedade em relação ao domínio especificado**, não ao conjunto pequeno de exemplos que por acaso foi testado.

## 3.5 Formulação do MIT 6.006

O MIT 6.006 apresenta um problema como uma relação entre entradas e saídas corretas e descreve algoritmo, no enquadramento determinístico introdutório do curso, como procedimento que mapeia cada entrada a uma saída.

Um algoritmo resolve o problema quando:

```text
PARA TODA ENTRADA VÁLIDA
→ produz uma saída correta
```

Essa formulação ajuda a separar:

```text
“funcionou neste teste”
```

de:

```text
“resolve o problema”
```

## 3.6 Um problema pode admitir mais de uma saída correta

Modelar um problema como uma **relação** é importante porque uma mesma entrada pode admitir mais de uma resposta correta.

Exemplo conceitual:

```text
problema:
    encontrar qualquer par de itens que satisfaça uma propriedade

entrada:
    pode conter vários pares válidos

saída correta:
    qualquer um dos pares que satisfaça a especificação
```

Logo, não confunda:

```text
PROBLEMA
→ pode admitir várias saídas corretas para a mesma entrada

ALGORITMO DETERMINÍSTICO
→ para um mesmo estado inicial/entrada, escolhe uma saída específica
```

O critério de correção não é “retornar exatamente o exemplo esperado”, mas produzir **uma saída pertencente ao conjunto permitido pela especificação**.

Essa distinção também explica por que testes devem comparar a propriedade exigida pelo problema quando a resposta correta não é única. Um caso operacional completo aparece em [`PR-T02-06`](#pr-t02-06), e a falha correspondente de um teste excessivamente específico é diagnosticada em [`TS-T02-05`](#ts-t02-05).

[↑ Voltar ao índice](#índice)

---

# 4. O que é um algoritmo

Uma definição operacional adequada para este guia:

> **Algoritmo é um procedimento computacional bem definido, composto por passos executáveis, destinado a transformar entradas pertencentes a um domínio em resultados que satisfaçam uma especificação.**

A definição precisa ser lida com cuidado.

## 4.1 “Procedimento”

Existe uma sequência ou estrutura de ações.

## 4.2 “Computacional”

Os passos precisam ser executáveis por um modelo de computação suficientemente definido.

Neste tópico, **modelo de computação** significa apenas um conjunto suficientemente claro de operações e estados que torna cada passo executável sem depender de uma instrução mágica ou ambígua. Um **passo executável**, neste modelo informal, é uma operação cuja entrada/estado relevante, transformação ou efeito e transição para o próximo estado podem ser determinados de maneira suficientemente precisa para a execução. Modelos formais de computação e modelos de custo ficam fora deste escopo e serão aprofundados posteriormente.

## 4.3 “Bem definido”

O significado de cada passo não pode depender de ambiguidade incompatível com a execução.

Ruim:

```text
escolha um número legal
```

Melhor:

```text
escolha o menor número positivo da coleção
```

se essa operação estiver definida.

## 4.4 “Entrada”

Muitos algoritmos recebem dados.

Mas não é necessário forçar a ideia de que todo algoritmo possui uma entrada fornecida pelo usuário.

A entrada pode vir de:

- argumento;
- arquivo;
- memória;
- sensor;
- estrutura já existente;
- estado inicial.

Alguns procedimentos podem operar sem entrada externa variável.

## 4.5 “Saída”

Resultado pode ser:

- valor;
- coleção;
- alteração de uma estrutura;
- decisão;
- caminho;
- ordenação;
- estado final.

## 4.6 “Classe de instâncias”

Um algoritmo interessante normalmente não é uma lista de passos criada apenas para:

```text
[7, 2, 9, 4]
```

Ele resolve uma classe:

```text
qualquer sequência válida pertencente ao domínio especificado
```

## 4.7 Algoritmo não é sinônimo de “fórmula”

Uma fórmula pode fazer parte de um algoritmo.

Exemplo:

```text
área = base * altura
```

é uma relação matemática.

Um procedimento que:

```text
recebe base e altura
valida o domínio
calcula
produz resultado
```

é uma descrição algorítmica mais completa.

[↑ Voltar ao índice](#índice)

---

# 5. Entrada, processamento e saída

O modelo IPO (*Input → Process → Output*) é simples, mas útil.

```text
INPUT
↓
PROCESS
↓
OUTPUT
```

## 5.1 Entrada

Descreva:

- quantidade;
- tipo conceitual;
- domínio;
- estrutura;
- restrições;
- validade.

Exemplo:

```text
sequência não vazia de inteiros
```

é melhor que:

```text
números
```

## 5.2 Processamento

É a transformação.

Pode envolver:

- atribuição;
- comparação;
- decisão;
- repetição;
- chamada;
- atualização de estado.

## 5.3 Saída

Defina propriedade esperada.

Para `MAXIMUM`:

```text
resultado ∈ entrada
E
para todo x da entrada:
    resultado >= x
```

Essa formulação é mais forte que:

```text
“retornar o maior”
```

porque explicita o critério.

Neste capítulo, muitos exemplos usam **valor retornado** por ser a forma mais simples de observar o resultado. Isso não limita a ideia de saída: uma especificação também pode exigir propriedades do **estado final modificado**, como uma coleção alterada *in-place*, um registro persistido ou outro efeito declarado pelo contrato. A pós-condição descreve o que precisa ser verdadeiro ao final, e não necessariamente apenas o conteúdo de um `return`.

## 5.4 Entrada válida × inválida

Um algoritmo pode trabalhar sob uma pré-condição:

```text
a sequência é não vazia
```

Se a entrada for vazia, há duas possibilidades de projeto:

1. a entrada viola o contrato e o algoritmo não é obrigado a produzir resultado;
2. a implementação decide detectar e reportar a violação.

Essas decisões não devem ser confundidas.

## 5.5 Transformação de estado

Processamento pode ser visto como:

```text
ESTADO_0
→ ESTADO_1
→ ESTADO_2
→ ...
→ ESTADO_FINAL
```

Isso conecta algoritmo com rastreamento e debugging.

[↑ Voltar ao índice](#índice)

---

# 6. Características de um algoritmo

A taxonomia canônica lista:

- clareza;
- precisão;
- finitude;
- ordem;
- determinismo quando aplicável;
- correção.

Este capítulo acrescenta **efetividade/executabilidade** como propriedade conceitual útil.

## 6.1 Clareza

O leitor deve compreender a intenção e os passos.

Clareza é parcialmente editorial.

Dois algoritmos podem ser corretos, mas um ser mais fácil de entender.

## 6.2 Precisão

Cada passo deve possuir significado suficientemente determinado.

```text
“repita algumas vezes”
```

é impreciso.

```text
“repita enquanto i < n”
```

é operacionalmente mais preciso, desde que `i` e `n` estejam definidos.

## 6.3 Ordem

A ordem pode alterar o resultado.

Exemplo:

```text
usar valor
→ depois inicializar
```

não é equivalente a:

```text
inicializar
→ depois usar
```

## 6.4 Finitude

Na definição clássica usada neste guia, o algoritmo deve terminar após número finito de passos para toda entrada que satisfaça as condições assumidas.

Isso NÃO significa que todo software precise terminar.

Servidores, event loops e sistemas reativos podem executar indefinidamente.

Nesse caso, é melhor distinguir:

```text
algoritmos finitos internos
+
processo/sistema de longa duração
```

## 6.5 Efetividade

Os passos precisam ser realizáveis no modelo de computação adotado.

Exemplo inadequado:

```text
“descubra instantaneamente a solução ótima de qualquer problema”
```

não descreve uma operação efetiva.

## 6.6 Correção

O resultado deve satisfazer a especificação para todas as entradas válidas.

## 6.7 Determinismo — quando aplicável

Em um algoritmo determinístico, o comportamento é determinado pela entrada e pelo estado inicial.

Mas **determinismo não é requisito universal de todo algoritmo moderno**.

Algoritmos randomizados usam escolhas aleatórias.

Por isso a taxonomia usa corretamente:

> **determinismo quando aplicável.**

## 6.8 Generalidade

Embora não seja necessário transformar “generalidade” em mais uma regra rígida, algoritmos normalmente resolvem uma classe de instâncias, e não apenas um exemplo concreto.

[↑ Voltar ao índice](#índice)

---

# 7. Algoritmo × programa × função × heurística

## 7.1 Algoritmo

Descrição do procedimento.

```text
conceitual
→ independente de uma implementação específica
```

## 7.2 Programa

Artefato executável em determinada linguagem/runtime.

Pode conter:

- vários algoritmos;
- I/O;
- configuração;
- tratamento de erro;
- interface;
- integração;
- persistência.

## 7.3 Função

Uma função é uma unidade de programa/abstração.

Ela pode implementar:

- um algoritmo inteiro;
- uma parte;
- uma operação simples;
- uma transformação que nem vale a pena chamar de algoritmo em sentido pedagógico.

## 7.4 Código

Código é uma representação em linguagem de programação.

```text
ALGORITMO
≠
CÓDIGO
```

## 7.5 Heurística

Heurística é uma estratégia prática que busca uma solução útil, frequentemente sem garantia de produzir a solução ótima ou exata em todos os casos.

Exemplo geral:

```text
escolher rapidamente uma boa alternativa
```

não é o mesmo que:

```text
provar que a alternativa é ótima
```

## 7.6 Receita

Receitas são analogias pedagógicas úteis porque possuem passos.

Mas algoritmos exigem precisão compatível com execução computacional.

“Tempere a gosto” é aceitável em culinária.

É uma instrução inadequada para execução automática sem modelagem adicional.

## 7.7 Especificação

Especificação diz **o que** precisa ser verdadeiro.

Algoritmo diz **como** tentar obtê-lo.

[↑ Voltar ao índice](#índice)

---

# 8. Estado de execução

Estado é a informação relevante sobre a execução em determinado momento.

Pode incluir:

```text
valores atuais
+
estruturas de dados
+
posição no fluxo
+
dados auxiliares
```

## 8.1 Estado inicial

Situação antes dos passos principais.

Para `MAXIMUM`:

```text
values = [7, 2, 9, 4]
max_so_far = 7
```

## 8.2 Estado intermediário

Após processar parte da entrada.

| Elemento processado | `max_so_far` |
|---|---:|
| `7` | `7` |
| `2` | `7` |
| `9` | `9` |
| `4` | `9` |

## 8.3 Estado final

Ao terminar:

```text
max_so_far = 9
```

## 8.4 Transição de estado

Uma instrução transforma estado.

```text
antes:
max_so_far = 7

processar 9

depois:
max_so_far = 9
```

## 8.5 Controle também faz parte do estado

Em um rastreamento, não basta conhecer valores.

Também importa:

```text
qual passo?
qual iteração?
qual condição?
qual chamada?
```

## 8.6 Estado observável × estado conceitual

Pseudocódigo pode omitir detalhes irrelevantes do runtime.

A abstração do algoritmo precisa preservar apenas o estado necessário para explicar o comportamento.

[↑ Voltar ao índice](#índice)

---

# 9. Pré-condições e pós-condições

**Classificação curricular:** `[C] Obrigatório conhecer`

## 9.1 Pré-condição

É uma propriedade esperada **antes** da execução.

Para `MAXIMUM`:

```text
PRE:
values possui pelo menos um elemento
```

Podemos acrescentar:

```text
todos os elementos podem ser comparados pela relação usada
```

## 9.2 Pós-condição

É uma propriedade esperada **depois** da execução correta.

```text
POST:
result pertence a values

E

para todo x em values:
    result >= x
```

A pós-condição pode falar sobre um **resultado retornado**, como acima, ou sobre propriedades do **estado final** produzido pelo procedimento. O contrato é que determina qual observação importa.

## 9.3 Contrato

Modelo:

```text
PRE
↓
ALGORITMO
↓
POST
```

Leitura:

> se a pré-condição for satisfeita e o algoritmo cumprir seu contrato, a pós-condição deve valer ao final.

## 9.4 Pré-condição não é validação

Estas duas ideias são diferentes:

### Contrato conceitual

```text
PRE: coleção não vazia
```

### Implementação defensiva

```text
if collection is empty:
    signal error
```

Uma implementação pode verificar a pré-condição.

Mas a existência da pré-condição independe da verificação.

<a id="95-postcondição-não-é-saída-de-exemplo"></a>

## 9.5 Pós-condição não é “saída de exemplo”

```text
entrada: [7, 2, 9, 4]
saída: 9
```

é um exemplo.

```text
resultado é um elemento da coleção
e nenhum elemento é maior que resultado
```

é uma propriedade geral.

## 9.6 Por que contratos ajudam

Eles ajudam a:

- definir domínio;
- criar testes;
- identificar casos inválidos;
- argumentar sobre correção;
- separar responsabilidade de chamador × algoritmo.

[↑ Voltar ao índice](#índice)

---

# 10. Correção

Um algoritmo correto não é simplesmente um algoritmo que “parece funcionar”.

## 10.1 Correção para uma instância

Se:

```text
entrada = [7, 2, 9, 4]
```

e:

```text
resultado = 9
```

essa execução satisfaz o problema para essa instância.

## 10.2 Correção geral

Para o caso **determinístico/exato** usado como modelo principal neste capítulo, dizer que o algoritmo resolve o problema exige justificar que:

```text
PARA TODA ENTRADA VÁLIDA
→ o resultado satisfaz a especificação
```

Algoritmos randomizados exigem declarar a garantia apropriada em vez de transportar mecanicamente essa formulação. Alguns usam aleatoriedade apenas no caminho/custo e ainda retornam sempre uma resposta correta; outros trabalham com uma probabilidade de erro explicitamente limitada. O ponto fundamental permanece: **a garantia de correção precisa fazer parte do contrato analisado**.

## 10.3 Teste ≠ prova

Testes podem revelar bugs.

Testes não demonstram automaticamente correção para um domínio infinito.

```text
100 testes passaram
```

não significa logicamente:

```text
todas as entradas possíveis estão corretas
```

Ainda assim, testes são fundamentais para software real.

## 10.4 Argumento de correção

No nível introdutório, um argumento pode ser informal, mas precisa conectar:

```text
estado inicial
→ transformação
→ propriedade preservada
→ estado final
→ pós-condição
```

## 10.5 Correção parcial × correção total `[E]`

Uma distinção clássica:

### Correção parcial

Se o algoritmo terminar, a saída satisfaz a pós-condição.

### Correção total

Além da correção parcial:

```text
o algoritmo termina
```

Essa distinção mostra por que:

```text
resultado correto
```

e:

```text
terminação
```

são preocupações separadas.

O loop infinito de §11.2 torna essa diferença concreta: a **correção parcial** afirma o que deve acontecer *caso* exista término; ela não demonstra que o estado final será alcançado. Para **correção total**, é necessário fechar também o argumento de término.

## 10.6 Exemplo de algoritmo incorreto

```text
max = 0

for each x:
    if x > max:
        max = x
```

Falha em:

```text
[-8, -2, -11]
```

O erro está no estado inicial.

A implementação pode estar perfeitamente fiel a esse algoritmo e continuar errada.

[↑ Voltar ao índice](#índice)

---

# 11. Término e finitude

## 11.1 Um algoritmo clássico precisa terminar

Para cada entrada válida:

```text
PASSOS FINITOS
↓
RESULTADO
```

## 11.2 Loop infinito

Exemplo:

```text
i = 0

enquanto i < 10:
    mostrar i
```

Se `i` nunca muda, o algoritmo não progride para a condição de término.

## 11.3 Variante de loop `[E]`

Uma técnica de raciocínio é identificar uma medida que progride rumo ao término.

Exemplo:

```text
restante = n - i
```

A cada iteração:

```text
restante diminui
```

e possui limite inferior.

Isso oferece argumento de término.

## 11.4 Recursão

Para recursão, normalmente precisamos de:

```text
caso-base
+
redução do problema
```

Sem progresso:

```text
f(n)
→ f(n)
```

não há razão para terminar.

## 11.5 Programa que nunca termina pode estar correto?

Depende do contrato.

Um servidor:

```text
aguarda requisições
```

pode ser projetado para permanecer ativo.

Não trate o servidor inteiro como um único algoritmo finito com uma saída final obrigatória.

Ele executa continuamente algoritmos internos:

```text
receber requisição
→ processar
→ responder
```

[↑ Voltar ao índice](#índice)

---

# 12. Determinismo e algoritmos randomizados

## 12.1 Determinístico

Com o mesmo estado inicial e entrada:

```text
mesmas decisões
→ mesmo comportamento
```

Exemplo:

```text
busca linear determinística
```

## 12.2 Randomizado

Algoritmo randomizado usa aleatoriedade como parte da execução.

O mesmo input pode gerar:

- caminhos diferentes;
- tempos diferentes;
- e, conforme o tipo de algoritmo, resultados diferentes segundo a garantia probabilística declarada.

A presença de aleatoriedade, por si só, não autoriza resposta arbitrária. A especificação deve deixar claro se a correção é sempre garantida ou se existe probabilidade de erro controlada.

## 12.3 Randomização não significa “sem regras”

Um algoritmo randomizado ainda possui:

- contrato;
- operações;
- análise;
- propriedade de correção apropriada.

## 12.4 Exemplo conceitual

Randomized quicksort pode escolher pivô aleatoriamente.

A escolha do pivô varia.

O objetivo continua:

```text
produzir a sequência ordenada
```

## 12.5 Por que esta seção existe aqui?

Para evitar transformar:

> “algoritmos são determinísticos”

em dogma incorreto.

A característica curricular correta é:

> **determinismo quando aplicável.**

[↑ Voltar ao índice](#índice)

---

# 13. Invariantes — primeira introdução

**Classificação neste capítulo:** introdução `[C]`; aprofundamento posterior.

Uma invariante é uma propriedade que permanece verdadeira em pontos determinados da execução.

Para `MAXIMUM`:

> antes de processar o próximo elemento, `max_so_far` é o maior valor entre os elementos já processados.

## 13.1 Exemplo

Entrada:

```text
[7, 2, 9, 4]
```

A propriedade que queremos preservar é:

> antes de processar o próximo elemento, `max_so_far` é o maior valor do prefixo já processado.

| Prefixo já processado | Próximo valor | `max_so_far` antes | Atualização | `max_so_far` depois | Invariante preservado? |
|---|---:|---:|---|---:|---|
| `[7]` | `2` | `7` | nenhuma | `7` | sim |
| `[7, 2]` | `9` | `7` | `9 > 7` → atualizar | `9` | sim |
| `[7, 2, 9]` | `4` | `9` | nenhuma | `9` | sim |
| `[7, 2, 9, 4]` | — | `9` | percurso encerrado | `9` | sim; o prefixo é a entrada inteira |

A tabela torna explícito que a variável pode mudar, enquanto a **propriedade sobre o estado** permanece verdadeira nos pontos definidos do loop.

## 13.2 Estrutura clássica de prova com invariante

CLRS organiza o raciocínio em:

```text
INICIALIZAÇÃO
→ a propriedade vale antes da primeira iteração

MANUTENÇÃO
→ se vale antes de uma iteração,
  continua valendo antes da próxima

TÉRMINO
→ ao terminar, a propriedade ajuda a obter a pós-condição
```

A ligação final é essencial: quando o loop termina, a região/parte já processada precisa coincidir com aquilo que a pós-condição descreve. No `MAXIMUM`, o prefixo processado passa a ser a sequência inteira; portanto, o invariante preservado durante o percurso torna-se exatamente a propriedade necessária para concluir que `max_so_far` é o máximo da entrada.

## 13.3 Não confundir invariante com “variável que não muda”

A própria variável `max_so_far` pode mudar.

O que permanece é a **propriedade**:

```text
max_so_far = máximo do prefixo processado
```

## 13.4 Por que invariantes importam

Eles conectam:

```text
ESTADO
+
LOOP
+
CORREÇÃO
```

e serão retomados em algoritmos e análise.

[↑ Voltar ao índice](#índice)

---

# 14. Representações de algoritmos

O mesmo algoritmo pode ser representado em formas diferentes.

## 14.1 Linguagem natural

Exemplo:

> Assuma o primeiro elemento como maior. Compare os demais um a um e substitua o maior atual sempre que encontrar valor superior.

Vantagem:

- fácil introdução.

Risco:

- ambiguidade.

## 14.2 Linguagem natural estruturada

```text
1. Verificar se existe pelo menos um elemento.
2. Definir o primeiro como maior atual.
3. Percorrer os elementos restantes.
4. Atualizar o maior quando encontrar valor superior.
5. Retornar o maior.
```

## 14.3 Pseudocódigo

```text
MAXIMUM(values)

    PRE: length(values) > 0

    max_so_far = values[0]

    for each value in values[1...]
        if value > max_so_far
            max_so_far = value

    return max_so_far
```

## 14.4 Fluxograma

Útil para visualizar:

- sequência;
- decisão;
- repetição;
- entrada/saída.

## 14.5 Código

É uma implementação em linguagem concreta.

## 14.6 Representação ≠ algoritmo

Pseudocódigo e código podem representar o mesmo algoritmo.

Também é possível escrever duas implementações que resolvem o mesmo problema com algoritmos diferentes.

[↑ Voltar ao índice](#índice)

---

# 15. Pseudocódigo

Pseudocódigo busca expressar lógica sem prender a explicação à sintaxe de uma linguagem específica.

## 15.1 Não existe uma gramática universal

Você encontrará diferenças como:

```text
IF
THEN
ENDIF
```

ou:

```text
SE
ENTÃO
FIMSE
```

ou indentação.

Portanto:

> **não trate pseudocódigo como uma quinta linguagem de programação padronizada.**

## 15.2 Propriedades desejáveis

Pseudocódigo deve ser:

- legível;
- consistente;
- não ambíguo no ponto importante;
- independente de detalhes irrelevantes;
- próximo o bastante de operações computacionais.

## 15.3 Convenções deste material

Exemplo:

```text
ALGORITHM NAME(input)

    PRE: ...

    state = ...

    for each item in input
        if condition
            update state

    return state

    POST: ...
```

## 15.4 Pseudocódigo pode ser mais abstrato que código

Podemos escrever:

```text
for each value
```

sem decidir:

- índice;
- iterator;
- `for...of`;
- enhanced `for`;
- expansão shell.

Essa decisão pertence à implementação.

## 15.5 Cuidado com “mágica”

Ruim:

```text
encontre a solução ótima
```

se justamente essa é a parte difícil do problema.

Pseudocódigo pode abstrair sintaxe.

Não deve esconder o problema computacional central.

## 15.6 Farrell: pseudocódigo × fluxograma

*Programming Logic and Design* apresenta pseudocódigo e fluxograma como duas representações possíveis da mesma lógica e observa que normalmente não é necessário criar ambas para todo problema.

A escolha deve servir à compreensão.

[↑ Voltar ao índice](#índice)

---

# 16. Fluxograma

Fluxograma representa visualmente o fluxo.

Símbolos tradicionais incluem:

```text
TERMINAL
→ início/fim

PROCESSO
→ operação

ENTRADA/SAÍDA
→ dados

DECISÃO
→ escolha

SETA
→ fluxo
```

## 16.1 Exemplo conceitual

```mermaid
flowchart TD
    A[Início] --> B[Inicializar maior com o primeiro valor]
    B --> C{Há valor restante?}
    C -- Não --> G[Retornar maior]
    C -- Sim --> D[Obter o próximo valor]
    D --> E{valor > maior?}
    E -- Sim --> F[Atualizar maior]
    E -- Não --> C
    F --> C
```

Leitura textual: depois da inicialização, cada iteração **consome/obtém um novo valor** antes da comparação. Esse passo de progresso é parte do algoritmo; omiti-lo faria o diagrama parecer capaz de testar indefinidamente o mesmo estado.

## 16.2 Vantagens

- mostra fluxo;
- facilita decisões;
- ajuda iniciantes a visualizar loops.

## 16.3 Limitações

Fluxogramas grandes podem ficar:

- extensos;
- difíceis de editar;
- difíceis de consultar.

## 16.4 Regra deste guia

Fluxograma é:

```text
FERRAMENTA
```

não:

```text
PRÉ-REQUISITO PARA TER BOA LÓGICA
```

Use quando a representação visual melhorar o entendimento.

[↑ Voltar ao índice](#índice)

---

# 17. Exemplo progressivo — encontrar o maior valor

## 17.1 Problema

Encontrar o maior elemento de uma sequência não vazia de inteiros.

## 17.2 Contrato

```text
PRE:
values não é vazio

POST:
result pertence a values

e

para todo x em values:
    result >= x
```

## 17.3 Estratégia

Manter o maior valor visto até o momento.

## 17.4 Estado

```text
max_so_far
```

## 17.5 Inicialização correta

```text
max_so_far = values[0]
```

Por quê?

Porque:

- pertence à entrada;
- funciona para números positivos;
- funciona para zero;
- funciona para números negativos.

## 17.6 Inicialização incorreta

```text
max_so_far = 0
```

Essa inicialização introduz um valor que pode não pertencer à entrada e, portanto, pode violar o contrato antes mesmo do percurso produzir informação suficiente. O contraexemplo completo e sua análise já foram apresentados em [§10.6](#106-exemplo-de-algoritmo-incorreto).

Aqui, o contraste com §17.5 é o ponto principal: inicializar com `values[0]` preserva desde o início a relação entre o estado e os dados reais do problema.

## 17.7 Pseudocódigo

```text
MAXIMUM(values)

    PRE: length(values) > 0

    max_so_far = values[0]

    for each value after the first
        if value > max_so_far
            max_so_far = value

    return max_so_far
```

## 17.8 Rastreamento

Entrada:

```text
[7, 2, 9, 4]
```

| Passo | valor | `max_so_far` antes | comparação | depois |
|---:|---:|---:|---|---:|
| inicial | `7` | — | — | `7` |
| 1 | `2` | `7` | `2 > 7` → falso | `7` |
| 2 | `9` | `7` | `9 > 7` → verdadeiro | `9` |
| 3 | `4` | `9` | `4 > 9` → falso | `9` |

## 17.9 Invariante

Antes de cada nova comparação:

> `max_so_far` é o maior valor entre os itens já processados.

## 17.10 Correção informal

### Inicialização

Antes da primeira comparação, apenas o primeiro item foi processado.

Ele é trivialmente o maior desse prefixo.

### Manutenção

Para novo `value`:

- se `value <= max_so_far`, o maior permanece;
- se `value > max_so_far`, atualizar faz `max_so_far` voltar a ser o maior do prefixo.

### Término

Quando todos os elementos foram processados, o prefixo é a sequência inteira.

Logo:

```text
max_so_far
```

é o máximo da entrada. Aqui aparece a ponte completa: **invariante preservado + término do percurso → pós-condição**.

## 17.11 Término

O algoritmo percorre uma quantidade finita de elementos.

A cada passo, um elemento adicional é processado.

## 17.12 Complexidade — apenas intuição

O algoritmo faz uma quantidade de comparações que cresce **linearmente com o número de elementos da entrada**: ao acrescentar elementos, o trabalho adicional cresce na mesma ordem do percurso.

A notação assintótica formal e a análise rigorosa desse crescimento ficam para Análise de Algoritmos.

[↑ Voltar ao índice](#índice)

---

# 18. Transferência para quatro linguagens

Todos os exemplos implementam o mesmo contrato conceitual:

```text
entrada não vazia
→ maior elemento
```

As implementações abaixo também detectam entrada vazia para tornar a violação do contrato explícita.

## 18.1 Python

```python
def find_max(values: list[int]) -> int:
    if not values:
        raise ValueError("values must not be empty")

    max_so_far = values[0]

    for value in values[1:]:
        if value > max_so_far:
            max_so_far = value

    return max_so_far


print(find_max([7, 2, 9, 4]))
print(find_max([-8, -2, -11]))
```

Saída reproduzida:

```text
9
-2
```

## 18.2 JavaScript

```javascript
function findMax(values) {
  if (values.length === 0) {
    throw new RangeError("values must not be empty");
  }

  let maxSoFar = values[0];

  for (const value of values.slice(1)) {
    if (value > maxSoFar) {
      maxSoFar = value;
    }
  }

  return maxSoFar;
}

console.log(findMax([7, 2, 9, 4]));
console.log(findMax([-8, -2, -11]));
```

Saída reproduzida:

```text
9
-2
```

## 18.3 Java

```java
public class Example {
    static int findMax(int[] values) {
        if (values.length == 0) {
            throw new IllegalArgumentException("values must not be empty");
        }

        int maxSoFar = values[0];

        for (int i = 1; i < values.length; i++) {
            if (values[i] > maxSoFar) {
                maxSoFar = values[i];
            }
        }

        return maxSoFar;
    }

    public static void main(String[] args) {
        System.out.println(findMax(new int[] {7, 2, 9, 4}));
        System.out.println(findMax(new int[] {-8, -2, -11}));
    }
}
```

Saída reproduzida:

```text
9
-2
```

## 18.4 Bash

> **Escopo do exemplo:** os argumentos usados abaixo representam inteiros válidos. Bash não fornece tipagem numérica aos parâmetros posicionais; em contexto aritmético, valores de variáveis são avaliados como expressões. Por isso, entrada externa deve ter presença e representação validadas antes de chegar a este ponto. A aritmética do Bash usa os maiores inteiros de largura fixa disponíveis na implementação e não verifica overflow.

```bash
#!/usr/bin/env bash

find_max() {
    if (( $# == 0 )); then
        printf '%s\n' 'values must not be empty' >&2
        return 2
    fi

    local max_so_far=$1
    shift

    local value
    for value in "$@"; do
        if (( value > max_so_far )); then
            max_so_far=$value
        fi
    done

    printf '%d\n' "$max_so_far"
}

find_max 7 2 9 4
find_max -8 -2 -11
```

Saída reproduzida:

```text
9
-2
```

> **Exit status do script:** a função usa status `2` para sinalizar entrada vazia, mas o status final de um script com várias chamadas é o status do último comando executado, salvo política explícita do chamador. As duas chamadas demonstrativas acima são válidas; em código real, quem chama a função deve decidir se propaga, trata ou acumula uma falha anterior.

## 18.5 Comparação semântica

| Conceito | Python | JavaScript | Java | Bash |
|---|---|---|---|---|
| coleção do exemplo | `list[int]` | `Array` | `int[]` | argumentos posicionais |
| vazio | falsy list | `length === 0` | `length == 0` | `$# == 0` |
| estado mutável | `max_so_far` | `maxSoFar` | `maxSoFar` | `max_so_far` |
| iteração | `for value` | `for...of` | `for` por índice | `for value in "$@"` |
| erro | `ValueError` | `RangeError` | `IllegalArgumentException` | stderr + exit status |
| resultado | `return int` | `return Number` | `return int` | stdout |

Bash ilustra novamente que:

```text
RESULTADO CONCEITUAL EQUIVALENTE
≠
MECANISMO DE RETORNO IDÊNTICO
```

[↑ Voltar ao índice](#índice)

---

# 19. Erros conceituais frequentes

## 19.1 “Algoritmo é código”

Não.

Código implementa um algoritmo em linguagem específica.

## 19.2 “Se executou, está correto”

Não.

```text
executável
≠
correto
```

## 19.3 “Se passou em vários testes, está provado”

Não necessariamente.

Testes aumentam confiança e detectam falhas.

Prova/argumento geral exige raciocínio sobre todas as entradas do domínio.

## 19.4 “Algoritmo sempre é determinístico”

Não.

Há algoritmos randomizados.

## 19.5 “Todo programa deve terminar”

Não.

Serviços de longa duração podem não possuir término global esperado.

Algoritmos internos ainda podem ter contratos finitos.

## 19.6 “Pré-condição é a mesma coisa que `if` de validação”

Não.

Pré-condição é parte do contrato.

Um `if` é uma forma possível de verificar a condição em uma implementação.

<a id="197-postcondição-é-um-exemplo"></a>

## 19.7 “Pós-condição é um exemplo”

Não.

Exemplo é instância.

Pós-condição é propriedade geral do estado final.

## 19.8 “Pseudocódigo possui sintaxe oficial”

Não existe padrão universal único.

## 19.9 “Fluxograma é obrigatório”

Não.

É uma ferramenta de representação.

## 19.10 “Inicializar máximo com zero funciona”

Só sob pré-condições adicionais.

Sem elas:

```text
[-8, -2, -11]
```

destrói a correção.

## 19.11 “Algoritmo correto automaticamente é eficiente”

Não.

Correção e eficiência são dimensões diferentes.

Um algoritmo pode ser correto e impraticavelmente lento.

[↑ Voltar ao índice](#índice)

---

# 20. Como raciocinar sobre um algoritmo

Use este roteiro.

## 20.1 Qual é o problema?

```text
domínio de entrada
+
propriedade da saída correta
```

## 20.2 Qual é a pré-condição?

O que pode ser assumido?

## 20.3 Qual é o estado?

Que informação precisa ser mantida?

## 20.4 Qual é a inicialização?

O estado inicial já satisfaz a propriedade necessária?

## 20.5 Qual é o progresso?

Cada passo aproxima do término?

## 20.6 Qual propriedade deve permanecer verdadeira?

Existe uma invariante útil?

## 20.7 Qual é a condição de término?

Quando o algoritmo para?

## 20.8 O estado final implica a pós-condição?

Essa é a ponte para correção.

## 20.9 Existem contraexemplos?

Teste:

- vazio;
- um item;
- negativos;
- duplicados;
- fronteiras;
- já ordenado;
- ordem inversa;
- mínimo/máximo.

## 20.10 A representação esconde alguma operação difícil?

Pseudocódigo:

```text
“encontre o melhor caminho”
```

não é solução se encontrar o caminho é justamente o problema central.

[↑ Voltar ao índice](#índice)

---


<a id="problemas-reais"></a>

# Índice operacional de Problemas Reais `PR-*`

Os itens abaixo não substituem exercícios nem LABs. Cada `PR-*` representa uma necessidade plausível em que várias capacidades de Fundamentos de Algoritmos precisam ser combinadas e verificadas contra um contrato.

| ID | Necessidade concreta | Capacidades | Destino | Estado |
|---|---|---|---|---|
| `PR-T02-01` | converter uma descrição de problema em contrato verificável | domínio, instância, entrada, saída, pré/pós-condição | `#pr-t02-01` | COBERTO |
| `PR-T02-02` | refutar algoritmo aparentemente correto com contraexemplo mínimo | correção, instância, fronteira, contraexemplo | `#pr-t02-02` | COBERTO |
| `PR-T02-03` | selecionar inicialização que preserve o invariante | estado, inicialização, invariante | `#pr-t02-03` | COBERTO |
| `PR-T02-04` | diagnosticar algoritmo que não termina | estado, progresso, condição de término, variante | `#pr-t02-04` | COBERTO |
| `PR-T02-05` | remover “mágica” de pseudocódigo aparentemente preciso | representação, efetividade, precisão | `#pr-t02-05` | COBERTO |
| `PR-T02-06` | testar corretamente problema com múltiplas saídas válidas | especificação, pós-condição, oracle de teste | `#pr-t02-06` | COBERTO |

<a id="pr-t02-01"></a>

## `PR-T02-01` — Descrição informal → contrato verificável

**Necessidade:** receber uma sequência de inteiros e retornar seu maior valor.

Uma descrição curta como:

```text
“retorne o maior número”
```

é insuficiente para fechar o contrato. Perguntas mínimas:

```text
a sequência pode estar vazia?
quais tipos de valores são válidos?
o resultado precisa pertencer à entrada?
existem NaN, null ou valores não numéricos no domínio?
```

Neste capítulo, o contrato adotado para o exemplo progressivo é:

```text
PRE:
    values é uma sequência não vazia de inteiros

POST:
    result pertence a values
    e, para todo x em values, result >= x
```

### Por que esse contrato é melhor que “retornar o maior”

Ele permite distinguir:

- entrada válida de inválida;
- resultado correto de plausível;
- propriedade geral de saída de um exemplo particular;
- algoritmo de implementação concreta.

### Testes mínimos

| Entrada | Resultado esperado | Papel |
|---|---:|---|
| `[7, 2, 9, 4]` | `9` | caso normal |
| `[-8, -2, -11]` | `-2` | evita suposição de positividade |
| `[5]` | `5` | menor tamanho válido |
| `[]` | fora da pré-condição / erro explícito conforme API | fronteira do domínio |

### Evidência de fechamento

O contrato está suficientemente preciso quando outra pessoa consegue construir testes de aceitação sem precisar adivinhar regras escondidas.

---

<a id="pr-t02-02"></a>

## `PR-T02-02` — Encontrar um contraexemplo mínimo

Algoritmo candidato:

```text
MAXIMUM(values)
    max_so_far = 0
    for each value in values
        if value > max_so_far
            max_so_far = value
    return max_so_far
```

Ele passa em:

```text
[7, 2, 9, 4] → 9
[1] → 1
[0, 3] → 3
```

Contraexemplo mínimo útil:

```text
[-1]
```

O algoritmo retorna:

```text
0
```

mas `0` nem sequer pertence à entrada, violando diretamente a pós-condição.

### Como procurar o contraexemplo

Use perguntas sistemáticas:

```text
qual suposição invisível foi feita?
→ “haverá algum valor >= 0”

qual é o menor caso que quebra essa suposição?
→ sequência unitária negativa
```

### Evidência de fechamento

Um único contraexemplo válido é suficiente para refutar a afirmação universal “o algoritmo resolve o problema para toda entrada do domínio”.

---

<a id="pr-t02-03"></a>

## `PR-T02-03` — Inicializar estado preservando o invariante

Objetivo:

```text
após processar qualquer prefixo não vazio,
max_so_far é o maior valor desse prefixo
```

Inicialização correta:

```text
max_so_far = values[0]
```

Antes da primeira comparação, o prefixo processado contém exatamente um elemento. Esse elemento é, trivialmente, o máximo do prefixo.

Alternativa problemática:

```text
max_so_far = 0
```

Ela cria um estado que pode não representar nenhum elemento processado e exige uma suposição adicional sobre o domínio.

### Regra generalizável

Ao escolher estado inicial, pergunte:

1. o invariante já é verdadeiro antes da primeira iteração?
2. o valor inicial pertence ao domínio ou é um sentinela formalmente justificado?
3. a inicialização introduz uma suposição que não existe no contrato?

### Evidência de fechamento

A inicialização é adequada quando o argumento de correção consegue começar sem exceção ad hoc para classes válidas de entrada.

---

<a id="pr-t02-04"></a>

## `PR-T02-04` — Diagnosticar ausência de término

Procedimento candidato:

```text
n = valor positivo

while n > 0
    imprimir n
```

**Sintoma:** o algoritmo nunca termina.

Estado relevante:

```text
n
```

Condição de término:

```text
n <= 0
```

Problema:

```text
n nunca é alterado
```

Uma correção possível:

```text
while n > 0
    imprimir n
    n = n - 1
```

Agora existe uma medida simples de progresso:

```text
V = n
```

que diminui a cada iteração enquanto permanece não negativa.

### Evidência de fechamento

Não basta observar que “agora terminou” para um valor. Deve ser possível explicar por que, para qualquer `n` inteiro positivo do domínio, a medida de progresso se aproxima inevitavelmente da condição de término.

---

<a id="pr-t02-05"></a>

## `PR-T02-05` — Pseudocódigo preciso sem operação mágica

Pseudocódigo fraco:

```text
SOLVE(problem)
    choose the best solution
    return solution
```

A aparência é formal, mas a etapa central é exatamente o problema que precisava ser resolvido.

Outro exemplo:

```text
ordenar os dados de forma eficiente
```

Se o objetivo do capítulo for explicar o algoritmo de ordenação, essa linha esconde todo o mecanismo.

### Como corrigir

Pergunte para cada passo:

- a operação está definida?
- existe procedimento conhecido ou API cujo contrato foi explicitamente assumido?
- o nível de abstração é adequado ao objetivo pedagógico?
- outra pessoa conseguiria implementar o passo sem reinventar a solução inteira?

### Evidência de fechamento

O pseudocódigo está no nível certo quando revela a **ideia central** do algoritmo e deixa implícitos apenas detalhes que são legítimos naquele nível de abstração.

---

<a id="pr-t02-06"></a>

## `PR-T02-06` — Testar problema com múltiplas saídas corretas

Problema:

```text
dada uma sequência e um valor alvo,
retorne uma posição válida em que o alvo aparece
```

Entrada:

```text
values = [4, 7, 4]
target = 4
```

Saídas válidas possíveis:

```text
0
2
```

Teste inadequado:

```text
assert result == 0
```

Esse teste exige uma decisão de implementação que o problema não exigiu.

Teste orientado ao contrato:

```text
result é um índice válido
E
values[result] == target
```

Se a especificação disser “retorne a primeira ocorrência”, então `0` passa a ser obrigatório. O ponto central é que **o oracle de teste deve validar o problema realmente especificado**.

### Evidência de fechamento

O teste é correto quando aceita todas as saídas permitidas pelo contrato e rejeita todas as que o violam.

[↑ Voltar ao índice](#índice)

---

<a id="troubleshooting-sistematico"></a>

# 🔎 Troubleshooting sistemático

Aqui o troubleshooting aplica o método de diagnóstico aos mecanismos centrais deste tópico: contrato, estado, correção, término e representação. Alguns casos podem ser reproduzidos em código; outros são falhas de especificação ou raciocínio e devem ser observados por contrato, rastreamento e contraexemplo.

<a id="ts-t02-01"></a>

## `TS-T02-01` — máximo incorreto quando todos os valores são negativos

**Sintoma**

O procedimento funciona com entradas positivas, mas retorna `0` para uma sequência que contém apenas números negativos.

**Reprodução mínima**

```text
values = [-1]
max_so_far = 0
```

**Hipóteses plausíveis**

- inicialização supõe implicitamente que haverá valor não negativo;
- sentinela escolhido não pertence ao domínio;
- pós-condição não foi usada para revisar a inicialização.

**Como observar / instrumentar**

Rastreie:

```text
estado inicial → comparação → estado final
```

Para `[-1]`:

```text
0 → -1 > 0? falso → 0
```

**Como interpretar**

A primeira divergência ocorre antes do loop: o estado inicial já não representa o maior elemento do prefixo processado.

**Causa / mecanismo**

Inicialização incompatível com o domínio e com o invariante.

**Correção**

```text
max_so_far = values[0]
```

processando os elementos restantes depois.

**Como validar**

Testar positivos, zero, todos negativos e sequência unitária.

**Teste de regressão**

Preservar `[-1]` ou outro caso exclusivamente negativo.

---

<a id="ts-t02-02"></a>

## `TS-T02-02` — falha com entrada vazia: bug ou violação da pré-condição?

**Sintoma**

A implementação acessa `values[0]` e falha quando `values` está vazio.

**Cenário mínimo**

```text
values = []
```

**Hipóteses plausíveis**

- vazio está fora do domínio declarado;
- o contrato permite vazio, mas não define resultado;
- a API prometeu validação e não a implementou.

**Como observar**

Leia primeiro o contrato, não o stack trace.

**Como interpretar**

Se `PRE: values não é vazio`, o algoritmo de máximo está definido apenas para entradas não vazias. A camada de API pode ainda optar por rejeitar vazio explicitamente.

**Causa / mecanismo**

Confusão entre **domínio do problema** e **política de validação da implementação**.

**Correção**

Escolher e documentar uma política coerente:

```text
A) preservar a pré-condição e exigir do chamador
B) verificar vazio e sinalizar erro
C) redefinir o problema com um valor/sentido para vazio, se o domínio permitir
```

**Como validar**

Contrato, código e testes devem contar a mesma história.

**Teste de regressão**

Manter um teste explícito para vazio, com o comportamento esperado documentado.

---

<a id="ts-t02-03"></a>

## `TS-T02-03` — loop não termina

**Sintoma**

O algoritmo permanece executando sem alcançar o estado final.

**Reprodução**

```text
n = 3
while n > 0
    imprimir n
```

**Hipóteses**

- variável de controle não muda;
- atualização move o estado na direção errada;
- condição de término é inalcançável;
- o estado que progride não é o mesmo usado na condição.

**Como observar**

Registre `n` em iterações consecutivas.

**Como interpretar**

Se o estado relevante se repete indefinidamente, não existe progresso observável em direção ao término.

**Causa / mecanismo**

Ausência de atualização/variante que diminua até a condição final.

**Correção**

```text
n = n - 1
```

quando essa for a semântica desejada.

**Como validar**

Explicar uma medida de progresso e testar vários valores válidos, inclusive o menor.

**Teste de regressão**

`n = 1` e um valor maior, como `n = 100`.

---

<a id="ts-t02-04"></a>

## `TS-T02-04` — pseudocódigo não é implementável sem adivinhar a etapa central

**Sintoma**

Duas pessoas implementam o “mesmo pseudocódigo” com algoritmos radicalmente diferentes porque um passo crítico está vago.

**Cenário mínimo**

```text
selecionar a melhor rota
```

sem definir:

```text
“melhor” = menor latência? menos saltos? menor custo?
como as rotas candidatas são geradas?
```

**Hipóteses**

- abstração em nível alto demais;
- operação mágica;
- critério de saída incompleto.

**Como observar**

Peça a outra pessoa para implementar somente aquele passo sem informação adicional.

**Como interpretar**

Se ela precisa redefinir o problema, o pseudocódigo está escondendo a parte essencial.

**Causa / mecanismo**

Formalidade visual substituiu precisão semântica.

**Correção**

Explicitar objetivo, dados, operação e critério — ou referenciar formalmente um subalgoritmo já definido.

**Como validar**

Implementadores independentes devem conseguir preservar o mesmo contrato e estratégia.

**Teste de regressão**

Revisar o pseudocódigo procurando verbos vagos como “otimizar”, “resolver”, “escolher melhor”, “processar corretamente” sem definição local.

---

<a id="ts-t02-05"></a>

## `TS-T02-05` — teste rejeita uma saída correta

**Sintoma**

A implementação retorna uma solução que satisfaz a especificação, mas o teste automatizado falha.

**Cenário mínimo**

```text
values = [4, 7, 4]
target = 4
resultado = 2
```

Teste existente:

```text
resultado deve ser 0
```

Especificação real:

```text
retornar uma posição em que target ocorre
```

**Hipóteses**

- o teste codificou uma escolha de implementação;
- a pós-condição permite múltiplas respostas;
- falta requisito “primeira ocorrência”.

**Como observar**

Verifique o resultado contra a pós-condição, não contra uma saída exemplificativa.

**Como interpretar**

Se `values[result] == target` e o índice é válido, o resultado satisfaz o problema definido.

**Causa / mecanismo**

Oracle de teste mais restritivo que a especificação.

**Correção**

Testar a propriedade correta ou tornar a especificação mais restrita se isso for requisito real.

**Como validar**

Executar com dados contendo múltiplas ocorrências e confirmar que todas as respostas permitidas são aceitas.

**Teste de regressão**

Preservar caso com mais de uma saída válida.

---

<a id="ts-t02-06"></a>

## `TS-T02-06` — “passou em muitos testes” foi tratado como prova de correção

**Sintoma**

A solução é declarada universalmente correta porque passou em um conjunto grande de exemplos.

**Cenário mínimo**

O algoritmo de máximo inicializado com `0` passa em milhares de listas geradas apenas com inteiros não negativos.

**Hipóteses**

- conjunto de testes não representa o domínio completo;
- gerador de dados incorporou uma suposição não documentada;
- não houve busca por contraexemplos extremos.

**Como observar**

Compare o gerador de testes com a pré-condição verdadeira do problema.

**Como interpretar**

Cobertura de muitos casos dentro de um subconjunto não estabelece correção para entradas válidas fora dele.

**Causa / mecanismo**

Confundir evidência empírica com argumento universal de correção.

**Correção**

Adicionar classes de equivalência/fronteira e raciocínio sobre invariante/contrato; procurar ativamente contraexemplos.

**Como validar**

O conjunto de testes passa a incluir negativos, casos mínimos e fronteiras, e o argumento de correção explica por que o procedimento preserva a propriedade necessária.

**Teste de regressão**

Manter ao menos um caso que quebre a suposição anterior.

[↑ Voltar ao índice](#índice)

---

# 21. Laboratórios

Os LABs abaixo existem para produzir evidência observável de domínio. Tente resolver cada tarefa antes de abrir a solução-modelo; em problemas abertos, a solução apresentada é **uma solução válida**, não a única forma aceitável.

<a id="-laboratório-1--problema--algoritmo"></a>
<a id="lab-t02-01"></a>
## 🧪 Laboratório 1 — Problema × algoritmo

### Objetivo

Separar **o que deve ser resolvido** de **como será resolvido**.

### Pré-requisitos

- §§3–4 — problema, algoritmo e instância;
- §9 — noção inicial de contrato.

### Estado inicial

Problema informal:

> determinar se uma sequência contém um valor alvo.

### Tarefa

Escreva:

1. domínio de entrada;
2. condição de saída correta;
3. algoritmo em linguagem natural estruturada;
4. pseudocódigo.

### Procedimento

1. descreva primeiro **qualquer entrada válida**;
2. defina uma propriedade verificável para a saída;
3. só depois escolha um procedimento;
4. confirme que o procedimento cobre presença e ausência do alvo.

### O que observar

O problema continua o mesmo mesmo que o algoritmo seja trocado. Uma busca sequencial, uma consulta em estrutura previamente indexada ou outra estratégia podem resolver a mesma especificação sob contratos diferentes.

### Testes / autoverificação

Considere pelo menos:

- alvo presente no primeiro elemento;
- alvo presente no último elemento;
- alvo ausente;
- sequência vazia, se ela pertencer ao domínio escolhido.

<details>
<summary><strong>Solução-modelo possível</strong></summary>

Uma especificação simples:

```text
ENTRADA:
    sequência values, possivelmente vazia
    valor target comparável aos elementos

SAÍDA:
    verdadeiro se existe pelo menos um elemento igual a target
    falso caso contrário
```

Algoritmo em linguagem natural estruturada:

```text
Percorrer os elementos de values.
Se algum elemento for igual a target, responder verdadeiro.
Se o percurso terminar sem encontrar target, responder falso.
```

Pseudocódigo:

```text
CONTAINS(values, target)
    for each value in values
        if value == target
            return true
    return false
```

O mesmo **problema** admite outros algoritmos; a especificação não muda apenas porque o procedimento mudou.

</details>

### Variação / transferência

Implemente depois o mesmo contrato em duas linguagens e marque o que mudou por sintaxe, semântica, idiomatismo ou ambiente.

---

<a id="-laboratório-2--caça-ao-contraexemplo"></a>
<a id="lab-t02-02"></a>
## 🧪 Laboratório 2 — Caça ao contraexemplo

### Objetivo

Aprender a refutar uma afirmação universal de correção com uma entrada mínima.

### Pré-requisitos

- §10 — correção;
- §17.5–17.6 — inicialização do máximo.

### Estado inicial

Algoritmo proposto:

```text
MAXIMUM(values)

    max = 0

    for each x in values
        if x > max
            max = x

    return max
```

Assuma como domínio **sequências não vazias de inteiros**, sem restrição de sinal.

### Tarefa

1. encontre entrada para a qual funciona;
2. encontre um contraexemplo pequeno;
3. explique o mecanismo da falha;
4. corrija sem impor nova pré-condição desnecessária.

### Procedimento

1. identifique a suposição escondida na inicialização;
2. procure uma entrada válida que viole essa suposição;
3. execute o algoritmo manualmente;
4. compare a saída obtida com a pós-condição.

### O que observar

Uma inicialização pode introduzir informação que **não pertence à entrada**. Se `0` não for garantidamente menor ou igual ao máximo real, o estado inicial já nasce incompatível com o contrato.

### Testes / autoverificação

Teste, no mínimo:

```text
[5]          → 5
[-1]         → -1
[-8, -2]     → -2
[0]          → 0
```

<details>
<summary><strong>Solução-modelo</strong></summary>

O contraexemplo mínimo pode ser:

```text
[-1]
```

O algoritmo retorna `0`, embora `0` nem pertença à entrada. A correção é inicializar com um elemento válido da própria sequência:

```text
MAXIMUM(values)
    max = values[0]

    for each x in values[1..]
        if x > max
            max = x

    return max
```

Isso depende da pré-condição de sequência não vazia, que já faz parte do contrato declarado.

</details>

### Variação / transferência

Repita o raciocínio para um algoritmo que tenta calcular o **mínimo** inicializando com `0`.

---

<a id="-laboratório-3--pré-e-pós-condição"></a>
<a id="lab-t02-03"></a>
## 🧪 Laboratório 3 — Pré e pós-condição

### Objetivo

Distinguir contrato conceitual de política de tratamento de erro.

### Pré-requisitos

- §9 — pré-condições e pós-condições.

### Estado inicial

Operação conceitual:

```text
divide(a, b)
```

### Tarefa

Defina:

- pré-condição;
- pós-condição;
- decisão explícita para `b == 0`.

### Procedimento

1. escolha se divisão por zero ficará **fora do domínio**;
2. ou escolha um contrato total que represente falha explicitamente;
3. não misture as duas decisões sem dizer qual contrato está usando.

### O que observar

Pré-condição não é sinônimo de `if`. A implementação pode verificar uma pré-condição, mas o contrato existe antes da escolha de mecanismo de validação.

### Testes / autoverificação

Considere:

```text
divide(10, 2)
divide(-9, 3)
divide(1, 0)
```

<details>
<summary><strong>Solução-modelo possível</strong></summary>

Contrato parcial simples:

```text
PRE:  b != 0
POST: result * b == a, dentro do modelo numérico adotado
```

> **Escopo deste LAB:** adote aritmética exata como modelo conceitual. Em representações de ponto flutuante, arredondamento pode tornar igualdade exata uma pós-condição inadequada; esse mecanismo será aprofundado posteriormente.

Nesse contrato, `b == 0` é uma **violação de pré-condição** e não uma entrada válida da operação. Outra API poderia deliberadamente aceitar qualquer `b` e retornar um resultado/erro estruturado; seria **outro contrato**.

</details>

### Variação / transferência

Compare como duas linguagens diferentes sinalizam a violação do contrato, sem confundir o mecanismo da linguagem com a definição matemática da operação.

---

<a id="-laboratório-4--estado-e-rastreamento"></a>
<a id="lab-t02-04"></a>
## 🧪 Laboratório 4 — Estado e rastreamento

### Objetivo

Tornar visível a evolução do estado durante uma execução.

### Pré-requisitos

- §8 — estado;
- §13 — invariantes em nível introdutório.

### Estado inicial

Problema: contar quantos valores de uma sequência são positivos.

Entrada:

```text
[-2, 4, 0, 7, -1]
```

### Tarefa

Crie uma tabela com:

| iteração | valor | `count` antes | condição `value > 0` | `count` depois |
|---:|---:|---:|---|---:|

Depois formule uma invariante.

### Procedimento

1. inicialize `count = 0`;
2. percorra um elemento por vez;
3. registre o estado antes e depois da decisão;
4. descreva o significado de `count` após cada prefixo processado.

### O que observar

O valor de `count` muda, mas a **propriedade sobre o que ele representa** pode permanecer verdadeira durante todo o percurso.

### Testes / autoverificação

A saída final para a entrada proposta deve ser `2`.

<details>
<summary><strong>Rastreamento e invariante</strong></summary>

| iteração | valor | `count` antes | `value > 0` | `count` depois |
|---:|---:|---:|---|---:|
| 1 | -2 | 0 | falso | 0 |
| 2 | 4 | 0 | verdadeiro | 1 |
| 3 | 0 | 1 | falso | 1 |
| 4 | 7 | 1 | verdadeiro | 2 |
| 5 | -1 | 2 | falso | 2 |

Invariante possível:

> antes de cada nova iteração, `count` é a quantidade de valores positivos no prefixo já processado.

</details>

### Variação / transferência

Troque o predicado por “valor par” e formule a nova invariante.

---

<a id="-laboratório-5--representações"></a>
<a id="lab-t02-05"></a>
## 🧪 Laboratório 5 — Representações

### Objetivo

Comparar representações sem confundir representação com o algoritmo representado.

### Pré-requisitos

- §§14–16 — linguagem natural, pseudocódigo e fluxograma.

### Estado inicial

Escolha um algoritmo curto, por exemplo: determinar se um inteiro é par.

### Tarefa

Represente o mesmo procedimento em:

1. linguagem natural;
2. linguagem natural estruturada;
3. pseudocódigo;
4. fluxograma.

### Procedimento

Preserve o mesmo contrato e compare apenas a forma de representação.

### O que observar

- qual representação evidencia melhor a decisão;
- qual é mais rápida de editar;
- se alguma notação adicionou detalhe acidental da linguagem.

### Testes / autoverificação

Use pelo menos `2`, `3`, `0` e `-4`. Todas as representações devem implicar as mesmas respostas.

<details>
<summary><strong>Solução-modelo possível</strong></summary>

Linguagem natural estruturada:

```text
Receber um inteiro n.
Calcular o resto da divisão de n por 2.
Se o resto for zero, responder verdadeiro.
Caso contrário, responder falso.
```

Pseudocódigo:

```text
IS_EVEN(n)
    if n MOD 2 == 0
        return true
    return false
```

Um fluxograma equivalente possui: início → entrada `n` → decisão `n MOD 2 == 0?` → saída verdadeiro/falso → fim.

</details>

### Variação / transferência

Escolha uma segunda representação como principal e explique por que ela é mais adequada ao seu objetivo de comunicação.

---

<a id="-laboratório-6--transferência"></a>
<a id="lab-t02-06"></a>
## 🧪 Laboratório 6 — Transferência

### Objetivo

Separar algoritmo transferível de sintaxe, semântica, idiomatismo e ambiente.

### Pré-requisitos

- §18 — transferência para quatro linguagens.

### Estado inicial

Escolha um algoritmo simples já compreendido — por exemplo, contar valores positivos.

### Tarefa

Implemente o mesmo contrato em **duas linguagens**. Depois classifique cada diferença encontrada como:

```text
SINTAXE
SEMÂNTICA
IDIOMATISMO
AMBIENTE
```

### Procedimento

1. escreva primeiro o contrato em linguagem neutra;
2. implemente em duas linguagens;
3. execute os mesmos casos;
4. classifique as diferenças;
5. confirme que a coincidência de saída não esconde contratos diferentes.

### O que observar

O estado conceitual e a propriedade desejada podem ser os mesmos, embora tipos, coleções, mecanismo de erro e forma de retorno sejam diferentes.

### Testes / autoverificação

Use pelo menos:

```text
[]
[-1, 0, 2]
[1, 2, 3]
```

Defina previamente o comportamento esperado para coleção vazia.

<details>
<summary><strong>Critérios para considerar o LAB fechado</strong></summary>

O LAB está fechado quando você consegue mostrar:

- um único contrato conceitual;
- duas implementações coerentes com esse contrato;
- mesmos casos de teste;
- ao menos uma diferença de sintaxe;
- ao menos uma diferença de semântica/ambiente **ou** uma justificativa de por que não surgiu diferença material no exemplo escolhido.

Não é obrigatório produzir código visualmente parecido.

</details>

### Variação / transferência

Repita em uma terceira linguagem e identifique se alguma diferença que parecia “só sintaxe” passa a ter consequência semântica.

[↑ Voltar ao índice](#índice)

---

# 22. Exercícios

Tente resolver antes de abrir os blocos de resposta. Os gabaritos explicitam o raciocínio mínimo esperado; formulações equivalentes podem estar corretas.

## 22.1 Classifique

Para cada frase, marque:

```text
PROBLEMA
ALGORITMO
IMPLEMENTAÇÃO
TESTE
```

A. “Dada uma lista não vazia, devolver o maior elemento.”

B. “Definir o primeiro como máximo e comparar os demais.”

C. `max_so_far = values[0]`

D. `assert find_max([1, 9, 3]) == 9`

<details>
<summary><strong>Resposta</strong></summary>

A. problema/especificação  
B. algoritmo  
C. trecho de implementação/representação concreta  
D. teste

</details>

## 22.2 Corrija a definição

> “Algoritmo é um código que recebe dados.”

Encontre pelo menos três problemas nessa frase.

<details>
<summary><strong>Resposta comentada</strong></summary>

Problemas possíveis:

1. algoritmo **não é sinônimo de código**; código é uma representação/implementação concreta;
2. a frase não diz **qual problema** deve ser resolvido nem o que conta como saída correta;
3. “recebe dados” não caracteriza correção, término ou procedimento;
4. um algoritmo pode ser descrito sem escolher uma linguagem de programação.

Uma definição melhor, no escopo deste tópico: **procedimento computacional bem definido que, para entradas pertencentes ao domínio declarado, produz uma saída correta segundo a especificação**.

</details>

## 22.3 Domínio

Defina o domínio de entrada para:

> calcular raiz quadrada real.

Que pré-condição surge?

<details>
<summary><strong>Resposta comentada</strong></summary>

No conjunto dos números reais, uma especificação simples usa domínio:

```text
x >= 0
```

Logo, uma pré-condição natural é `x >= 0`. Se o contrato fosse sobre números complexos, o domínio e a pós-condição seriam outros.

</details>

## 22.4 Estado

Para calcular soma de uma sequência, quais estados mínimos são necessários?

<details>
<summary><strong>Resposta comentada</strong></summary>

Conceitualmente, é necessário ao menos um **acumulador** com a soma do prefixo já processado e algum estado de controle que determine o progresso do percurso — por exemplo, posição atual ou iterador. A representação concreta depende da linguagem.

</details>

## 22.5 Pós-condição

Escreva pós-condição para:

> contar elementos iguais ao alvo.

<details>
<summary><strong>Resposta comentada</strong></summary>

Uma pós-condição possível:

```text
result = quantidade de posições i da entrada tais que values[i] == target
```

Consequentemente, `result` é inteiro não negativo e não pode exceder o tamanho da sequência.

</details>

## 22.6 Término

Explique por que:

```text
i = n

while i > 0
    i = i - 1
```

termina para `n >= 0`.

<details>
<summary><strong>Resposta comentada</strong></summary>

A quantidade `i` começa não negativa, diminui exatamente `1` em cada iteração e é limitada inferiormente por `0`. Portanto, após no máximo `n` iterações, a condição `i > 0` se torna falsa. `i` funciona aqui como uma medida simples de progresso em direção ao término.

</details>

## 22.7 Não término

Encontre o problema:

```text
i = 0

while i < 10
    print(i)
```

<details>
<summary><strong>Resposta comentada</strong></summary>

`i` nunca é alterado. O estado relevante para a condição de continuidade permanece `0`, então `i < 10` continua verdadeiro indefinidamente. Falta uma transição de estado que produza progresso.

</details>

## 22.8 Invariante

Para soma de prefixo:

```text
total = 0

for each value:
    total = total + value
```

proponha uma invariante.

<details>
<summary><strong>Resposta comentada</strong></summary>

Invariante possível:

> antes de processar o próximo elemento, `total` é igual à soma de todos os elementos do prefixo já processado.

A inicialização com `0` torna a propriedade verdadeira para o prefixo vazio; cada soma preserva a propriedade para o prefixo seguinte.

</details>

## 22.9 Determinismo

Explique por que usar um pivô aleatório em quicksort não torna o algoritmo “sem especificação”.

<details>
<summary><strong>Resposta comentada</strong></summary>

A randomização altera decisões internas possíveis, mas não elimina o contrato. O algoritmo continua tendo entrada, regras de execução e uma propriedade que a saída deve satisfazer. Para ordenação, por exemplo, a saída ainda deve conter os mesmos elementos em ordem segundo o comparador, independentemente do pivô escolhido.

</details>

## 22.10 Pseudocódigo

Reescreva o algoritmo `MAXIMUM` sem utilizar nenhuma palavra reservada específica de Python, JavaScript, Java ou Bash.

<details>
<summary><strong>Solução-modelo</strong></summary>

```text
MAXIMUM(values)
    PRE: values is not empty

    max_so_far = first element of values

    for each remaining value in values
        if value > max_so_far
            max_so_far = value

    return max_so_far
```

A notação é deliberadamente neutra; o ponto é tornar explícita a operação necessária sem fingir que existe uma sintaxe universal de pseudocódigo.

</details>

## 22.11 Contraexemplo

Alguém afirma:

> “inicializar mínimo com 0 sempre funciona.”

Construa entrada que refute.

<details>
<summary><strong>Resposta comentada</strong></summary>

Um contraexemplo mínimo é:

```text
[1]
```

Se `min = 0`, nenhuma comparação atualiza o estado e o algoritmo pode retornar `0`, que não é o mínimo da entrada — nem sequer pertence à entrada.

</details>

## 22.12 Correção × eficiência

Dê exemplo conceitual de duas soluções corretas para o mesmo problema, mas com custos diferentes.

<details>
<summary><strong>Resposta comentada</strong></summary>

Para procurar um valor em uma sequência **já ordenada**:

- uma busca sequencial pode testar os elementos em ordem;
- uma busca binária pode descartar aproximadamente metade do espaço restante a cada passo.

As duas podem ser corretas sob a mesma especificação, mas realizam quantidades de trabalho diferentes. A análise formal dos custos pertence aos tópicos posteriores de análise e busca.

</details>

## 22.13 Desafio integrador

Integre as capacidades do capítulo em um único problema.

Problema:

> dada uma sequência de inteiros e um inteiro `target`, retornar quantos elementos são **estritamente maiores** que `target`.

Sem começar pelo código, produza:

1. domínio e instâncias de exemplo;
2. pré-condições e pós-condição;
3. estado necessário;
4. pseudocódigo;
5. uma invariante para o percurso;
6. um rastreamento manual para `values = [2, 7, -1, 7]` e `target = 2`;
7. um argumento de término;
8. um contraexemplo para uma versão defeituosa que inicializa `count = 1`;
9. uma frase separando aquilo que pertence ao algoritmo daquilo que pertenceria à linguagem de implementação.

<details>
<summary><strong>Solução-modelo comentada</strong></summary>

**Domínio:** sequência finita de inteiros e um inteiro `target`. A sequência pode ser vazia.

Um contrato possível:

```text
PRE:  values é uma sequência finita de inteiros
      target é inteiro

POST: result = quantidade de elementos x em values tais que x > target
```

Estado mínimo:

```text
count
+
estado de progresso do percurso
```

Pseudocódigo:

```text
COUNT_GREATER(values, target)
    count = 0

    for each value in values
        if value > target
            count = count + 1

    return count
```

Invariante possível:

> antes de processar o próximo elemento, `count` é exatamente a quantidade de elementos maiores que `target` no prefixo já processado.

Rastreamento:

| Prefixo após a etapa | Valor processado | `count` depois |
|---|---:|---:|
| `[2]` | `2` | `0` |
| `[2, 7]` | `7` | `1` |
| `[2, 7, -1]` | `-1` | `1` |
| `[2, 7, -1, 7]` | `7` | `2` |

Ao terminar, o prefixo processado é a sequência inteira; portanto, a invariante implica a pós-condição. O percurso termina porque processa uma sequência finita e avança um elemento por iteração.

Contraexemplo para `count = 1`:

```text
values = []
target = 10
```

O resultado correto é `0`, mas a inicialização defeituosa já começa em `1`. Se o contrato escolhido excluísse sequência vazia, outro contraexemplo seria `values = [0]`, `target = 10`.

A lógica de contar e o contrato pertencem ao **algoritmo**; sintaxe de loop, tipos concretos, mecanismo de retorno e tratamento de erro pertencem à **linguagem/ambiente de implementação**.

</details>

[↑ Voltar ao índice](#índice)

---

# 23. Evidências de domínio

Como o tópico é `[D]`, a meta vai além de reconhecer definições. Cada item abaixo aponta para pelo menos uma forma concreta de praticar ou verificar a capacidade.

## Você deve conseguir explicar

- [ ] problema × algoritmo — §3, LAB-T02-01, EX 22.1;
- [ ] algoritmo × programa — §7, EX 22.2;
- [ ] entrada × domínio — §§3.1, 4.4 e 5.4, EX 22.3;
- [ ] pré-condição — §9.1, LAB-T02-03;
- [ ] pós-condição — §9.2, LAB-T02-03, EX 22.5;
- [ ] estado inicial/intermediário/final — §8, LAB-T02-04;
- [ ] correção — §10, PR-T02-02, TS-T02-06;
- [ ] término — §11, PR-T02-04, EX 22.6–22.7;
- [ ] determinismo quando aplicável — §12, EX 22.9;
- [ ] pseudocódigo — §15, PR-T02-05, EX 22.10;
- [ ] fluxograma — §16, LAB-T02-05;
- [ ] invariante em nível introdutório — §13, LAB-T02-04, EX 22.8.

## Você deve conseguir aplicar

- [ ] definir contrato simples — PR-T02-01, LAB-T02-03;
- [ ] escrever pseudocódigo — PR-T02-05, LAB-T02-01, EX 22.10;
- [ ] escolher estado adequado — §8, PR-T02-03, LAB-T02-04;
- [ ] construir rastreamento — §17.8, LAB-T02-04;
- [ ] encontrar contraexemplo — PR-T02-02, LAB-T02-02, EX 22.11;
- [ ] detectar inicialização inválida — §17.6, TS-T02-01;
- [ ] identificar condição de término — §11, PR-T02-04, TS-T02-03;
- [ ] integrar contrato, estado, invariante, rastreamento, término e busca de contraexemplo em um único problema — EX 22.13.

## Você deve conseguir depurar

- [ ] distinguir algoritmo errado de implementação errada — §7, PR-T02-02;
- [ ] encontrar entrada que quebra uma hipótese — LAB-T02-02, TS-T02-01;
- [ ] localizar violação de pré-condição — TS-T02-02;
- [ ] identificar loop sem progresso — TS-T02-03, EX 22.7;
- [ ] explicar por que teste isolado não prova correção — §10.3, TS-T02-06.

## Você deve conseguir transferir

- [ ] descrever o algoritmo sem linguagem — §§14–15, LAB-T02-05;
- [ ] implementá-lo em duas linguagens — §18, LAB-T02-06;
- [ ] reconhecer diferenças semânticas — §18.5, LAB-T02-06;
- [ ] explicar como o mesmo estado conceitual aparece em implementações diferentes — §§8 e 18.5.

## Nível 5 — dominar/ensinar

Você deve conseguir receber uma solução de outra pessoa e perguntar sistematicamente:

```text
qual problema?
qual domínio?
qual contrato?
qual estado?
qual inicialização?
qual progresso?
qual invariante?
qual término?
qual argumento de correção?
quais contraexemplos foram procurados?
qual parte pertence ao algoritmo e qual pertence à linguagem?
```

Uma evidência forte de nível 5 é conseguir orientar outra pessoa em `PR-T02-01` a `PR-T02-06` sem entregar a solução pronta, explicar o mecanismo das falhas `TS-T02-01` a `TS-T02-06` e resolver o desafio integrador `22.13` justificando cada parte do raciocínio.

[↑ Voltar ao índice](#índice)

---

# 24. Checklist de consulta rápida

Antes de aceitar um procedimento como algoritmo bem especificado:

```text
[ ] O problema está definido?
[ ] O domínio de entrada está claro?
[ ] A saída correta possui critério verificável?
[ ] As pré-condições estão explícitas?
[ ] Os passos são precisos?
[ ] A ordem está clara?
[ ] O estado necessário está identificado?
[ ] Existe progresso?
[ ] Existe condição de término?
[ ] O algoritmo termina para toda entrada válida?
[ ] O estado final satisfaz a pós-condição?
[ ] Procurei contraexemplos?
[ ] Diferenciei teste de argumento de correção?
[ ] A representação não esconde a parte difícil?
[ ] A descrição depende desnecessariamente de uma linguagem?
```

[↑ Voltar ao índice](#índice)

---

# 25. Glossário

| Termo | Definição |
|---|---|
| **Algoritmo** | Procedimento computacional bem definido para transformar entradas/estado em resultados segundo uma especificação. |
| **Correção** | Propriedade de produzir resultados que satisfazem a especificação para o domínio considerado. |
| **Correção parcial** | Se o algoritmo termina, a pós-condição é satisfeita. |
| **Correção total** | Correção parcial mais garantia de término. |
| **Contrato** | Conjunto explícito de condições e propriedades que delimitam o uso correto de um algoritmo, incluindo pré-condições e pós-condições quando aplicável. |
| **Determinístico** | Com entrada/estado inicial iguais, as escolhas do procedimento são determinadas. |
| **Domínio de entrada** | Conjunto de entradas consideradas válidas para o problema/contrato. |
| **Efetividade** | Propriedade de os passos serem executáveis no modelo de computação adotado. |
| **Estado** | Informação relevante da execução em determinado instante. |
| **Especificação** | Descrição do problema e das propriedades que uma solução correta deve satisfazer, sem determinar necessariamente como a solução será construída. |
| **Finitude** | Término após quantidade finita de passos para entradas do domínio assumido. |
| **Fluxograma** | Representação gráfica do fluxo de um procedimento. |
| **Heurística** | Estratégia prática que busca solução útil sem necessariamente oferecer as mesmas garantias de um algoritmo exato/ótimo. |
| **Instância** | Entrada concreta de um problema geral. |
| **Invariante** | Propriedade que permanece verdadeira em pontos definidos da execução. |
| **Oracle de teste (test oracle)** | Regra ou mecanismo usado para decidir se o resultado observado de um teste satisfaz a especificação esperada. |
| **Pós-condição** | Propriedade que deve valer no estado final correto. |
| **Pré-condição** | Propriedade assumida/esperada antes da execução. |
| **Problema computacional** | Especificação da relação entre entradas e resultados corretos. |
| **Programa** | Implementação executável em linguagem/ambiente concreto. |
| **Pseudocódigo** | Representação estruturada de algoritmo sem gramática universal obrigatória. |
| **Randomizado** | Algoritmo que incorpora escolhas aleatórias à execução. |
| **Término** | Propriedade de a execução alcançar um estado final segundo o contrato. |
| **Variante** | Medida que progride em direção ao término, útil para raciocinar sobre loops/recursão. |

[↑ Voltar ao índice](#índice)

---

# 26. Referências

## 26.1 Taxonomia canônica

### Guia curricular deste projeto

`GUIA_LOGICA_FUNDAMENTOS_ALGORITMOS_E_ESTRUTURAS_DE_DADOS_v2.1.0.md`

Nós usados:

```text
2
2.1
2.2
2.3
2.4
2.5
```

---

## 26.2 Currículo

### ACM / IEEE-CS / AAAI — CS2023

- Algorithmic Foundations:
  - https://csed.acm.org/algorithms-and-complexity/
- Computer Science Curricula 2023:
  - https://csed.acm.org/

Uso:

- posicionamento curricular;
- algorithmic foundations;
- correção e resolução algorítmica como parte da formação.

---

## 26.3 MIT OpenCourseWare

### 6.006 — Introduction to Algorithms

- curso:
  - https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
- Lecture 1 — Introduction:
  - https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec1/
- Recitation 1 — Correctness:
  - https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_r01/

Uso:

- problema como relação entre input e outputs corretos;
- algoritmo determinístico introdutório como mapeamento de entrada para saída;
- correção;
- indução;
- separação entre correção e eficiência.

---

## 26.4 Stanford

### CS161 — Design and Analysis of Algorithms

- material sobre correção e loop invariants:
  - https://web.stanford.edu/class/archive/cs/cs161/cs161.1166/lectures/lecture1.pdf
- página histórica do curso:
  - https://web.stanford.edu/class/archive/cs/cs161/cs161.1166/

Uso:

- correção;
- invariantes;
- inicialização, manutenção e término.

---

## 26.5 Fontes locais efetivamente consultadas

Os materiais abaixo estão disponíveis na File Library e foram **abertos e efetivamente consultados** para esta versão. A presença de outros livros na biblioteca não é tratada como consulta nem como autoridade automática.

### Cormen, Leiserson, Rivest e Stein

**Introduction to Algorithms. 4th ed. MIT Press, 2022.**

PDF local:

```text
Cormen et al. — Introduction to Algorithms 2022.pdf
```

Localizadores e uso:

- Capítulo 1 — *The Role of Algorithms in Computing*: papel de algoritmos;
- Capítulo 2, especialmente §2.1 — pseudocódigo, correção e loop invariants;
- estrutura `Initialization → Maintenance → Termination` para raciocínio de correção;
- fronteira com análise de algoritmos.

### Farrell, Joyce

**Programming Logic and Design. 10th ed. Cengage, 2024.**

PDF local:

```text
Joyce Farrell — Programming Logic and Design 10-ed_2024.pdf
```

Localizadores e uso:

- Capítulo 1, §1.3 — ciclo de desenvolvimento;
- Capítulo 1, §1.4 — pseudocódigo e símbolos de fluxograma;
- Capítulo 1, §1.5 — término por sentinela e exemplo de loop infinito;
- Capítulo 3 — sequência, seleção e repetição como estruturas de controle.

### Skiena, Steven S.

**The Algorithm Design Manual. 3rd ed. Springer, 2020.**

PDF local:

```text
The Algorithm Design Manual by Steven S. Skiena 2020.pdf
```

Localizadores e uso:

- Capítulo 1, especialmente §1.3 — raciocínio sobre correção;
- §1.3.1 — problemas e propriedades: entradas permitidas e propriedades da saída;
- busca de contraexemplos para refutar algoritmos aparentemente plausíveis;
- separação entre correção e eficiência.

### GNU Project — Bash Reference Manual

**GNU Bash Reference Manual 5.3. Free Software Foundation, 2025.**

PDF local:

```text
GNU Bash Reference Manual 5.3.pdf
```

Localizadores e uso:

- §3.4.1 — parâmetros posicionais;
- §3.7.5 — exit status;
- §6.5 — *Shell Arithmetic*;
- confirmação de que variáveis podem ser usadas como operandos e seus valores são avaliados como expressões aritméticas;
- confirmação de que valor nulo ou variável não definida, quando referenciada por nome em expressão aritmética, avalia como `0`;
- confirmação de que a avaliação usa os maiores inteiros de largura fixa disponíveis, sem verificação de overflow;
- delimitação do papel de `stdout` e exit status no exemplo Bash da §18.4.

---

## 26.6 Como as fontes foram usadas

```text
TAXONOMIA v2.1.0
→ escopo canônico

CS2023
→ posição curricular

MIT 6.006
→ definição operacional de problema/algoritmo
→ correção

CLRS
→ pseudocódigo
→ invariantes
→ correção

Stanford CS161
→ contraprova acadêmica de correção/invariantes

Farrell
→ representação didática
→ pseudocódigo/fluxograma
→ lógica fundamental

Skiena
→ problema × instância
→ especificação e contraexemplos
→ correção × eficiência

GNU Bash Reference Manual
→ aritmética do shell
→ parâmetros posicionais
→ exit status e limites do exemplo Bash
```

O enquadramento determinístico do MIT 6.006 é usado como modelo introdutório; ele não é transformado em afirmação de que todo algoritmo possível precisa ser determinístico.

### Síntese multifonte deste tópico

A Visão Panorâmica não replica a organização de uma única fonte. Ela combina funções complementares:

```text
MIT 6.006
→ problema como relação entrada ↔ saídas corretas
→ algoritmo e correção no escopo do problema

CLRS
→ pseudocódigo
→ invariante: inicialização, manutenção, término

Skiena
→ ideia do algoritmo acima da aparência da notação
→ contraexemplos simples para refutar incorreção

Farrell
→ pseudocódigo × fluxograma como representações
→ clareza da lógica antes da linguagem

Stanford CS161
→ reforço independente para correção e loop invariants

TAXONOMIA v2.1.0
→ fronteira curricular e classificação
```

A contribuição de cada fonte foi usada apenas onde ela acrescenta função real; comportamento e definições não foram fundidos quando dependem de escopo diferente.

[↑ Voltar ao índice](#índice)

---

# 27. Histórico de versões

<details>
<summary>Histórico de versões</summary>

| Versão | Data | Alterações |
|---|---|---|
| **0.4.3** | 2026-09-16 | Fecha explicitamente a ponte invariante → término → pós-condição; amplia pós-condições para propriedades do estado final, não apenas valores retornados; define melhor “passo executável” no modelo informal; conecta correção parcial ao caso de não término; esclarece `Nível A` × `difficulty`; adiciona desafio integrador 22.13 e atualiza evidências de domínio. |
| **0.4.2** | 2026-09-16 | Remove notação assintótica prematura da intuição de complexidade; torna o invariante visual por rastreamento de prefixos; padroniza “pós-condição”; torna `[C]`/`[E]` autocontidos; esclarece modelo de computação em nível informal; reforça a semântica e o exit status do exemplo Bash; liga múltiplas saídas corretas a PR/TS e separa estruturalmente Troubleshooting dos Problemas Reais sem renumerar o capítulo. |
| **0.4.1** | 2026-09-16 | Normaliza a convenção interna de pseudocódigo; adiciona ponteiro antecipado para a rota de primeira passagem; inclui Contrato, Especificação e oracle de teste no glossário; reduz repetição expositiva do contraexemplo `max = 0` por referências cruzadas; explicita aritmética exata no LAB 3; preserva PR-*, TS-*, LABs, exercícios, exemplos executáveis e capacidades da v0.4.0. |
| **0.4.0** | 2026-09-16 | Atualiza o contrato para v1.10.0; corrige o fluxograma do máximo com passo explícito de progresso; adiciona rastreabilidade da taxonomia e rota de primeira passagem; estabiliza âncoras de troubleshooting e LABs; completa LABs com testes, explicação e autoverificação; acrescenta gabaritos comentados aos exercícios; vincula evidências de domínio a práticas concretas; usa páginas estáveis do MIT OCW e atualiza a referência Stanford; adiciona localizadores bibliográficos às fontes locais e preserva o conteúdo técnico já aprovado. |
| **0.3.0** | 2026-09-15 | Amplia a Visão Panorâmica como caderno rápido multifonte; materializa `PR-T02-01` a `PR-T02-06` e `TS-T02-01` a `TS-T02-06`; reforça contratos, invariantes, término, múltiplas saídas corretas, prática e referências. |
| **0.2.0** | 2026-09-14 | Aprofunda múltiplas saídas corretas, correção geral e algoritmos randomizados; reorganiza referências e consolida a baseline estável. |
| **0.1.1** | 2026-09-14 | Melhora a hierarquia do índice sem alterar o conteúdo técnico. |
| **0.1.0** | 2026-09-13 | Primeira versão canônica do T02, cobrindo problema × algoritmo, propriedades, estado, contratos, correção, término, determinismo/randomização, invariantes introdutórias, representações, exemplo progressivo, transferência, prática e referências. |

</details>

---

**Fim — Fundamentos de Algoritmos v0.4.3**
