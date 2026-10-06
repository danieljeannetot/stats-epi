document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children,y=kids.map(c=>c.asthma);
const ci=(b,se)=>[Math.exp(b-1.96*se),Math.exp(b+1.96*se)];
/* a variable for the collider demonstration: clinic attendance depends on NO2 and on asthma */
const rC=makeRng(909);const clinic=kids.map(c=>rC()<1/(1+Math.exp(-(-2.2+0.09*(c.no2_true-25)+2.4*c.asthma)))?1:0);

/* ---------- 9.1 ---------- */
function drawSt(){const K=+$("stK").value;$("stKO").textContent=K;const ses=kids.map(c=>c.ses),cuts=[];for(let k=1;k<K;k++)cuts.push(quantile(ses,k/K));
  const st=kids.map(c=>{let s=0;while(s<cuts.length&&c.ses>cuts[s])s++;return s;});
  const res=[];for(let s=0;s<K;s++){const idx=kids.map((c,i)=>i).filter(i=>st[i]===s),f=glmFit(idx.map(i=>[1,kids[i].no2_true/10]),idx.map(i=>y[i]),"binomial");res.push({b:f.beta[1],se:f.se[1],n:idx.length,no2:mean(idx.map(i=>kids[i].no2_true)),risk:mean(idx.map(i=>y[i]))});}
  const crude=glmFit(kids.map(c=>[1,c.no2_true/10]),y,"binomial"),pooled=glmFit(kids.map((c,i)=>[1,c.no2_true/10].concat(Array.from({length:K-1},(_,k)=>st[i]===k+1?1:0))),y,"binomial"),full=glmFit(kids.map(c=>[1,c.no2_true/10,c.ses,c.green]),y,"binomial");
  const rows=[["crude",crude.beta[1],crude.se[1]]].concat(res.map((r,s)=>["SES stratum "+(s+1)+(K>1?(s===0?" (lowest)":s===K-1?" (highest)":""):""),r.b,r.se])).concat([["adjusted for SES strata",pooled.beta[1],pooled.se[1]],["adjusted for SES and green space",full.beta[1],full.se[1]]]);
  const svg=clear($("stPlot")),F=frame(svg,520,280,{l:190,r:20,t:16,b:40},[0.7,1.8],[0,rows.length+1]);xAxis(F,[0.8,1,1.2,1.4,1.6,1.8],"odds ratio per 10 µg/m³ NO₂",v=>fmt(v,1));
  el("line",{x1:F.X(1),x2:F.X(1),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);el("line",{x1:F.X(TRUTH_B.orPer10),x2:F.X(TRUTH_B.orPer10),y1:F.m.t,y2:F.Y(0),stroke:css("--p4"),"stroke-width":2},svg);
  txt(svg,F.X(TRUTH_B.orPer10)+4,F.m.t+10,"truth",{style:"fill:"+css("--p4")});
  rows.forEach((r,i)=>{const yy=F.Y(rows.length-i),l=ci(r[1],r[2]),col=i===0?"--p2":i>K?"--p1":"--c-lik";txt(svg,F.m.l-8,yy+4,r[0],{"text-anchor":"end",style:"fill:"+css("--c-ink")});
    el("line",{x1:F.X(Math.max(0.7,l[0])),x2:F.X(Math.min(1.8,l[1])),y1:yy,y2:yy,stroke:css(col),"stroke-width":3},svg);el("circle",{cx:F.X(Math.exp(r[1])),cy:yy,r:5,fill:css(col)},svg);});
  $("stStats").innerHTML=[["crude OR",fmt(Math.exp(crude.beta[1]),3)],["adjusted for SES strata",fmt(Math.exp(pooled.beta[1]),3)],["adjusted for SES + green",fmt(Math.exp(full.beta[1]),3)],["true OR",fmt(TRUTH_B.orPer10,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const lo=res[0],hi=res[K-1];
  setNow("stNow","The crude OR, <b>"+fmt(Math.exp(crude.beta[1]),2)+"</b>, is well above the true "+fmt(TRUTH_B.orPer10,2)+". "+(K>1?"Within SES strata, the comparison is between children of similar SES: the lowest stratum has mean NO₂ "+fmt(lo.no2,1)+" µg/m³ and asthma risk "+fmt(100*lo.risk,1)+"%, the highest "+fmt(hi.no2,1)+" and "+fmt(100*hi.risk,1)+"%. The stratum-specific ORs are closer to the truth, and pooling them gives "+fmt(Math.exp(pooled.beta[1]),2)+". ":"With a single stratum, stratification does nothing. Increase the number of strata. ")+"Coarse strata leave <b>residual confounding</b>: children within a broad SES group still differ. Adjusting for SES as a continuous variable and for green space, the other confounder, gives <b>"+fmt(Math.exp(full.beta[1]),2)+"</b>.");}
$("stK").addEventListener("input",drawSt);drawSt();

/* ---------- 9.2: the DAG ---------- */
const HW=k=>Math.max(46,N[k][2].length*4.2+12);
const N={NO2:[100,170,"NO₂"],Asthma:[420,170,"Asthma"],SES:[260,42,"SES"],Smoke:[420,82,"Parent smokes"],Traffic:[70,55,"Traffic"],Green:[180,300,"Green space"],Sex:[340,300,"Sex"],Wheeze:[470,262,"Wheeze test"],Clinic:[260,215,"Clinic visit"]};
const E=[["SES","NO2"],["SES","Asthma"],["SES","Smoke"],["Smoke","Asthma"],["Green","NO2"],["Green","Asthma"],["Traffic","NO2"],["Sex","Asthma"],["NO2","Asthma"],["Asthma","Wheeze"],["NO2","Clinic"],["Asthma","Clinic"]];
const COV={SES:c=>c.ses,Smoke:c=>c.parent_smoke,Green:c=>c.green,Traffic:c=>DISTRICTS[c.district_id-1].traffic,Sex:c=>c.sex==="boy"?1:0,Wheeze:c=>c.wheeze_q,Clinic:(c,i)=>clinic[i]};
let Z=new Set();
const children=v=>E.filter(e=>e[0]===v).map(e=>e[1]);
function desc(v){const out=new Set(),st=[v];while(st.length){const u=st.pop();children(u).forEach(w=>{if(!out.has(w)){out.add(w);st.push(w);}});}return out;}
function paths(){const adj={};Object.keys(N).forEach(k=>adj[k]=[]);E.forEach(e=>{adj[e[0]].push(e[1]);adj[e[1]].push(e[0]);});const out=[];
  (function dfs(p){const u=p[p.length-1];if(u==="Asthma"){if(p.length>2)out.push(p.slice());return;}adj[u].forEach(w=>{if(p.indexOf(w)<0)dfs(p.concat([w]));});})(["NO2"]);return out;}
const has=(a,b)=>E.some(e=>e[0]===a&&e[1]===b);
function status(p){for(let i=1;i<p.length-1;i++){const a=p[i-1],v=p[i],b=p[i+1],col=has(a,v)&&has(b,v);
    if(col){const d=desc(v);if(!Z.has(v)&&![...d].some(x=>Z.has(x)))return {open:false,why:v+" is a collider and is not adjusted for"};}
    else if(Z.has(v))return {open:false,why:"blocked by adjusting for "+N[v][2]};}
  return {open:true,why:p.slice(1,-1).some((v,i)=>has(p[i],v)&&has(p[i+2],v))?"opened by adjusting for a collider":"no variable on it is adjusted for"};}
const fmtPath=p=>p.map((v,i)=>i===0?N[v][2]:(has(p[i-1],v)?" → ":" ← ")+N[v][2]).join("");
function drawDag(){const svg=clear($("dag"));const defs=el("defs",{},svg),mk=el("marker",{id:"arr9",viewBox:"0 0 10 10",refX:"9",refY:"5",markerWidth:"7",markerHeight:"7",orient:"auto-start-reverse"},defs);el("path",{d:"M0 0L10 5L0 10z",fill:css("--c-muted")},mk);
  const P=paths(),openNodes=new Set();P.forEach(p=>{if(status(p).open&&!(p.length===2))p.forEach((v,i)=>{if(i>0)openNodes.add(p[i-1]+">"+v);});});
  E.forEach(e=>{const a=N[e[0]],b=N[e[1]],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,sh=(e[0]==="NO2"&&e[1]==="Asthma");
    const onOpen=openNodes.has(e[0]+">"+e[1])||openNodes.has(e[1]+">"+e[0]);
    const ha=HW(e[0]),hb=HW(e[1]),ta=Math.min(ha/Math.max(1e-6,Math.abs(ux)),17/Math.max(1e-6,Math.abs(uy))),tb=Math.min(hb/Math.max(1e-6,Math.abs(ux)),17/Math.max(1e-6,Math.abs(uy)));
    el("line",{x1:a[0]+ux*ta,y1:a[1]+uy*ta,x2:b[0]-ux*(tb+2),y2:b[1]-uy*(tb+2),stroke:sh?css("--p4"):onOpen?css("--p2"):css("--c-muted"),"stroke-width":sh?3:onOpen?2.4:1.3,"marker-end":"url(#arr9)"},svg);});
  Object.keys(N).forEach(k=>{const n=N[k],fixed=k==="NO2"||k==="Asthma",adj=Z.has(k),g=el("g",{style:fixed?"":"cursor:pointer",tabindex:fixed?"-1":"0",role:fixed?"img":"button","aria-label":n[2]+(adj?" (adjusted)":"")},svg);
    el("rect",{x:n[0]-HW(k),y:n[1]-15,width:2*HW(k),height:30,rx:8,fill:fixed?css(k==="NO2"?"--p1":"--p2"):adj?css("--c-ink"):css("--c-panel"),stroke:css("--c-ink"),"stroke-width":1},g);
    txt(g,n[0],n[1]+4,n[2],{"text-anchor":"middle",style:"font-size:12px;font-weight:600;fill:"+(fixed||adj?css("--c-panel"):css("--c-ink"))});
    if(!fixed){const t=()=>{Z.has(k)?Z.delete(k):Z.add(k);drawDag();};g.addEventListener("click",t);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();t();}});}});
  const zs=[...Z],X=kids.map((c,i)=>[1,c.no2_true/10].concat(zs.map(z=>COV[z](c,i)))),f=glmFit(X,y,"binomial"),or=Math.exp(f.beta[1]),l=ci(f.beta[1],f.se[1]);
  $("dagPaths").innerHTML="<tr><th>Non-causal path from NO₂ to asthma</th><th>Status</th></tr>"+P.filter(p=>p.length>2).map(p=>{const s=status(p);return "<tr><td>"+fmtPath(p)+"</td><td style='color:"+(s.open?"var(--c-bad)":"var(--c-ok)")+"'><b>"+(s.open?"open":"blocked")+"</b><br><span class='small'>"+s.why+"</span></td></tr>";}).join("");
  const openP=P.filter(p=>p.length>2&&status(p).open);
  $("dagStats").innerHTML=[["adjusted for",zs.length?zs.map(z=>N[z][2]).join(", "):"nothing"],["OR per 10 µg/m³",fmt(or,3)],["95% CI",fmt(l[0],2)+" to "+fmt(l[1],2)],["true OR",fmt(TRUTH_B.orPer10,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg=openP.length?"<b>"+openP.length+" non-causal path"+(openP.length>1?"s are":" is")+" open</b> (orange arrows), so the estimate mixes the causal effect with other associations. ":"<b>All non-causal paths are blocked.</b> ";
  msg+="The estimated OR is "+fmt(or,2)+", against a true "+fmt(TRUTH_B.orPer10,2)+". ";
  if(Z.has("Clinic"))msg+="Adjusting for clinic visits, a collider of NO₂ and asthma, opened a path and distorted the estimate. ";
  if(Z.has("Wheeze"))msg+="The wheeze questionnaire is a consequence of asthma; adjusting for it is partly adjusting for the outcome itself, which biases the estimate. ";
  if(Z.has("Traffic"))msg+="Traffic affects NO₂ only. Adjusting for it removes useful exposure variation: the SE is "+fmt(f.se[1],3)+" instead of about "+fmt(glmFit(kids.map(c=>[1,c.no2_true/10,c.ses,c.green]),y,"binomial").se[1],3)+". ";
  if(Z.has("Sex"))msg+="Sex affects only asthma; adjusting for it is harmless and can improve precision slightly. ";
  if(!openP.length&&!Z.has("Clinic")&&!Z.has("Wheeze"))msg+=Z.has("Smoke")&&!Z.has("SES")?"Adjusting for smoking without SES still leaves the SES → asthma path open; check the table.":"This adjustment set is sufficient under the DAG.";
  setNow("dagNow",msg);}
$("dagMin").addEventListener("click",()=>{Z=new Set(["SES","Green"]);drawDag();});$("dagNone").addEventListener("click",()=>{Z=new Set();drawDag();});$("dagAll").addEventListener("click",()=>{Z=new Set(Object.keys(COV));drawDag();});drawDag();

/* ---------- 9.3 ---------- */
$("emD").innerHTML=DISTRICTS.map(d=>"<option value='"+d.id+"'"+(d.name==="Old Town"?" selected":"")+">"+d.name+"</option>").join("");
function heatFit(id,g){const rows=A.rows.filter(r=>r.district_id===id&&r.g===g&&[6,7,8].indexOf(+r.date.slice(5,7))>=0);
  const X=rows.map(r=>[1,r.temp-22].concat([1,2,3,4,5,6].map(j=>r.dow===j?1:0))),f=glmFit(X,rows.map(r=>r.visits),"poisson"),s=Math.sqrt(Math.max(1,f.phi));
  return {b:f.beta[1],se:f.se[1]*s,mean:mean(rows.map(r=>r.visits))};}
function drawEm(){const id=+$("emD").value,g0=+$("emA").value,h=heatFit(id,2),c=heatFit(id,g0),d=h.b-c.b,sed=Math.sqrt(h.se*h.se+c.se*c.se),pd=2*(1-pnormStd(Math.abs(d/sed))),ph=2*(1-pnormStd(Math.abs(h.b/h.se))),pc=2*(1-pnormStd(Math.abs(c.b/c.se)));
  const pctc=(b)=>100*(Math.exp(b)-1),svg=clear($("emPlot")),lo=Math.min(pctc(h.b-2*h.se),pctc(c.b-2*c.se),-1),hi=Math.max(pctc(h.b+2*h.se),pctc(c.b+2*c.se),3),F=frame(svg,520,220,{l:110,r:20,t:16,b:40},[lo,hi],[0,3]);
  xAxis(F,niceTicks(lo,hi,6),"% change in visits per °C, summer days",v=>fmt(v,1));el("line",{x1:F.X(0),x2:F.X(0),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  [[h,"age 65+",2,"--p2"],[c,"age "+AGE_GROUPS[g0],1,"--p1"]].forEach(r=>{const yy=F.Y(r[2]);txt(svg,F.m.l-8,yy+4,r[1],{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("line",{x1:F.X(pctc(r[0].b-1.96*r[0].se)),x2:F.X(pctc(r[0].b+1.96*r[0].se)),y1:yy,y2:yy,stroke:css(r[3]),"stroke-width":4},svg);el("circle",{cx:F.X(pctc(r[0].b)),cy:yy,r:5,fill:css(r[3])},svg);});
  $("emStats").innerHTML=[["65+: % per °C (p)",fmt(pctc(h.b),1)+" ("+pFmt(ph)+")"],[AGE_GROUPS[g0]+": % per °C (p)",fmt(pctc(c.b),1)+" ("+pFmt(pc)+")"],["difference: p",pFmt(pd)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const trap=(ph<0.05)!==(pc<0.05)&&pd>=0.05;
  setNow("emNow","On summer days in "+DISTRICTS[id-1].name+", each °C is associated with a <b>"+fmt(pctc(h.b),1)+"%</b> change in visits among residents aged 65+ (p "+pFmt(ph)+") and "+fmt(pctc(c.b),1)+"% among those aged "+AGE_GROUPS[g0]+" (p "+pFmt(pc)+"). The test of the <b>difference</b> gives p "+pFmt(pd)+". "+(trap?"This is the trap: one group is \"significant\" and the other is not, yet the difference between them is not significant. The "+AGE_GROUPS[g0]+" group simply has "+(c.mean<h.mean?"fewer visits (about "+fmt(c.mean,1)+" a day vs "+fmt(h.mean,1)+")":"a noisier estimate")+", so its estimate is imprecise. Claiming effect modification here would be wrong.":pd<0.05?"Here the difference itself is clearly estimated: there is evidence of effect modification by age.":"Neither the individual estimates nor their difference settle the question; the data are compatible with both equal and different effects.")+" Try other districts: in small ones, such as Lakeside, both estimates are noisy and nothing can be concluded.");
  $("emReport").innerHTML="In "+DISTRICTS[id-1].name+", summer heat was associated with a "+fmt(pctc(h.b),1)+"% increase in visits per °C at age 65+ and "+fmt(pctc(c.b),1)+"% at age "+AGE_GROUPS[g0]+" (<b>ratio of rate ratios "+fmt(Math.exp(d),3)+", 95% CI "+fmt(Math.exp(d-1.96*sed),3)+" to "+fmt(Math.exp(d+1.96*sed),3)+"; p for interaction "+pFmt(pd)+"</b>).";}
["emD","emA"].forEach(id=>$(id).addEventListener("change",drawEm));drawEm();

/* ---------- 9.4 ---------- */
function drawIn(){const k=$("inF").value,sesCut=quantile(kids.map(c=>c.ses),1/3),F={smoke:c=>c.parent_smoke===1,ses:c=>c.ses<sesCut,boy:c=>c.sex==="boy"}[k],lab={smoke:"parent smokes",ses:"low SES",boy:"boy"}[k];
  const r={};[0,1].forEach(a=>[0,1].forEach(b=>{const g=kids.filter(c=>(c.no2_true>=30?1:0)===a&&(F(c)?1:0)===b);r[a+""+b]={risk:mean(g.map(c=>c.asthma)),n:g.length};}));
  const R00=r["00"].risk,RR10=r["10"].risk/R00,RR01=r["01"].risk/R00,RR11=r["11"].risk/R00,reri=RR11-RR10-RR01+1,mult=RR11/(RR10*RR01);
  const rd0=r["10"].risk-r["00"].risk,rd1=r["11"].risk-r["01"].risk;
  $("inTab").innerHTML="<tr><th></th><th class='n'>not "+lab+"</th><th class='n'>"+lab+"</th></tr>"+[0,1].map(a=>"<tr><td>"+(a?"NO₂ ≥ 30":"NO₂ &lt; 30")+"</td>"+[0,1].map(b=>"<td class='n'>"+fmt(100*r[a+""+b].risk,1)+"% <span class='small'>(n = "+fmtInt(r[a+""+b].n)+")</span></td>").join("")+"</tr>").join("")+
    "<tr><td>extra cases per 100 from high NO₂</td><td class='n'>"+fmt(100*rd0,1)+"</td><td class='n'>"+fmt(100*rd1,1)+"</td></tr><tr><td>risk ratio for high NO₂</td><td class='n'>"+fmt(r["10"].risk/r["00"].risk,2)+"</td><td class='n'>"+fmt(r["11"].risk/r["01"].risk,2)+"</td></tr>";
  $("inStats").innerHTML=[["RERI (additive)",fmt(reri,2)],["ratio of RRs (multiplicative)",fmt(mult,2)],["RR, both factors",fmt(RR11,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("inNow","High NO₂ adds <b>"+fmt(100*rd0,1)+" cases per 100</b> among children without the second factor ("+lab+") and <b>"+fmt(100*rd1,1)+"</b> among those with it. On the ratio scale, its risk ratio is "+fmt(r["10"].risk/r["00"].risk,2)+" vs "+fmt(r["11"].risk/r["01"].risk,2)+". "+(Math.abs(mult-1)<0.15&&reri>0.05?"The ratios are similar (little multiplicative interaction), yet because the baseline risk is higher when "+lab+", the same relative effect produces more extra cases: positive additive interaction (RERI "+fmt(reri,2)+"). This is the usual pattern when the true model is multiplicative, as the logistic model used to simulate these data is.":"RERI = "+fmt(reri,2)+" and the ratio of RRs is "+fmt(mult,2)+"; these crude cross-tabulations are noisy, and the groups also differ in other confounders.")+" For public health, the additive scale says where reducing NO₂ would prevent the most cases.");
  $("inReport").innerHTML="The risk of asthma was "+fmt(100*R00,1)+"% with neither high NO₂ nor "+lab+", and "+fmt(100*r["11"].risk,1)+"% with both. <b>RERI "+fmt(reri,2)+"; ratio of risk ratios "+fmt(mult,2)+"</b> (crude; confidence intervals by the delta method or bootstrap).";}
$("inF").addEventListener("change",drawIn);drawIn();

buildQuiz("quizzes",[
 {t:"epi",q:"SES lowers NO₂ exposure and independently lowers asthma risk. Ignoring SES makes the crude NO₂–asthma OR:",o:[["Correct","It mixes the NO₂ effect with the SES association.",0],["Biased, because SES is a confounder","SES opens the backdoor path NO₂ ← SES → asthma.",1],["Biased toward 1","Here the bias is away from 1: low-SES children have both higher NO₂ and higher risk.",0],["Unaffected, as long as the sample is large","Large samples reduce random error, not confounding.",0]]},
 {t:"epi",q:"Clinic attendance is caused by both NO₂ and asthma. Adjusting for it:",o:[["Removes confounding","It isn't a confounder; it's a collider.",0],["Opens a non-causal path and biases the estimate","Conditioning on a common effect creates an association between its causes.",1],["Improves precision without bias","Adjusting for colliders creates bias.",0],["Has no effect","It does; try it in the DAG.",0]]},
 {t:"stat",q:"District traffic affects NO₂ but has no other path to asthma. Adjusting for it:",o:[["Is required to remove confounding","It's not on any backdoor path.",0],["Does not introduce bias, but increases the standard error","It removes exposure variation the model could use: an instrument-like variable costs precision.",1],["Introduces collider bias","It isn't a collider.",0],["Makes the estimate more precise","It makes it less precise.",0]]},
 {t:"epi",q:"The heat effect is significant in the elderly (p = 0.001) but not in children (p = 0.30). The correct conclusion is:",o:[["Heat affects the elderly but not children","Non-significance in children may reflect fewer events. Compare the effects directly.",0],["Test the difference between the two effects before claiming effect modification","Only a test or interval for the difference addresses whether effects differ.",1],["The interaction p-value must be 0.30","The interaction p-value comes from the difference, not from either group.",0],["Children's data should be discarded","They are informative, just imprecise.",0]]},
 {t:"epi",q:"High NO₂ has a risk ratio of 1.3 in children of smokers and 1.3 in children of non-smokers. Baseline risk is higher with a smoking parent. Then:",o:[["There is no interaction on any scale","Equal ratios with different baselines imply different risk differences.",0],["There is no multiplicative interaction, but there is additive interaction","The same RR on a higher baseline adds more cases.",1],["There is multiplicative but not additive interaction","It's the reverse.",0],["Interaction can't be assessed with risk ratios","It can, on both scales.",0]]},
 {t:"stat",q:"A minimal sufficient adjustment set is:",o:[["All variables associated with the outcome","Some of those may be colliders or mediators.",0],["A smallest set of variables that blocks all backdoor paths without opening new ones","Here: SES and green space.",1],["The variables with p < 0.05 in univariable models","Statistical significance doesn't determine confounding.",0],["Every variable measured before the exposure","Pre-exposure variables can still be colliders (M-bias), though rarely.",0]]}]);
onTheme(()=>{drawSt();drawDag();drawEm();drawIn();});
});
