function salvarTarefas(tarefas) {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function carregarTarefas() {
  return JSON.parse(localStorage.getItem("tarefas")) || [];
}

function qs(sel) {
  return document.querySelector(sel);
}

function qsa(sel) {
  return document.querySelectorAll(sel);
}

// =========================
// ELEMENTOS
// =========================

const listaTarefas = qs("#listaTarefas");
const emptyPendentes = qs("#emptyPendentes");
const busca = qs("#busca");
const filtroPrioridade = qs("#filtroPrioridade");
const btnModoFoco = qs("#btnModoFoco");
const saudacao = qs("#saudacao");

// Modal
const modal = qs("#modal");
const modalTitle = qs("#modalTitle");
const inputTitulo = qs("#inputTitulo");
const inputDescricao = qs("#inputDescricao");
const inputPrioridade = qs("#inputPrioridade");
const inputCategoria = qs("#inputCategoria");
const inputHorario = qs("#inputHorario");
const salvarBtn = qs("#salvarBtn");
const cancelarBtn = qs("#cancelarBtn");
const modalClose = qs("#modalClose");

// Botão flutuante
const btnAdicionar = qs("#btnAdicionar");

// =========================
// ESTADO
// =========================

let editandoId = null;

// =========================
// SAUDAÇÃO
// =========================

function atualizarSaudacao() {
  const h = new Date().getHours();
  saudacao.textContent =
    h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

atualizarSaudacao();

// =========================
// RENDERIZAÇÃO DAS TAREFAS
// =========================

function renderizarTarefas() {
  const buscas = busca.value.toLowerCase();
  const filtro = filtroPrioridade.value;
  const tarefas = carregarTarefas();

  listaTarefas.innerHTML = "";

  const filtradas = tarefas.filter((t) => {
    const matchBusca =
      t.titulo.toLowerCase().includes(buscas) ||
      t.descricao.toLowerCase().includes(buscas);

    const matchFiltro = filtro === "todas" || filtro === t.prioridade;

    return !t.concluida && matchBusca && matchFiltro;
  });

  if (filtradas.length === 0) {
    emptyPendentes.style.display = "block";
    return;
  }

  emptyPendentes.style.display = "none";

  filtradas.forEach((tarefa) => {
    const li = document.createElement("li");
    li.className = "tarefa";

    li.innerHTML = `
      <div class="info">
        <strong>${tarefa.titulo}</strong>
        <p>${tarefa.descricao || ""}</p>
        ${tarefa.categoria ? `<span class="tag">${tarefa.categoria}</span>` : ""}
        ${
          tarefa.horario
            ? `<div class="hora">⏰ ${new Date(tarefa.horario).toLocaleString()}</div>`
            : ""
        }
      </div>

      <div class="acoes">
        <button class="btn concluir">✔</button>
        <button class="btn editar">✎</button>
        <button class="btn excluir">🗑</button>
      </div>
    `;

    // Concluir
    li.querySelector(".concluir").onclick = () => concluirTarefa(tarefa.id);

    // Editar
    li.querySelector(".editar").onclick = () => abrirModalEdicao(tarefa);

    // Excluir
    li.querySelector(".excluir").onclick = () => excluirTarefa(tarefa.id);

    listaTarefas.appendChild(li);
  });

  renderizarUrgentes();
  atualizarProgresso();
}

// =========================
// URGENTES
// =========================

function renderizarUrgentes() {
  const listaUrgentes = qs("#listaUrgentes");
  const tarefas = carregarTarefas();

  const urgentes = tarefas.filter(
    (t) => !t.concluida && t.prioridade === "alta"
  );

  listaUrgentes.innerHTML = urgentes
    .map((u) => `<li>${u.titulo}</li>`)
    .join("");
}

// =========================
// PROGRESSO
// =========================

function atualizarProgresso() {
  const tarefas = carregarTarefas();
  const concluidas = tarefas.filter((t) => t.concluida).length;
  const total = tarefas.length;

  const pct = total === 0 ? 0 : Math.round((concluidas / total) * 100);

  qs("#pctProgresso").textContent = pct + "%";
  qs("#metaProgresso").textContent = `${concluidas} de ${total} concluídas`;

  desenharProgresso(pct);
}

// circulo de progresso
function desenharProgresso(pct) {
  const canvas = qs("#canvasProgress");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ccc";
  ctx.beginPath();
  ctx.arc(80, 80, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(80, 80, 60, -Math.PI / 2, (pct / 100) * Math.PI * 2 - Math.PI / 2);
  ctx.stroke();
}

// =========================
// MODAL
// =========================

function abrirModalNovo() {
  editandoId = null;
  modalTitle.textContent = "Nova tarefa";
  inputTitulo.value = "";
  inputDescricao.value = "";
  inputPrioridade.value = "media";
  inputCategoria.value = "";
  inputHorario.value = "";

  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "flex";
}

function abrirModalEdicao(t) {
  editandoId = t.id;

  modalTitle.textContent = "Editar tarefa";
  inputTitulo.value = t.titulo;
  inputDescricao.value = t.descricao;
  inputPrioridade.value = t.prioridade;
  inputCategoria.value = t.categoria || "";
  inputHorario.value = t.horario
    ? new Date(t.horario).toISOString().slice(0, 16)
    : "";

  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "flex";
}

function fecharModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

// =========================
// AÇÕES DAS TAREFAS
// =========================

function salvarTarefa() {
  const titulo = inputTitulo.value.trim();
  if (!titulo) return alert("Coloque um título!");

  const tarefas = carregarTarefas();

  if (editandoId) {
    const t = tarefas.find((x) => x.id === editandoId);

    t.titulo = titulo;
    t.descricao = inputDescricao.value;
    t.prioridade = inputPrioridade.value;
    t.categoria = inputCategoria.value;
    t.horario = inputHorario.value
      ? new Date(inputHorario.value).getTime()
      : null;

  } else {
    tarefas.push({
      id: Date.now(),
      titulo,
      descricao: inputDescricao.value,
      prioridade: inputPrioridade.value,
      categoria: inputCategoria.value,
      horario: inputHorario.value
        ? new Date(inputHorario.value).getTime()
        : null,
      avisoEnviado: false,
      concluida: false,
    });
  }

  salvarTarefas(tarefas);
  fecharModal();
  renderizarTarefas();
}

function concluirTarefa(id) {
  const tarefas = carregarTarefas();
  const t = tarefas.find((x) => x.id === id);
  t.concluida = true;

  salvarTarefas(tarefas);
  soltarConfete();
  renderizarTarefas();
}

function excluirTarefa(id) {
  let tarefas = carregarTarefas();
  tarefas = tarefas.filter((t) => t.id !== id);
  salvarTarefas(tarefas);
  renderizarTarefas();
}

// =========================
// ALERTA DE PRAZO
// =========================

function verificarAvisos() {
  const agora = Date.now();
  const tarefas = carregarTarefas();

  tarefas.forEach((t) => {
    if (!t.concluida && t.horario) {
      const faltando = t.horario - agora;

      // menos de 10 min
      if (faltando > 0 && faltando <= 600000 && !t.avisoEnviado) {
        t.avisoEnviado = true;
        alert(`⚠️ Atenção! A tarefa "${t.titulo}" está quase no limite do tempo!`);
      }
    }
  });

  salvarTarefas(tarefas);
}

setInterval(verificarAvisos, 30000);

// =========================
// CONFETE
// =========================

function soltarConfete() {
  const canvas = qs("#confettiCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: 8,
      h: 8,
      color: "#" + ((Math.random() * 0xffffff) | 0).toString(16),
      speed: 2 + Math.random() * 3,
    });
  }

  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speed;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    });
    requestAnimationFrame(animar);
  }

  animar();

  setTimeout(() => (canvas.width = 0), 2000);
}

// =========================
// EVENTOS
// =========================

btnAdicionar.onclick = abrirModalNovo;
salvarBtn.onclick = salvarTarefa;
cancelarBtn.onclick = fecharModal;
modalClose.onclick = fecharModal;

busca.oninput = renderizarTarefas;
filtroPrioridade.onchange = renderizarTarefas;

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal();
});

// =========================
// INICIALIZAÇÃO
// =========================

renderizarTarefas();