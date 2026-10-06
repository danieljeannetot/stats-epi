/* Glossary interface for the course.
   - Links the first mention of each glossary term in every numbered section (h2) of a lesson.
   - Hover or focus: a popup with the short definition. Click or Enter: the full entry in a side panel.
   - A "Glossary" button on every page opens the panel with search and an A–Z list.
   Terms can also be marked by hand in a .qmd file:  [mean]{.gterm data-term="mean"}
   Data come from assets/glossary-data.js, generated from glossary/*.yml. */
(function(){
"use strict";
const G = window.COURSE_GLOSSARY || [];
if(!G.length) return;
const BY_ID = {}; G.forEach(t => BY_ID[t.id] = t);
const AVAILABLE = (typeof COURSE_AVAILABLE !== "undefined") ? COURSE_AVAILABLE : [];
const isGlossaryPage = () => !!document.querySelector(".gloss-entry");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- matching ---------- */
function isAbbrev(a){ const l = a.replace(/[^A-Za-z]/g, ""); if(l.length < 2) return false; let u = 0; for(const c of l) if(c === c.toUpperCase()) u++; return u >= Math.max(2, l.length - 1); }
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ALIASES = [];
G.forEach(t => { if(t.auto === false) return; (t.aliases || []).forEach(a => ALIASES.push({text:a, id:t.id, cs:isAbbrev(a), pre:(t.pre || []).map(p => p.toLowerCase())})); });
ALIASES.sort((a, b) => b.text.length - a.text.length);
function buildRe(list, flags){ if(!list.length) return null; return new RegExp("(?<![\\p{L}\\p{N}_])(" + list.map(a => reEsc(a.text)).join("|") + ")(?![\\p{L}\\p{N}_])", flags); }
const CS = ALIASES.filter(a => a.cs), CI = ALIASES.filter(a => !a.cs);
const RE_CS = buildRe(CS, "gu"), RE_CI = buildRe(CI, "giu");
const LOOKUP_CS = {}; CS.forEach(a => { if(!(a.text in LOOKUP_CS)) LOOKUP_CS[a.text] = a; });
const LOOKUP_CI = {}; CI.forEach(a => { const k = a.text.toLowerCase(); if(!(k in LOOKUP_CI)) LOOKUP_CI[k] = a; });

const SKIP = "code,pre,a,button,select,option,label,textarea,input,h1,h2,h3,h4,h5,h6,svg,script,style,summary,mjx-container,.math,.gterm,.no-gloss,.triad .b,.quiz label,.callout-header,.sourceCode,.cell-output,#quarto-header,nav,.sidebar,#TOC,.gpanel,.gpop,.gbtn,.quarto-title-meta,.meta-pills,.statgrid,.legend,.footnav,.done,.citation,#refs,.csl-entry,.references,.further";

function findNext(text, from){
  let best = null;
  for(const [re, look, cs] of [[RE_CS, LOOKUP_CS, true], [RE_CI, LOOKUP_CI, false]]){
    if(!re) continue;
    re.lastIndex = from;
    let m;
    while((m = re.exec(text))){
      const a = cs ? look[m[1]] : look[m[1].toLowerCase()];
      if(!a){ continue; }
      if(a.pre.length){
        const before = text.slice(Math.max(0, m.index - 30), m.index).toLowerCase().match(/([\p{L}]+)[^\p{L}]*$/u);
        if(!before || a.pre.indexOf(before[1]) < 0) continue;
      }
      if(!best || m.index < best.index || (m.index === best.index && m[1].length > best.len)) best = {index:m.index, len:m[1].length, alias:a, str:m[1]};
      break;
    }
  }
  return best;
}

function linkWithin(root, seen){
  root.querySelectorAll(".gterm[data-term]").forEach(m => seen.add(m.dataset.term)); /* terms marked by hand count as the first mention */
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode(n){
    if(!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    const p = n.parentElement; if(!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; }});
  const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    let text = node.nodeValue, pos = 0, frag = null, last = 0;
    while(pos < text.length){
      const hit = findNext(text, pos); if(!hit) break;
      pos = hit.index + hit.len;
      if(seen.has(hit.alias.id)) continue;
      seen.add(hit.alias.id);
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(text.slice(last, hit.index)));
      const s = document.createElement("span");
      s.className = "gterm"; s.dataset.term = hit.alias.id; s.textContent = hit.str;
      frag.appendChild(s); last = pos;
    }
    if(frag){ frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
  });
}

function autolink(){
  if(isGlossaryPage()) return;
  const main = document.querySelector("#quarto-document-content") || document.querySelector("main") || document.body;
  const sections = Array.from(main.querySelectorAll("section.level2"));
  if(!sections.length){ linkWithin(main, new Set()); return; }
  /* text before the first numbered section counts as its own section */
  const seenIntro = new Set();
  const outside = [];
  Array.from(main.children).forEach(ch => { if(!ch.matches("section.level2") && !ch.querySelector("section.level2")) outside.push(ch); });
  outside.forEach(el => linkWithin(el, seenIntro));
  sections.forEach(sec => linkWithin(sec, new Set()));
}

