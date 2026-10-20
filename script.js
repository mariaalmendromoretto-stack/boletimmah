/* =========================================================
   BOLETIM DIGITAL — script.js
   ========================================================= */

/* CONFIGURAÇÃO FIXA DO ALUNO */
const CONFIG_ALUNO = {
  turma: "9C",
  numeroChamada: 24,
  apiUrl: "https://boletim-api.profbt.com.br"
};

/* Média mínima de referência */
const MEDIA_MINIMA = 6.0;

/* Variáveis de Estado da Sessão */
let pinSessao = "";
let dadosAtuais = [];
let emEdicao = false;

/* =========================================================
   1) DADOS BRUTOS LOCAIS (fictícios) — 9º Ano
   ========================================================= */
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

/* =========================================================
   2) FUNÇÃO normalizarNota(valor)
   ========================================================= */
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = Number(valor);
  }

  if (isNaN(numero)) {
    return null;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  return null;
}

/* =========================================================
   3) FUNÇÕES AUXILIARES DE FORMATAÇÃO E CÁLCULO
   ========================================================= */
function formatarNota(valor) {
  if (valor === null || valor === undefined) {
    return "Ainda não lançada";
  }
  return valor.toFixed(1).replace(".", ",");
}

function calcularMedia(notas) {
  const validas = notas.filter(function (n) {
    return n !== null && n !== undefined;
  });

  if (validas.length === 0) {
    return null;
  }

  let soma = 0;
  validas.forEach(function (n) {
    soma += n;
  });

  return soma / validas.length;
}

function definirSituacao(media) {
  if (media === null) {
    return "Nota ainda não disponível";
  }
  if (media >= MEDIA_MINIMA) {
    return "Bom desempenho";
  }
  return "Atenção";
}

function somarFaltas(lista) {
  if (!Array.isArray(lista)) return 0;
  let total = 0;
  lista.forEach(function (f) {
    const num = Number(f);
    if (!isNaN(num)) total += num;
  });
  return total;
}

/* Normaliza e prepara lista de dados locais */
function obterDadosLocaisProcessados() {
  return dadosBrutos.map(function (item) {
    return {
      disciplina: item.disciplina,
      n1: normalizarNota(item.tri1),
      n2: normalizarNota(item.tri2),
      n3: normalizarNota(item.tri3),
      faltasArray: Array.isArray(item.faltas) ? [...item.faltas] : [0, 0, 0]
    };
  });
}

/* Prepara lista obtida da API */
function processarDadosAPI(listaAPI) {
  return listaAPI.map(function (item) {
    const f1 = item.faltas_tri1 !== undefined ? item.faltas_tri1 : (item.faltas ? item.faltas[0] : 0);
    const f2 = item.faltas_tri2 !== undefined ? item.faltas_tri2 : (item.faltas ? item.faltas[1] : 0);
    const f3 = item.faltas_tri3 !== undefined ? item.faltas_tri3 : (item.faltas ? item.faltas[2] : 0);

    return {
      disciplina: item.disciplina,
      n1: item.nota_tri1 !== undefined ? item.nota_tri1 : normalizarNota(item.tri1),
      n2: item.nota_tri2 !== undefined ? item.nota_tri2 : normalizarNota(item.tri2),
      n3: item.nota_tri3 !== undefined ? item.nota_tri3 : normalizarNota(item.tri3),
      faltasArray: [f1, f2, f3]
    };
  });
}

/* =========================================================
   4) CONEXÃO COM A API (ABRIR E SALVAR)
   ========================================================= */
async function abrirBoletim() {
  const pinInput = document.getElementById("pin-input");
  const msgLogin = document.getElementById("msg-login");
  const pinDigitado = pinInput.value.trim();

  if (!pinDigitado) {
    msgLogin.className = "mensagem erro";
    msgLogin.textContent = "Por favor, digite seu PIN.";
    return;
  }

  msgLogin.className = "mensagem";
  msgLogin.textContent = "Conectando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.className = "mensagem erro";
      msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.className = "mensagem erro";
      msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      return;
    }

    if (!resposta.ok) {
      msgLogin.className = "mensagem erro";
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      return;
    }

    const resultado = await resposta.json();

    // PIN válido: armazena em memória e limpa a tela
    pinSessao = pinDigitado;
    pinInput.value = "";

    // Oculta login e exibe boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("area-boletim").style.display = "block";

    // Tratamento dos dados retornados
    if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosAtuais = processarDadosAPI(resultado.dados.disciplinas);
    } else {
      dadosAtuais = obterDadosLocaisProcessados();
    }

    atualizarInterface();

  } catch (erro) {
    msgLogin.className = "mensagem erro";
    msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}

