/* readit.js — "B · How to read it" panels.
   Each B panel is a list in the lesson, one item per term, starting with the term in math, e.g.
   - $\beta$: the change in log-odds per 10 µg/m³.
   The script turns the list into clickable term chips with an explanation box and a "show all" toggle.
   Without JavaScript, the plain list is shown instead. */
document.addEventListener("DOMContentLoaded",function(){
  document.querySelectorAll(".triad .d").forEach(function(d){
    const ul=d.querySelector("ul");if(!ul)return;
    const items=[...ul.children].filter(e=>e.tagName==="LI");if(!items.length)return;
    d.classList.add("rd-js");
    const ui=document.createElement("div");ui.className="rd-ui";
    const hint=document.createElement("p");hint.className="rd-hint";hint.textContent="Click a term to see what it does in the model.";
    const row=document.createElement("div");row.className="rd-chips";
    const box=document.createElement("div");box.className="rd-ex";box.setAttribute("aria-live","polite");
    const tog=document.createElement("button");tog.type="button";tog.className="rd-all-btn";tog.textContent="show all";
    const chips=items.map(function(li,i){
      const b=document.createElement("button");b.type="button";b.className="rd-chip";b.setAttribute("aria-pressed","false");
      const m=li.querySelector(".math.inline");
      if(m)b.appendChild(m.cloneNode(true));else b.textContent=(li.textContent.split(":")[0]||"term").trim();
      b.addEventListener("click",function(){
        chips.forEach((c,j)=>c.setAttribute("aria-pressed",String(j===i)));
        const copy=li.cloneNode(true),mm=copy.querySelector(".math.inline");
        if(mm){const sp=document.createElement("span");sp.className="rd-term";sp.appendChild(mm.cloneNode(true));mm.replaceWith(sp);}
        box.innerHTML="";const p=document.createElement("p");p.innerHTML=copy.innerHTML;box.appendChild(p);
      });
      row.appendChild(b);return b;});
    tog.addEventListener("click",function(){const all=d.classList.toggle("rd-all");tog.textContent=all?"hide list":"show all";});
    ui.appendChild(hint);ui.appendChild(row);ui.appendChild(box);ui.appendChild(tog);
    ul.parentNode.insertBefore(ui,ul);
  });
  /* the chips hold copies of math that MathJax may not have typeset yet: typeset them once it is ready */
  (function typeset(tries){const M=window.MathJax;
    if(M&&M.typesetPromise&&M.startup&&M.startup.promise){M.startup.promise.then(()=>M.typesetPromise([...document.querySelectorAll(".rd-ui")])).catch(()=>{});return;}
    if(tries<60)setTimeout(()=>typeset(tries+1),250);})(0);
});