/* ---------- MathJax for popups and the panel ---------- */
let mjLoading = null;
function typeset(el){
  if(window.MathJax && window.MathJax.typesetPromise){ window.MathJax.typesetPromise([el]).catch(() => {}); return; }
  if(!mjLoading){
    mjLoading = new Promise(res => {
      window.MathJax = window.MathJax || {tex:{inlineMath:[["\\(","\\)"]], displayMath:[["\\[","\\]"]]}, startup:{typeset:false}};
      const sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js"; sc.async = true;
      sc.onload = () => { (window.MathJax.startup && window.MathJax.startup.promise ? window.MathJax.startup.promise : Promise.resolve()).then(res); };
      sc.onerror = () => res();
      document.head.appendChild(sc);
    });
  }
  mjLoading.then(() => { if(window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {}); });
}

/* ---------- popup ---------- */
let pop = null, popFor = null, hideTimer = null;
function ensurePop(){
  if(pop) return pop;
  pop = document.createElement("div"); pop.className = "gpop"; pop.setAttribute("role", "tooltip"); pop.id = "gpop"; pop.hidden = true;
  pop.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  pop.addEventListener("mouseleave", () => scheduleHide());
  document.body.appendChild(pop); return pop;
}
function showPop(target, touch){
  const t = BY_ID[target.dataset.term]; if(!t) return;
  ensurePop(); clearTimeout(hideTimer); popFor = target;
  pop.innerHTML = "<b>" + esc(t.term) + "</b>" + t.short + (touch ? "<br><button type='button' class='gopen'>Full definition</button>" : "<span class='ghint'>Click for the full definition</span>");
  if(touch){ pop.querySelector(".gopen").addEventListener("click", () => { hidePop(); openTerm(t.id, target); }); }
  pop.hidden = false;
  const r = target.getBoundingClientRect(), pw = Math.min(340, window.innerWidth - 24);
  let left = window.scrollX + r.left + r.width / 2 - pw / 2;
  left = Math.max(window.scrollX + 12, Math.min(left, window.scrollX + window.innerWidth - pw - 12));
  pop.style.width = pw + "px"; pop.style.left = left + "px";
  const below = window.scrollY + r.bottom + 8;
  pop.style.top = below + "px";
  const ph = pop.offsetHeight;
  if(r.bottom + ph + 16 > window.innerHeight && r.top > ph + 16) pop.style.top = (window.scrollY + r.top - ph - 8) + "px";
  target.setAttribute("aria-describedby", "gpop");
  typeset(pop);
}
function hidePop(){ if(pop){ pop.hidden = true; } if(popFor){ popFor.removeAttribute("aria-describedby"); popFor = null; } }
function scheduleHide(){ clearTimeout(hideTimer); hideTimer = setTimeout(hidePop, 220); }