async function salvarAlteracoes() {
  const msgBoletim = document.getElementById("msg-boletim");
  
  if (!validarEGuardarCamposEdicao()) {
    msgBoletim.className = "mensagem erro";
    msgBoletim.textContent = "Corrija os campos destacados antes de salvar.";
    return;
  }

  msgBoletim.className = "mensagem";
  msgBoletim.textContent = "Salvando...";

  // Formatação para envio à API
  const disciplinasEnvio = dadosAtuais.map(function (d) {
    return {
      disciplina: d.disciplina,
      nota_tri1: d.n1,
      nota_tri2: d.n2,
      nota_tri3: d.n3,
      faltas_tri1: d.faltasArray[0],
      faltas_tri2: d.faltasArray[1],
      faltas_tri3: d.faltasArray[2]
    };
  });

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: disciplinasEnvio
        }
      })
    });

    if (!resposta.ok) {
      msgBoletim.className = "mensagem erro";
      msgBoletim.textContent = "Erro ao salvar alterações. Tente novamente.";
      return;
    }

    msgBoletim.className = "mensagem sucesso";
    msgBoletim.textContent = "Dados salvos com sucesso.";

    emEdicao = false;
    document.getElementById("btn-salvar").style.display = "none";
    document.getElementById("btn-alterar").textContent = "Alterar dados";

    atualizarInterface();

  } catch (erro) {
    msgBoletim.className = "mensagem erro";
    msgBoletim.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}

/* =========================================================
   5) VALIDAÇÃO DA EDIÇÃO
   ========================================================= */
function validarNotaDigitada(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    return { valido: true, valor: null };
  }
  const texto = String(valor).replace(",", ".").trim();
  const num = Number(texto);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false };
  }
  return { valido: true, valor: num };
}

function validarFaltaDigitada(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    return { valido: false };
  }
  const texto = String(valor).trim();
  if (!/^\d+$/.test(texto)) {
    return { valido: false };
  }
  const num = Number(texto);
  if (num < 0) {
    return { valido: false };
  }
  return { valido: true, valor: num };
}

function validarEGuardarCamposEdicao() {
  let todosValidos = true;

  dadosAtuais.forEach(function (d, index) {
    const inputN1 = document.getElementById(`n1-${index}`);
    const inputN2 = document.getElementById(`n2-${index}`);
    const inputN3 = document.getElementById(`n3-${index}`);
    const inputF1 = document.getElementById(`f1-${index}`);
    const inputF2 = document.getElementById(`f2-${index}`);
    const inputF3 = document.getElementById(`f3-${index}`);

    if (!inputN1) return;

    const resN1 = validarNotaDigitada(inputN1.value);
    const resN2 = validarNotaDigitada(inputN2.value);
    const resN3 = validarNotaDigitada(inputN3.value);

    const resF1 = validarFaltaDigitada(inputF1.value);
    const resF2 = validarFaltaDigitada(inputF2.value);
    const resF3 = validarFaltaDigitada(inputF3.value);

    // Destaque visual de erro nos campos
    inputN1.classList.toggle("invalido", !resN1.valido);
    inputN2.classList.toggle("invalido", !resN2.valido);
    inputN3.classList.toggle("invalido", !resN3.valido);
    inputF1.classList.toggle("invalido", !resF1.valido);
    inputF2.classList.toggle("invalido", !resF2.valido);
    inputF3.classList.toggle("invalido", !resF3.valido);

    if (resN1.valido && resN2.valido && resN3.valido && resF1.valido && resF2.valido && resF3.valido) {
      d.n1 = resN1.valor;
      d.n2 = resN2.valor;
      d.n3 = resN3.valor;
      d.faltasArray = [resF1.valor, resF2.valor, resF3.valor];
    } else {
      todosValidos = false;
    }
  });

  return todosValidos;
}

function alternarEdicao() {
  const btnSalvar = document.getElementById("btn-salvar");
  const btnAlterar = document.getElementById("btn-alterar");
  const msgBoletim = document.getElementById("msg-boletim");
  msgBoletim.textContent = "";

  if (!emEdicao) {
    emEdicao = true;
    btnSalvar.style.display = "inline-block";
    btnAlterar.textContent = "Cancelar edição";
  } else {
    emEdicao = false;
    btnSalvar.style.display = "none";
    btnAlterar.textContent = "Alterar dados";
  }
  
  montarTabela();
}

