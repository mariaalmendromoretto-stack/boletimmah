/* =========================================================
   BOLETIM DIGITAL — script.js
   Aqui ficam os dados e a lógica que monta a página.
   ========================================================= */

/* ---------- CONCEITOS RÁPIDOS ----------
   - Variável: uma "caixinha" com nome que guarda um valor.
   - Array: uma lista de valores, em ordem. Ex: [1, 2, 3]
   - Objeto: um conjunto de características. Ex: { nome: "Ana", idade: 14 }
   - Função: um bloco de código que faz uma tarefa e pode ser chamado depois.
   - if: toma uma decisão ("se isso, faça aquilo").
   - forEach: percorre cada item de uma lista.
   - DOM: é a página HTML "vista" pelo JavaScript. Podemos criar e alterar elementos nela.
------------------------------------------- */

/* =========================================================
   1) DADOS BRUTOS (fictícios) — 9º Ano
   =========================================================
   Cada item é um OBJETO com:
   - disciplina (texto)
   - tri1, tri2, tri3 (notas em formatos variados)
   - faltas (uma lista com as faltas de cada trimestre)
*/
const dadosBrutos = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

/* Média mínima de referência */
const MEDIA_MINIMA = 6.0;

/* =========================================================
   2) FUNÇÃO normalizarNota(valor)
   =========================================================
   Converte qualquer nota recebida para a escala 0–10.
   Regras:
   - vazio / null / undefined  -> null (nota ainda não lançada)
   - 0 a 10                    -> mantém
   - >10 e <=100               -> divide por 10
   - aceita ponto ou vírgula decimal
   - valores fora das regras   -> null (inválidos, não entram na média)
*/
function normalizarNota(valor) {
  // Se estiver vazio, nulo ou indefinido, a nota ainda não foi lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto, troca vírgula por ponto para o JavaScript entender
  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = Number(valor);
  }

  // Se não for um número válido, retorna null
  if (isNaN(numero)) {
    return null;
  }

  // Regra: 0 a 10 permanece igual
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Regra: acima de 10 e até 100 divide por 10 (ex: 89 -> 8.9 / 100 -> 10)
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Qualquer outro valor é inválido
  return null;
}

/* =========================================================
   3) FUNÇÃO formatarNota(valor)
   =========================================================
   Mostra a nota com uma casa decimal usando vírgula.
   Se for null, devolve o texto "Ainda não lançada".
*/
function formatarNota(valor) {
  if (valor === null) {
    return "Ainda não lançada";
  }
  return valor.toFixed(1).replace(".", ",");
}

/* =========================================================
   4) FUNÇÃO calcularMedia(notas)
   =========================================================
   Recebe uma lista de notas (já normalizadas, podendo conter null)
   e calcula a média apenas com as notas disponíveis.
   Se não houver nenhuma nota válida, devolve null.
*/
function calcularMedia(notas) {
  // Filtra somente as notas que existem (não são null)
  const validas = notas.filter(function (n) {
    return n !== null;
  });

  // Se não houver nenhuma nota válida, não há média
  if (validas.length === 0) {
    return null;
  }

  // Soma todas as notas válidas
  let soma = 0;
  validas.forEach(function (n) {
    soma += n;
  });

  // Divide pela quantidade de notas válidas
  return soma / validas.length;
}

/* =========================================================
   5) FUNÇÃO definirSituacao(media)
   =========================================================
   Regras:
   - sem média              -> "Nota ainda não disponível"
   - média >= 6.0           -> "Bom desempenho"
   - média < 6.0            -> "Atenção"
*/
function definirSituacao(media) {
  if (media === null) {
    return "Nota ainda não disponível";
  }
  if (media >= MEDIA_MINIMA) {
    return "Bom desempenho";
  }
  return "Atenção";
}

/* =========================================================
   6) FUNÇÃO somarFaltas(lista)
   =========================================================
   Soma as faltas dos trimestres de uma disciplina.
*/
function somarFaltas(lista) {
  let total = 0;
  lista.forEach(function (f) {
    total += f;
  });
  return total;
}