/* ---------- side panel ---------- */
let panel = null, history = [], returnFocus = null;
function ensurePanel(){
  if(panel) return panel;
  panel = document.createElement("aside"); panel.className = "gpanel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Glossary"); panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = "<header><button type='button' class='gback' aria-label='Back' hidden>←</button><h2>Glossary</h2><button type='button' class='gall'>A–Z</button><button type='button' class='gclose' aria-label='Close glossary'>Close</button></header>" +
    "<div class='gsearch'><input type='search' placeholder='Search the glossary…' aria-label='Search the glossary'></div><div class='gbody' tabindex='-1'></div>";
  document.body.appendChild(panel);
  panel.querySelector(".gclose").addEventListener("click", closePanel);
  panel.querySelector(".gall").addEventListener("click", () => { history = []; renderList(""); panel.querySelector(".gsearch input").value = ""; panel.querySelector(".gsearch input").focus(); });
  panel.querySelector(".gback").addEventListener("click", () => { history.pop(); const prev = history.pop(); if(prev) renderTerm(prev); else renderList(panel.querySelector(".gsearch input").value); });
  panel.querySelector(".gsearch input").addEventListener("input", e => { history = []; renderList(e.target.value); });
  panel.addEventListener("click", e => { const a = e.target.closest("a.gref,a[data-term]"); if(a && a.dataset.term){ e.preventDefault(); renderTerm(a.dataset.term); } });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && panel.classList.contains("open")) closePanel(); });
  return panel;
}
function openPanel(from){
  ensurePanel(); returnFocus = from || document.activeElement;
  panel.classList.add("open"); panel.setAttribute("aria-hidden", "false");
}
function closePanel(){
  if(!panel) return; panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true");
  if(returnFocus && returnFocus.focus) returnFocus.focus();
}
function lessonLinks(ls){
  if(!ls || !ls.length) return "";
  return ls.map(n => AVAILABLE.indexOf(n) >= 0 ? "<a href='lesson-" + String(n).padStart(2, "0") + ".html'>Lesson " + n + "</a>" : "<span>Lesson " + n + " (coming)</span>").join(", ");
}
function sec(title, body, cls){ return body ? "<div class='gsec " + (cls || "") + "'><h4>" + title + "</h4><p>" + body + "</p></div>" : ""; }
function renderTerm(id){
  const t = BY_ID[id]; if(!t) return;
  ensurePanel(); history.push(id);
  const b = panel.querySelector(".gbody");
  b.innerHTML = "<span class='gcatl'>" + esc(t.category) + "</span><h3>" + esc(t.term) + "</h3><p class='gshort'>" + t.short + "</p>" +
    (t.full ? "<p>" + t.full + "</p>" : "") +
    sec("Formal definition", t.formal, "formal") + sec("In epidemiology", t.epi) + sec("Don't confuse", t.confusion) +
    (t.r ? "<div class='gsec'><h4>In R</h4><pre><code>" + esc(t.r) + "</code></pre></div>" : "") +
    sec("How it's reported", t.report) +
    (t.related && t.related.length ? "<div class='gsec'><h4>Related terms</h4><div class='gchips'>" + t.related.map(r => "<a href='#' data-term='" + r.id + "'>" + esc(r.term) + "</a>").join("") + "</div></div>" : "") +
    (t.lessons && t.lessons.length ? "<div class='gsec'><h4>Used in</h4><p>" + lessonLinks(t.lessons) + "</p></div>" : "") +
    "<p class='gfoot'><a href='glossary.html#g-" + t.id + "'>Open this entry on the glossary page</a></p>";
  panel.querySelector(".gback").hidden = history.length < 2;
  b.scrollTop = 0; b.focus({preventScroll:true});
  typeset(b);
}
function renderList(q){
  ensurePanel();
  const s = (q || "").trim().toLowerCase();
  const hits = G.filter(t => !s || t.term.toLowerCase().includes(s) || (t.aliases || []).some(a => a.toLowerCase().includes(s)) || t.short.toLowerCase().includes(s) || t.category.toLowerCase().includes(s));
  let html = "<p class='small'>" + (s ? hits.length + " matching term" + (hits.length === 1 ? "" : "s") : G.length + " terms. Type to search, or browse A–Z.") + "</p><div class='glist'>";
  let L = "";
  hits.forEach(t => { const f = t.term[0].toUpperCase(); if(!s && f !== L){ L = f; html += "<div class='gletter'>" + f + "</div>"; }
    html += "<a href='#' data-term='" + t.id + "'>" + esc(t.term) + "<small>" + t.short.replace(/<[^>]+>/g, "").replace(/\\\(|\\\)/g, "") + "</small></a>"; });
  html += "</div><p class='gfoot'><a href='glossary.html'>Open the full glossary page</a></p>";
  panel.querySelector(".gbody").innerHTML = html; panel.querySelector(".gback").hidden = true;
}
function openTerm(id, from){ history = []; openPanel(from); renderTerm(id); setTimeout(() => { const b = panel.querySelector(".gbody"); if(b) b.focus({preventScroll:true}); }, 30); }
function openBrowse(from){ history = []; openPanel(from); renderList(""); setTimeout(() => panel.querySelector(".gsearch input").focus(), 30); }

/* ---------- wiring ---------- */
function bindTerms(){
  document.querySelectorAll(".gterm[data-term]").forEach(s => {
    if(s.dataset.gready) return; s.dataset.gready = "1";
    if(!BY_ID[s.dataset.term]){ s.classList.remove("gterm"); return; }
    s.setAttribute("tabindex", "0"); s.setAttribute("role", "button");
    s.setAttribute("aria-label", s.textContent + ": glossary term, press Enter for the definition");
    s.addEventListener("mouseenter", () => showPop(s, false));
    s.addEventListener("mouseleave", scheduleHide);
    s.addEventListener("focus", () => showPop(s, false));
    s.addEventListener("blur", scheduleHide);
    s.addEventListener("pointerup", e => {
      if(e.pointerType === "touch"){ e.preventDefault(); if(popFor === s && pop && !pop.hidden){ hidePop(); openTerm(s.dataset.term, s); } else showPop(s, true); }
      else { hidePop(); openTerm(s.dataset.term, s); }
    });
    s.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); hidePop(); openTerm(s.dataset.term, s); } });
  });
}
function addButton(){
  if(document.querySelector(".gbtn")) return;
  const b = document.createElement("button"); b.type = "button"; b.className = "gbtn"; b.textContent = "Glossary"; b.setAttribute("aria-label", "Open the glossary");
  b.addEventListener("click", () => openBrowse(b)); document.body.appendChild(b);
}
document.addEventListener("click", e => { if(pop && !pop.hidden && !e.target.closest(".gpop,.gterm")) hidePop(); });
function init(){ autolink(); bindTerms(); addButton(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0)); else setTimeout(init, 0);
window.courseGlossary = {open:openTerm, browse:openBrowse, relink:() => { bindTerms(); }};
})();
