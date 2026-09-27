import { escapeAttribute, escapeHtml } from './html.js';
import { portableBaseSlug } from './slug.js';

const HOME_SUMMARIES_HTML = {
  "T01": "Parte da compreensão do problema e trabalha decomposição, reconhecimento de padrões, abstração, modelagem e construção de soluções como etapas de um processo consciente de resolução.",
  "T02": "Define o que é um algoritmo e conecta problema computacional, entrada, saída, estado, correção, término, pré-condições, pós-condições e formas de representação.",
  "T03": "Distingue dados, valores, literais, identificadores, bindings, variáveis, constantes e atribuição, mostrando como estado e nomenclatura aparecem nas quatro linguagens.",
  "T04": "Apresenta números, booleanos e dados textuais, além de compatibilidade entre tipos, conversões e diferenças semânticas relevantes entre Python, JavaScript, Java e Bash.",
  "T05": "Relaciona expressões a operadores aritméticos, relacionais e lógicos, lógica booleana, precedência, associatividade, ordem de avaliação e short-circuit.",
  "T06": "Mostra como uma execução deixa de ser apenas sequencial e passa a tomar decisões com condições, seleção múltipla, composição lógica e estruturas aninhadas.",
  "T07": "Desenvolve o raciocínio sobre iteração com <code>while</code>, <code>for</code>, <code>do-while</code> quando aplicável, contadores, intervalos, <code>break</code>, <code>continue</code>, término, loops infinitos e erros off-by-one.",
  "T08": "Reúne padrões recorrentes como contadores, acumuladores, flags, sentinelas, máximo/mínimo, busca conceitual, filtragem, transformação e agregação.",
  "T09": "Organiza o fluxo entrada → parsing → validação → processamento → saída e discute casos extremos, reentrada e diferenças de I/O entre os ambientes usados na coleção.",
  "T10": "Introduz sequências, arrays/vetores, matrizes e strings como estruturas manipuláveis, preparando a transição entre valores isolados e conjuntos organizados de dados.",
  "T11": "Apresenta decomposição funcional, funções, procedimentos, parâmetros, argumentos, retorno, escopo básico e composição como ferramentas para controlar complexidade.",
  "T12": "Desenvolve teste de mesa, rastreamento de fluxo, observação de estado intermediário, previsão de resultados e identificação de erros lógicos antes de depender de ferramentas de depuração.",
  "T13": "Separa forma e significado, relacionando sintaxe, semântica, tipagem estática e dinâmica, conversão, casting, parsing e coerção.",
  "T14": "Aprofunda tempo de vida, identidade, referências, cópia, aliasing, mutabilidade e efeitos colaterais, pontos em que diferenças entre linguagens se tornam especialmente importantes.",
  "T15": "Organiza listas, tuplas, conjuntos, mapas/dicionários, strings, iteração e operações de manipulação de dados como ferramentas recorrentes de programação.",
  "T16": "Amplia a modularização para responsabilidades, interfaces conceituais, contratos, módulos, bibliotecas, dependências, acoplamento, reutilização e APIs.",
  "T17": "Explica caso-base, caso recursivo, pilha de chamadas, terminação e a relação entre recursão e iteração, preparando conceitos usados por vários algoritmos posteriores.",
  "T18": "Distingue erros sintáticos, semânticos/de tipo, falhas em execução e erros lógicos, avançando para propagação, captura, recuperação e encerramento seguro.",
  "T19": "Transforma debugging em método: reproduzir, formular hipóteses, observar estado, coletar evidências, usar logs/debuggers e reduzir o espaço de investigação até isolar a causa.",
  "T20": "Trata resultado esperado, casos e classes de teste, assertions, automação e regressão como instrumentos para verificar comportamento e preservar correções.",
  "T21": "Introduz arquivos, streams, persistência textual, dados estruturados simples e tratamento de falhas de I/O em diferentes ambientes de execução.",
  "T22": "Consolida legibilidade, nomenclatura, organização, comentários, documentação, simplicidade e uma mentalidade inicial de segurança como parte do trabalho técnico, não como acabamento opcional.",
  "T23": "Conecta código-fonte a compilação, interpretação, máquinas virtuais, memória, pilha de chamadas, processos e fluxos de entrada/saída para formar um modelo mental de execução.",
  "T24": "Formaliza especificações, invariantes e correção, introduz modelos de custo, complexidade temporal e espacial, notações O/Ω/Θ, classes de crescimento, medição e trade-offs.",
  "T25": "Separa contrato, representação e implementação para distinguir TAD/ADT, estrutura de dados e biblioteca concreta, com foco em invariantes e independência de representação.",
  "T26": "Estuda busca linear e binária a partir de contratos, pré-condições, invariantes, complexidade, casos de borda, duplicatas e critérios práticos de escolha.",
  "T27": "Compara algoritmos por estabilidade, memória, invariantes, complexidade e comportamento dos dados, distinguindo valor conceitual de implementação manual e uso adequado de bibliotecas.",
  "T28": "Relaciona arrays estáticos e dinâmicos, listas ligadas, pilhas, filas e deques aos custos das operações e às decisões de representação.",
  "T29": "Explora Set, Map/Dictionary, funções hash, colisões, chaining, open addressing, load factor, rehash, complexidade esperada e implicações de segurança.",
  "T30": "Distingue Priority Queue como TAD de heap como implementação, trabalhando invariantes, representação em array, inserção, extração, <code>heapify</code>, custos e usos reais.",
  "T31": "Constrói a visão de árvores enraizadas, n-árias e binárias, percursos, BSTs, altura, balanceamento e um panorama de AVL, Red-Black, 2-3, B/B+ Trees e tries.",
  "T32": "Apresenta grafos, classificações, listas e matrizes de adjacência, BFS, DFS, componentes, DAGs, caminhos e a relação entre representação, percurso e complexidade.",
  "T33": "Organiza famílias como brute force, decrease-and-conquer, divide-and-conquer, greedy, transform-and-conquer, programação dinâmica e backtracking, relacionando estratégia, recursão e trade-offs.",
  "T34": "Coloca busca em strings e Regex dentro do panorama algorítmico, passando por matching exato, busca ingênua, KMP, Boyer-Moore, LCS, engines e riscos como ReDoS.",
  "T35": "Fecha a coleção integrando requisitos, TADs, estruturas, algoritmos, workload, análise, medição, segurança e fatores além de Big O para justificar decisões técnicas."
};

export function renderHomeTopicGrid(topics, part) {
  const ranges = { 1:[1,12], 2:[13,23], 3:[24,35] };
  const [start,end] = ranges[part];
  return topics.filter(t => t.number >= start && t.number <= end).map(t => {
    const id = `${t.id.toLowerCase()}--${portableBaseSlug(t.title)}`;
    const summary = HOME_SUMMARIES_HTML[t.id] || escapeHtml(t.description || '');
    const href = `topicos/${t.id.toLowerCase()}/`;
    return `<a aria-label="Abrir ${t.id} — ${escapeAttribute(t.title)}" class="home-topic-card" href="${href}" id="topico-${t.id.toLowerCase()}"><span class="topic-card-number">${t.id}</span><h4 id="${escapeAttribute(id)}">${escapeHtml(t.title)}</h4><p>${summary}</p><span class="topic-card-action">Abrir tópico <span aria-hidden="true">→</span></span></a>`;
  }).join('');
}