/* =========================================================
   7) PROCESSAR OS DADOS
   =========================================================
   Aqui criamos uma nova lista já com tudo calculado:
   notas normalizadas, média, faltas totais e situação.
*/
const disciplinasProcessadas = dadosBrutos.map(function (item) {
  // Normaliza cada trimestre
  const n1 = normalizarNota(item.tri1);
  const n2 = normalizarNota(item.tri2);
  const n3 = normalizarNota(item.tri3);

  // Calcula a média usando apenas as notas disponíveis
  const media = calcularMedia([n1, n2, n3]);

  // Soma as faltas dos três trimestres
  const totalFaltas = somarFaltas(item.faltas);

  // Define a situação
  const situacao = definirSituacao(media);

  return {
    disciplina: item.disciplina,
    n1: n1,
    n2: n2,
    n3: n3,
    media: media,
    faltas: totalFaltas,
    situacao: situacao
  };
});

/* =========================================================
   8) MONTAR A TABELA NO DOM
   =========================================================
   Pegamos o <tbody id="corpo-tabela"> e criamos as linhas
   automaticamente, uma para cada disciplina.
*/
function montarTabela() {
  const corpo = document.getElementById("corpo-tabela");

  // Limpa qualquer conteúdo antes de montar
  corpo.innerHTML = "";

  disciplinasProcessadas.forEach(function (d) {
    // Cria uma linha <tr>
    const linha = document.createElement("tr");

    // Define a classe da situação para colorir
    let classeSituacao = "situacao-sem-nota";
    if (d.situacao === "Bom desempenho") {
      classeSituacao = "situacao-bom";
    } else if (d.situacao === "Atenção") {
      classeSituacao = "situacao-atencao";
    }

    // Monta as células da linha
    linha.innerHTML = `
      <td>${d.disciplina}</td>
      <td>${formatarNota(d.n1)}</td>
      <td>${formatarNota(d.n2)}</td>
      <td>${formatarNota(d.n3)}</td>
      <td>${formatarNota(d.media)}</td>
      <td>${d.faltas}</td>
      <td class="${classeSituacao}">${d.situacao}</td>
    `;

    // Adiciona a linha dentro do corpo da tabela
    corpo.appendChild(linha);
  });
}

/* =========================================================
   9) MONTAR OS CARDS DE RESUMO
   =========================================================
   Cards:
   - Média geral
   - Total de faltas
   - Disciplinas com bom desempenho
   - Disciplinas que precisam de atenção
   - Frequência demonstrativa (92%, apenas fictícia)
*/
function montarCards() {
  const areaCards = document.getElementById("cards");
  areaCards.innerHTML = "";

  // --- Média geral (média das médias disponíveis) ---
  const mediasDisponiveis = disciplinasProcessadas
    .map(function (d) { return d.media; })
    .filter(function (m) { return m !== null; });

  let mediaGeral = null;
  if (mediasDisponiveis.length > 0) {
    let soma = 0;
    mediasDisponiveis.forEach(function (m) { soma += m; });
    mediaGeral = soma / mediasDisponiveis.length;
  }

  // --- Total de faltas (soma de todas as disciplinas) ---
  let totalFaltas = 0;
  disciplinasProcessadas.forEach(function (d) {
    totalFaltas += d.faltas;
  });

  // --- Contagem de situações ---
  let bomDesempenho = 0;
  let atencao = 0;
  disciplinasProcessadas.forEach(function (d) {
    if (d.situacao === "Bom desempenho") bomDesempenho++;
    if (d.situacao === "Atenção") atencao++;
  });

  // --- Frequência demonstrativa ---
  // ATENÇÃO: este percentual é apenas FICTÍCIO/DEMONSTRATIVO.
  // No futuro, ele será tratado de outra forma (a partir das faltas
  // e do total de aulas), mas nesta etapa NÃO é calculado.
  const frequenciaDemonstrativa = 92;

  // Lista de cards a criar
  const cards = [
    { titulo: "Média geral", valor: mediaGeral === null ? "—" : formatarNota(mediaGeral) },
    { titulo: "Total de faltas", valor: totalFaltas },
    { titulo: "Bom desempenho", valor: bomDesempenho + " disciplinas" },
    { titulo: "Precisam de atenção", valor: atencao + " disciplinas" },
    { titulo: "Frequência", valor: frequenciaDemonstrativa + "% • Frequência adequada" }
  ];

  // Cria cada card e adiciona na página
  cards.forEach(function (c) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="titulo-card">${c.titulo}</div>
      <div class="valor-card">${c.valor}</div>
    `;
    areaCards.appendChild(card);
  });
}

/* =========================================================
   10) INICIAR TUDO
   =========================================================
   Quando a página terminar de carregar, montamos cards e tabela.
*/
montarCards();
montarTabela();