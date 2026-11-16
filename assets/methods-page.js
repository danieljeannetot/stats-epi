/* methods-page.js — the purposes map. Requires purposes-data.js and course.js (el, txt, clear, css). */
(function(){
const P=PM_PURPOSES,S=PM_STAGES,R=PM_RUNGS,byId=id=>P.find(p=>p.id===id),stName=id=>S.find(s=>s.id===id).name,rgName=id=>R.find(r=>r.id===id).name;
const lnk=l=>l==="D"?"<a href='design.html'>Design</a>":"<a href='lesson-"+String(l).padStart(2,"0")+".html'>L"+l+"</a>";
const DZ=typeof PM_DESIGNS!=="undefined"?PM_DESIGNS:[],dById=id=>DZ.find(d=>d.id===id);
const dChip=(d,weak)=>"<a href='#' class='pm-dchip"+(weak?" weak":"")+(d.covered?"":" nc")+"' data-pd='"+d.id+"'>"+d.name+(d.covered?"":" (not covered)")+"</a>";
function designsFor(pid){return {suits:DZ.filter(d=>d.suits.indexOf(pid)>=0),possible:DZ.filter(d=>d.possible.indexOf(pid)>=0)};}
function designHTML(d){return "<h4 class='pm-h'>Design: "+d.name+(d.covered?"":" <span class='pm-ncb'>not covered</span>")+"</h4>"+
  "<p><b>Unit:</b> "+d.unit+". <b>Compares:</b> "+d.comparison+".</p><p><b>Controls by design:</b> "+d.controls+".</p><p><b>Main threats:</b> "+d.threats+".</p>"+
  "<div class='pm-two'><div><h5>Frequentist methods</h5><p>"+d.freq+"</p></div><div><h5>Bayesian methods</h5><p>"+d.bayes+"</p></div></div>"+
  "<p><b>Suited to:</b> "+d.suits.map(i=>byId(i).name.toLowerCase()).join(", ")+(d.possible.length?". <b>Possible with care:</b> "+d.possible.map(i=>byId(i).name.toLowerCase()).join(", "):"")+".</p>"+
  (d.lessons.length?"<p><b>In this course:</b> "+d.lessons.map(lnk).join(" ")+"</p>":"");}
function bindDesignChips(box,back){box.querySelectorAll("[data-pd]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();box.innerHTML=designHTML(dById(a.dataset.pd))+(back?"<p><a href='#' class='pm-back'>← back</a></p>":"");const b=box.querySelector(".pm-back");if(b)b.addEventListener("click",ev=>{ev.preventDefault();back();});}));}
const toolLi=t=>"<li>"+t.n+" <span class='pm-l'>"+t.l.map(lnk).join(" ")+"</span></li>";
function detailHTML(p){return "<h4 class='pm-h'>"+p.name+"</h4><p class='pm-q'>"+p.q+"</p>"+
  "<p class='pm-tags'><span>ladder: "+rgName(p.rung)+"</span>"+p.stages.map(s=>"<span>cycle: "+stName(s)+"</span>").join("")+"</p>"+
  "<div class='pm-two'><div><h5>Frequentist tools</h5><ul>"+p.freq.map(toolLi).join("")+"</ul></div><div><h5>Bayesian tools</h5><ul>"+p.bayes.map(toolLi).join("")+"</ul></div></div>"+
  (p.nc.length?"<p class='pm-nc'><b>Not covered in this course:</b> "+p.nc.join("; ")+".</p>":"")+
  (function(){const ds=designsFor(p.id);return DZ.length?"<p><b>Designs that can answer it:</b> "+ds.suits.map(d=>dChip(d,false)).join(" ")+(ds.possible.length?" <span class='small'>with care:</span> "+ds.possible.map(d=>dChip(d,true)).join(" "):"")+"</p>":"";})()+
  "<p><b>It demands:</b> "+p.demands+"</p><p><b>What misleads:</b> "+p.misleads+"</p>";}
/* the diagram: research cycle around, question ladder inside */
window.pmDiagram=function(svgId,detailId){const svg=document.getElementById(svgId),det=document.getElementById(detailId);if(!svg)return;
  let sel=null;const h=(location.hash.match(/^#pm-([a-z]+)$/)||[])[1];if(h&&byId(h))sel={type:"p",id:h};
  function draw(){clear(svg);const cx=500,cy=315,rx=410,ry=275,ang=[-90,-18,54,126,198],pos=ang.map(a=>[cx+rx*Math.cos(a*Math.PI/180),cy+ry*Math.sin(a*Math.PI/180)]);
    const defs=el("defs",{},svg),mk=el("marker",{id:svgId+"-arr",viewBox:"0 0 10 10",refX:"8",refY:"5",markerWidth:"7",markerHeight:"7",orient:"auto-start-reverse"},defs);el("path",{d:"M0 0L10 5L0 10z",fill:css("--c-muted")},mk);
    /* arrows along the ellipse between consecutive stages */
    for(let k=0;k<5;k++){const a0=ang[k]+13,a1=(k<4?ang[k+1]:ang[0]+360)-13,pts=[];for(let a=a0;a<=a1;a+=2)pts.push([cx+rx*Math.cos(a*Math.PI/180),cy+ry*Math.sin(a*Math.PI/180)]);
      el("polyline",{points:pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" "),fill:"none",stroke:css("--c-muted"),"stroke-width":1.6,"marker-end":"url(#"+svgId+"-arr)"},svg);}
    const selP=sel&&sel.type==="p"?byId(sel.id):null;
    /* the ladder */
    const L0=290,L1=710,rungTop={pred:108,expl:206,assoc:304,desc:402},RH=90;
    txt(svg,500,100,"the question ladder",{"text-anchor":"middle",style:"font-size:11px;fill:"+css("--c-muted")+";letter-spacing:.08em;text-transform:uppercase"});
    R.forEach(r=>{const y=rungTop[r.id],on=(selP&&selP.rung===r.id)||(sel&&sel.type==="r"&&sel.id===r.id),g=el("g",{style:"cursor:pointer",tabindex:"0",role:"button","aria-label":"Ladder rung: "+r.name},svg);
      el("rect",{x:L0,y:y,width:L1-L0,height:RH,rx:10,fill:css("--c-panel"),stroke:on?css("--p1"):css("--c-rule"),"stroke-width":on?2.5:1.2},g);
      txt(g,L0+12,y+18,r.name.toUpperCase(),{style:"font-size:11px;font-weight:700;letter-spacing:.06em;fill:"+css("--p1")});txt(g,L1-12,y+18,r.desc,{"text-anchor":"end",style:"font-size:10px;fill:"+css("--c-muted")});
      const act=()=>{sel={type:"r",id:r.id};draw();};g.addEventListener("click",act);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}});
      const ps=P.filter(p=>p.rung===r.id),gap=6,w=Math.min(132,(L1-L0-24-(ps.length-1)*gap)/ps.length),x0=L0+12+((L1-L0-24)-(ps.length*w+(ps.length-1)*gap))/2;
      ps.forEach((p,i)=>{const x=x0+i*(w+gap),cyc=sel&&sel.type==="s"&&p.stages.indexOf(sel.id)>=0,isSel=selP&&selP.id===p.id,cg=el("g",{style:"cursor:pointer",tabindex:"0",role:"button","aria-label":"Purpose: "+p.name},svg);
        el("rect",{x:x,y:y+30,width:w,height:46,rx:8,fill:isSel?css("--p2"):cyc?css("--p4"):css("--c-soft"),stroke:isSel||cyc?"none":css("--c-rule")},cg);
        const words=p.short.split(" "),lines=words.length>1&&p.short.length>11?[words.slice(0,Math.ceil(words.length/2)).join(" "),words.slice(Math.ceil(words.length/2)).join(" ")]:[p.short];
        lines.forEach((ln,j)=>txt(cg,x+w/2,y+57+(j-(lines.length-1)/2)*13,ln,{"text-anchor":"middle",style:"font-size:"+(ln.length>12?"10.5":"12")+"px;font-weight:600;fill:"+(isSel||cyc?"#fff":css("--c-ink"))}));
        const act2=e=>{e.stopPropagation();sel={type:"p",id:p.id};draw();};cg.addEventListener("click",act2);cg.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act2(e);}});
        p._xy=[x+w/2,y+53];});});
    /* stages */
    S.forEach((s,k)=>{const [x,y]=pos[k],on=(selP&&selP.stages.indexOf(s.id)>=0)||(sel&&sel.type==="s"&&sel.id===s.id),g=el("g",{style:"cursor:pointer",tabindex:"0",role:"button","aria-label":"Research stage: "+s.name},svg);
      el("rect",{x:x-80,y:y-29,width:160,height:58,rx:12,fill:on?css("--p4"):css("--c-panel"),stroke:on?"none":css("--c-ink"),"stroke-width":1.2},g);
      txt(g,x,y-4,s.name,{"text-anchor":"middle",style:"font-size:14px;font-weight:700;fill:"+(on?"#fff":css("--c-ink"))});txt(g,x,y+13,"research cycle",{"text-anchor":"middle",style:"font-size:10px;fill:"+(on?"#fff":css("--c-muted"))});
      const act=()=>{sel={type:"s",id:s.id};draw();};g.addEventListener("click",act);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}});
      });
    /* connectors from the selected purpose to its stages, drawn underneath and click-through */
    if(selP){const first=svg.querySelector("g");S.forEach((s,k)=>{if(selP.stages.indexOf(s.id)<0)return;const ln=el("line",{x1:selP._xy[0],y1:selP._xy[1],x2:pos[k][0],y2:pos[k][1],stroke:css("--p4"),"stroke-width":1.5,"stroke-dasharray":"4 4",style:"pointer-events:none"},svg);svg.insertBefore(ln,first);});}
    /* the detail card */
    if(!det)return;
    if(!sel)det.innerHTML="<p class='pm-q'>Click a <b>purpose</b> inside the ladder to see the tools that serve it, or a <b>stage</b> of the research cycle to see which purposes it needs.</p>";
    else if(sel.type==="p"){det.innerHTML=detailHTML(selP);bindDesignChips(det,()=>{det.innerHTML=detailHTML(selP);bindDesignChips(det,null);});}
    else{const items=sel.type==="s"?P.filter(p=>p.stages.indexOf(sel.id)>=0):P.filter(p=>p.rung===sel.id),info=sel.type==="s"?S.find(s=>s.id===sel.id):R.find(r=>r.id===sel.id);
      det.innerHTML="<h4 class='pm-h'>"+(sel.type==="s"?"Research cycle: ":"Question ladder: ")+info.name+"</h4><p class='pm-q'>"+info.desc+"</p><p>Purposes here:</p><ul class='pm-list'>"+items.map(p=>"<li><a href='#' data-pm='"+p.id+"'>"+p.name+"</a>: "+p.q+"</li>").join("")+"</ul>";
      det.querySelectorAll("[data-pm]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();sel={type:"p",id:a.dataset.pm};draw();}));}}
  draw();if(typeof onTheme==="function")onTheme(draw);
  window.addEventListener("hashchange",()=>{const h2=(location.hash.match(/^#pm-([a-z]+)$/)||[])[1];if(h2&&byId(h2)){sel={type:"p",id:h2};draw();}});};
/* the full table, read up the ladder */
window.pmTable=function(id){const t=document.getElementById(id);if(!t)return;const order=["desc","assoc","expl","pred"];
  t.innerHTML="<tr><th>Purpose and question</th><th>Frequentist tools</th><th>Bayesian tools</th><th>Not covered here</th><th>Watch out for</th></tr>"+order.map(r=>"<tr class='pm-rung'><td colspan='5'>"+rgName(r)+"</td></tr>"+P.filter(p=>p.rung===r).map(p=>
    "<tr><td><b>"+p.name+"</b><br><span class='small'>"+p.q+"</span><br><span class='small'><b>Designs:</b> "+designsFor(p.id).suits.map(d=>d.name+(d.covered?"":"*")).join(", ")+"</span></td><td><ul>"+p.freq.map(toolLi).join("")+"</ul></td><td><ul>"+p.bayes.map(toolLi).join("")+"</ul></td><td class='small'>"+(p.nc.length?p.nc.join("; "):"—")+"</td><td class='small'>"+p.misleads+"</td></tr>").join("")).join("");};
/* the decision guide */
window.pmGuide=function(selId,dataId,outId){const s=document.getElementById(selId),d=document.getElementById(dataId),o=document.getElementById(outId);if(!s)return;
  const PLAIN={describe:"how big the problem is, where and when",associate:"whether exposure and outcome are related",shape:"the shape of the exposure–response, or a threshold",timing:"when exposure acts (lags, windows)",mixtures:"the joint effect of several exposures",testing:"which hypothesis or model the data support",causal:"what would happen if exposure changed",heterogeneity:"who is most affected",burden:"how many cases are attributable",biascorr:"how much measurement error or confounding distorts my estimate",prediction:"a value I haven't observed, for a person or place",forecasting:"what will happen in the coming days"};
  s.innerHTML=P.map(p=>"<option value='"+p.id+"'>"+PLAIN[p.id]+"</option>").join("");
  const DL={ind:"data on individuals (cohort, cross-sectional, case-control)",ts:"daily counts over time",area:"rates or counts for areas (maps)",clu:"people grouped in clusters (schools, districts)"};
  function go(){const p=byId(s.value),dt=d.querySelector("input:checked").value,fit=t=>t.d.indexOf(dt)>=0;
    const fF=p.freq.filter(fit),fB=p.bayes.filter(fit),oF=p.freq.filter(t=>!fit(t)),oB=p.bayes.filter(t=>!fit(t)),lessons=[...new Set(fF.concat(fB).flatMap(t=>t.l))].sort((a,b)=>a-b);
    const rel={causal:"Before choosing a model, draw a DAG and state the intervention you have in mind.",forecasting:"Use only what would be known at the time of each forecast.",burden:"State the counterfactual exposure, and use a causal relative risk.",testing:"Fix hypotheses, models and priors before looking at the results.",heterogeneity:"Choose the modifiers in advance, and estimate the difference between effects.",prediction:"Judge the model on data it wasn't fitted to."}[p.id];
    const dsF=DZ.filter(x=>x.suits.indexOf(p.id)>=0&&x.data.indexOf(dt)>=0),dsP=DZ.filter(x=>x.possible.indexOf(p.id)>=0&&x.data.indexOf(dt)>=0);
    o.innerHTML="<h4 class='pm-h'>You want to know "+PLAIN[p.id]+", with "+DL[dt]+".</h4>"+(rel?"<p class='pm-q'>"+rel+"</p>":"")+
      "<p><b>1. Designs that fit:</b> "+(dsF.length?dsF.map(x=>dChip(x,false)).join(" "):"none designed for this combination")+(dsP.length?" <span class='small'>with care:</span> "+dsP.map(x=>dChip(x,true)).join(" "):"")+"</p><p><b>2. Methods:</b></p>"+
      "<div class='pm-two'><div><h5>Frequentist</h5>"+(fF.length?"<ul>"+fF.map(toolLi).join("")+"</ul>":"<p class='small'>No tool in this course is designed for this combination.</p>")+"</div><div><h5>Bayesian</h5>"+(fB.length?"<ul>"+fB.map(toolLi).join("")+"</ul>":"<p class='small'>No tool in this course is designed for this combination.</p>")+"</div></div>"+
      (oF.length+oB.length?"<p class='small'><b>Also for this purpose, but built for other data:</b> "+oF.concat(oB).map(t=>t.n).join("; ")+".</p>":"")+
      (p.nc.length?"<p class='small pm-nc'><b>Not covered in this course:</b> "+p.nc.join("; ")+".</p>":"")+
      (lessons.length?"<p><b>Reading path:</b> "+lessons.map(lnk).join(" → ")+"</p>":"")+"<p><b>What misleads:</b> "+p.misleads+"</p>";
    bindDesignChips(o,go);}
  s.addEventListener("change",go);d.addEventListener("change",go);go();};
/* design x purpose grid: click a design for its card */
window.pmDesignGrid=function(tabId,cardId){const t=document.getElementById(tabId),c=document.getElementById(cardId);if(!t)return;
  t.innerHTML="<tr><th>Design</th>"+P.map(p=>"<th class='pm-gh'><span>"+p.short+"</span></th>").join("")+"</tr>"+DZ.map(d=>"<tr><td><a href='#' data-pd='"+d.id+"'>"+d.name+"</a>"+(d.covered?"":" <span class='pm-ncb'>not covered</span>")+"</td>"+P.map(p=>"<td class='pm-gc'>"+(d.suits.indexOf(p.id)>=0?"<span title='suited' class='pm-dot'>●</span>":d.possible.indexOf(p.id)>=0?"<span title='possible with care' class='pm-dot weak'>○</span>":"")+"</td>").join("")+"</tr>").join("");
  if(c){c.innerHTML="<p class='pm-q'>● suited · ○ possible with care. Click a design for what it controls, its threats and its methods.</p>";bindDesignChips(t,null);t.querySelectorAll("[data-pd]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();c.innerHTML=designHTML(dById(a.dataset.pd));}));}};
window.pmDesignTable=function(id){const t=document.getElementById(id);if(!t)return;
  t.innerHTML="<tr><th>Design</th><th>Compares</th><th>Controls by design</th><th>Main threats</th><th>Frequentist methods</th><th>Bayesian methods</th><th>Lessons</th></tr>"+DZ.map(d=>"<tr><td><b>"+d.name+"</b>"+(d.covered?"":"<br><span class='pm-ncb'>not covered</span>")+"<br><span class='small'>"+d.unit+"</span></td><td class='small'>"+d.comparison+"</td><td class='small'>"+d.controls+"</td><td class='small'>"+d.threats+"</td><td class='small'>"+d.freq+"</td><td class='small'>"+d.bayes+"</td><td class='small'>"+(d.lessons.length?d.lessons.map(lnk).join(" "):"—")+"</td></tr>").join("");};
/* purpose label on lessons: fills an element with id "pmLabel" if present */
document.addEventListener("DOMContentLoaded",function(){const m=(location.pathname.match(/lesson-(\d+)/)||[])[1],tgt=document.querySelector(".pm-label");if(!m||!tgt)return;const ids=PM_LESSONS[+m]||[];
  tgt.innerHTML="Purpose: "+ids.map(i=>i==="foundations"?"foundations for every purpose":"<a href='methods.html#pm-"+i+"'>"+(byId(i)?byId(i).name.toLowerCase():i)+"</a>").join(" · ");});
})();
