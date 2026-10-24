/* script.js: animações do portfólio (revelação ao rolar, parallax, rolagem suave, relógio).
   Depende do código principal do index.html e do Lenis (carregado no index.html). */
(() => {
// ===== Animações finais =====
const reduzMov = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Com "reduzir movimento" ligado no sistema, o site mantém só fades suaves (sem deslocamentos)
if ("IntersectionObserver" in window) document.documentElement.classList.add("animacoes");
if (reduzMov) document.documentElement.classList.add("reduz");
const parEls = [];

// 1. Entrada do topo, em sequência
document.querySelectorAll(".hero .rotulo, .hero h1, .hero .profissao, .hero .introducao, .hero .acoes .botao, .hero .foto")
  .forEach((el, i) => { el.dataset.ent = ""; el.style.setProperty("--i", i); });
requestAnimationFrame(() => document.querySelector(".hero")?.classList.add("entrou"));

// 6. Faixa em movimento contínuo (conteúdo repetido, sem emenda visível)
const faixa = document.querySelector(".faixa");
if (faixa && !faixa.dataset.m) {
  faixa.dataset.m = "1";
  const trilho = `<div class="trilho">${(faixa.innerHTML + "<b>✳</b>").repeat(3)}</div>`;
  faixa.innerHTML = trilho + trilho;
}

// 5. Linha do tempo desenhada ao rolar
document.querySelector("#experiencia > .revelar:nth-child(2)")?.classList.add("linha-t");

// 4. Revelação gradual de títulos, textos, habilidades, cards e serviços
const revSel = ".revelar, h2, .cabecalho-secao p, .duas-colunas > div > p, .competencias span, .ferramentas span, .servico, .experiencia, .projeto, .dl, .contatos a";
const ioRev = "IntersectionObserver" in window ? new IntersectionObserver(es => {
  es.filter(e => e.isIntersecting).forEach((e, i) => {
    const el = e.target;
    el.style.setProperty("--d", i * 90 + "ms");
    el.classList.add("visivel");
    setTimeout(() => { el.style.removeProperty("--d"); el.classList.add("pronto"); }, 1500 + i * 90);
    ioRev.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }) : null;

function marcar() {
  document.querySelectorAll(revSel).forEach(el => {
    if (el.dataset.rev || el.closest(".hero")) return;
    el.dataset.rev = "1";
    if (el.matches("h2")) dividirPalavras(el);
    if (!el.classList.contains("revelar")) {
      el.classList.add("revelar");
    }
    if (ioRev && !el.classList.contains("visivel")) ioRev.observe(el);
  });
  // 8 e 10. A seta dos links e botões ganha vida própria
  document.querySelectorAll(".servico a, .botao").forEach(el => {
    if (el.children.length) return;
    const m = el.textContent.trim().match(/^(.*?)\s*([↗↓→])$/);
    if (m) el.innerHTML = `${escapar(m[1])}<span class="seta-m" data-s="${m[2]}">${m[2]}</span>`;
  });
}
marcar(); coletarPar();
(() => { let t; return new MutationObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(() => { marcar(); coletarPar(); }); }); })().observe(document.querySelector("main"), { childList: true, subtree: true });

// 2. Menu destaca a seção atual
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) document.querySelectorAll(".links a").forEach(a => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["inicio", "projetos", "sobre", "experiencia", "contato"].forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });
}

// 9. Voltar ao topo + progresso + linha do tempo + sombra do menu
const topo = document.querySelector("#voltar-topo"), cabecalho = document.querySelector("header");
let aguardando = false;
function aoRolar() {
  aguardando = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  topo.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(3) : 0);
  topo.classList.toggle("mostrar", scrollY > 500);
  cabecalho.classList.toggle("rolou", scrollY > 10);
  if (!reduzMov) parEls.forEach(([el, f]) => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    el.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * -f).toFixed(1)}px`;
  });
  const lt = document.querySelector(".linha-t");
  if (lt) { const r = lt.getBoundingClientRect(); lt.style.setProperty("--p", Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height)).toFixed(3)); }
}
addEventListener("scroll", () => { if (!aguardando) { aguardando = true; requestAnimationFrame(aoRolar); } }, { passive: true });
topo.addEventListener("click", () => window.lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: reduzMov ? "auto" : "smooth" }));
aoRolar();

// 10. Resposta ao clique nos botões
document.addEventListener("pointerdown", e => {
  const b = e.target.closest(".botao");
  if (!b || reduzMov) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), o = document.createElement("span");
  o.className = "onda";
  o.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(o);
  o.addEventListener("animationend", () => o.remove());
});

// Ao trocar de imagem na janela ampliada, a nova entra com animação
const mostrarBase = mostrarImagem;
mostrarImagem = function (n) {
  mostrarBase(n);
  const im = document.querySelector("#imagem-ampliada");
  im.classList.remove("anima"); void im.offsetWidth; im.classList.add("anima");
};

function dividirPalavras(h) {
  let k = 0; const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), nos = [];
  while (w.nextNode()) nos.push(w.currentNode);
  nos.forEach(n => {
    const f = document.createDocumentFragment();
    n.nodeValue.split(/(\s+)/).forEach(p => {
      if (!p.trim()) { f.append(p); return; }
      const o = document.createElement("span"); o.className = "pal";
      const i = document.createElement("span"); i.className = "pal-i"; i.textContent = p; i.style.setProperty("--k", k++);
      o.append(i); f.append(o);
    });
    n.replaceWith(f);
  });
}
function coletarPar() {
  parEls.length = 0;
  document.querySelectorAll(".hero .foto img").forEach(el => parEls.push([el, 0.06]));
  document.querySelectorAll(".projeto .capa img").forEach(el => parEls.push([el, 0.035]));
}

// ===== Rolagem suave com inércia (Lenis) =====
if (typeof Lenis !== "undefined" && !reduzMov) {
  window.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
  requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  new MutationObserver(() => lenis[lightbox.open ? "stop" : "start"]()).observe(lightbox, { attributes: true, attributeFilter: ["open"] });
}

// ===== Relógio ao vivo (horário de Brasília) =====
const legendaCidade = [...document.querySelectorAll(".foto-legenda span")].find(el => /Sorocaba/.test(el.textContent));
if (legendaCidade) {
  legendaCidade.innerHTML = 'Sorocaba / SP · <time id="relogio"></time>';
  const fmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo" });
  const tique = () => { document.querySelector("#relogio").textContent = fmt.format(new Date()); };
  tique(); setInterval(tique, 1000);
}
})();