/* =========================================================
   6) RENDERIZAÇÃO DA TABELA E CARDS
   ========================================================= */
function atualizarInterface() {
  montarCards();
  montarTabela();
}

function montarTabela() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = "";

  dadosAtuais.forEach(function (d, index) {
    const media = calcularMedia([d.n1, d.n2, d.n3]);
    const totalFaltas = somarFaltas(d.faltasArray);
    const situacao = definirSituacao(media);

    const linha = document.createElement("tr");

    let classeSituacao = "situacao-sem-nota";
    if (situacao === "Bom desempenho") classeSituacao = "situacao-bom";
    else if (situacao === "Atenção") classeSituacao = "situacao-atencao";

    const tdNome = document.createElement("td");
    tdNome.textContent = d.disciplina;

    if (emEdicao) {
      const vN1 = d.n1 === null ? "" : d.n1;
      const vN2 = d.n2 === null ? "" : d.n2;
      const vN3 = d.n3 === null ? "" : d.n3;

      linha.appendChild(tdNome);
      linha.innerHTML += `
        <td><input type="text" class="input-edicao" id="n1-${index}" value="${vN1}" /></td>
        <td><input type="text" class="input-edicao" id="n2-${index}" value="${vN2}" /></td>
        <td><input type="text" class="input-edicao" id="n3-${index}" value="${vN3}" /></td>
        <td>${formatarNota(media)}</td>
        <td>
          <div style="display:flex; gap:2px; justify-content:center;">
            <input type="text" class="input-edicao" id="f1-${index}" value="${d.faltasArray[0]}" title="1º Tri" />
            <input type="text" class="input-edicao" id="f2-${index}" value="${d.faltasArray[1]}" title="2º Tri" />
            <input type="text" class="input-edicao" id="f3-${index}" value="${d.faltasArray[2]}" title="3º Tri" />
          </div>
        </td>
        <td class="${classeSituacao}">${situacao}</td>
      `;
    } else {
      linha.appendChild(tdNome);
      linha.innerHTML += `
        <td>${formatarNota(d.n1)}</td>
        <td>${formatarNota(d.n2)}</td>
        <td>${formatarNota(d.n3)}</td>
        <td>${formatarNota(media)}</td>
        <td>${totalFaltas}</td>
        <td class="${classeSituacao}">${situacao}</td>
      `;
    }

    corpo.appendChild(linha);
  });
}

function montarCards() {
  const areaCards = document.getElementById("cards");
  areaCards.innerHTML = "";

  const mediasDisponiveis = dadosAtuais
    .map(function (d) { return calcularMedia([d.n1, d.n2, d.n3]); })
    .filter(function (m) { return m !== null; });

  let mediaGeral = null;
  if (mediasDisponiveis.length > 0) {
    let soma = 0;
    mediasDisponiveis.forEach(function (m) { soma += m; });
    mediaGeral = soma / mediasDisponiveis.length;
  }

  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  dadosAtuais.forEach(function (d) {
    totalFaltas += somarFaltas(d.faltasArray);
    const media = calcularMedia([d.n1, d.n2, d.n3]);
    const sit = definirSituacao(media);
    if (sit === "Bom desempenho") bomDesempenho++;
    if (sit === "Atenção") atencao++;
  });

  const frequenciaDemonstrativa = 92;

  const cards = [
    { titulo: "Média geral", valor: mediaGeral === null ? "—" : formatarNota(mediaGeral) },
    { titulo: "Total de faltas", valor: totalFaltas },
    { titulo: "Bom desempenho", valor: bomDesempenho + " disciplinas" },
    { titulo: "Precisam de atenção", valor: atencao + " disciplinas" },
    { titulo: "Frequência", valor: frequenciaDemonstrativa + "% • Frequência adequada" }
  ];

  cards.forEach(function (c) {
    const card = document.createElement("div");
    card.className = "card";

    const divTitulo = document.createElement("div");
    divTitulo.className = "titulo-card";
    divTitulo.textContent = c.titulo;

    const divValor = document.createElement("div");
    divValor.className = "valor-card";
    divValor.textContent = c.valor;

    card.appendChild(divTitulo);
    card.appendChild(divValor);
    areaCards.appendChild(card);
  });
}