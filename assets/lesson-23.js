document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),summer=r=>[6,7,8].indexOf(+r.date.slice(5,7))>=0;
const dn=(x,m,s)=>Math.exp(-0.5*Math.pow((x-m)/s,2))/(s*Math.sqrt(2*Math.PI));
/* age-group summer heat effects (% change per °C above 22°C), quasi-Poisson, as the likelihood summary */
function eff(scope){return [0,1,2].map(g=>{const rows=A.rows.filter(r=>r.g===g&&summer(r)&&(scope==="c"||r.district==="Lakeside"));
  const X=rows.map(r=>[1,r.temp-22].concat([1,2,3,4,5,6].map(j=>r.dow===j?1:0)).concat(scope==="c"?DISTRICTS.slice(1).map(d=>r.district_id===d.id?1:0):[]));
  const f=glmFit(X,rows.map(r=>r.visits),"poisson");return {b:100*f.beta[1],s:100*f.se[1]*Math.sqrt(Math.max(1,f.phi))};});}
const EFF={c:eff("c"),l:eff("l")};
const pick=k=>k[0]==="c"?EFF.c[+k[1]]:EFF.l[+k[1]],LAB={c0:"whole city, age 0–14",c1:"whole city, age 15–64",c2:"whole city, age 65+",l2:"Lakeside, age 65+"};
const post=(e,tau)=>{const pr=1/(e.s*e.s)+1/(tau*tau),m=(e.b/(e.s*e.s))/pr;return {m:m,s:Math.sqrt(1/pr)};};

/* ---------- 23.1 ROPE ---------- */
function drawR(){const k=$("rE").value,e=pick(k),r=+$("rR").value,p=post(e,5);$("rRO").textContent="± "+fmt(r,2)+"%";
  const lo=Math.min(-1.5,p.m-4*p.s),hi=Math.max(2,p.m+4*p.s),svg=clear($("rPlot")),F=frame(svg,520,240,{l:30,r:12,t:16,b:40},[lo,hi],[0,1.1]);xAxis(F,niceTicks(lo,hi,6),"heat effect (% change in visits per °C)",v=>fmt(v,1));txt(svg,F.m.l,10,"posterior of the effect ("+LAB[k]+"), with the ROPE shaded",{});
  el("rect",{x:F.X(-r),y:F.m.t,width:F.X(r)-F.X(-r),height:F.Y(0)-F.m.t,fill:css("--p4"),"fill-opacity":0.15},svg);
  const xs=[];for(let x=lo;x<=hi;x+=(hi-lo)/300)xs.push(x);const pk=dn(p.m,p.m,p.s);poly(F,xs,xs.map(x=>dn(x,p.m,p.s)/pk),{stroke:css("--c-post"),"stroke-width":2.6});
  const ci=[p.m-1.96*p.s,p.m+1.96*p.s];el("line",{x1:F.X(ci[0]),x2:F.X(ci[1]),y1:F.Y(0.05),y2:F.Y(0.05),stroke:css("--c-post"),"stroke-width":5},svg);
  const cdf=x=>bPnorm((x-p.m)/p.s),pin=cdf(r)-cdf(-r),pab=1-cdf(r),pbe=cdf(-r);
  const dec=ci[0]>-r&&ci[1]<r?"practically equivalent to zero":(ci[0]>r||ci[1]<-r)?"meaningful":"undecided";
  $("rStats").innerHTML=[["posterior median",fmt(p.m,2)+"% per °C"],["95% credible interval",fmt(ci[0],2)+" to "+fmt(ci[1],2)],["P(in ROPE)",fmt(pin,3)],["P(above ROPE)",fmt(pab,3)],["decision",dec]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("rNow","For "+LAB[k]+", the posterior says the effect is about "+fmt(p.m,2)+"% per °C, 95% credible interval "+fmt(ci[0],2)+" to "+fmt(ci[1],2)+". With effects smaller than ±"+fmt(r,2)+"% counted as negligible, the decision is <b>"+dec+"</b>: "+(dec==="meaningful"?"the whole interval lies above the region of negligible effects.":dec==="undecided"?"the interval overlaps the ROPE and extends beyond it, so the data can't yet say whether the effect matters. That isn't the same as \"no effect\" (Lesson 6).":"the interval lies inside the ROPE, so whatever the effect is, it is too small to matter.")+" The posterior probability of a negligible effect is "+fmt(pin,2)+". The ROPE's width is a subject-matter judgment, fixed before looking at the data.");
  $("rReport").innerHTML="The posterior median heat effect was "+fmt(p.m,2)+"% per °C (95% CrI "+fmt(ci[0],2)+" to "+fmt(ci[1],2)+"); with a region of practical equivalence of ±"+fmt(r,2)+"% per °C, <b>the effect was "+dec+"</b> (posterior probability inside the ROPE "+fmt(pin,2)+").";}
["rE"].forEach(id=>$(id).addEventListener("change",drawR));$("rR").addEventListener("input",drawR);drawR();

/* ---------- 23.2 Bayes factors ---------- */
const bf10=(b,s,tau)=>dn(b,0,Math.sqrt(s*s+tau*tau))/dn(b,0,s);
function drawB(){const k=$("bE").value,e=pick(k),tau=Math.pow(10,+$("bT").value);$("bTO").textContent=fmt(tau,tau<1?2:1)+"%";
  const z=e.b/e.s,p=2*(1-pnormStd(Math.abs(z))),bf=bf10(e.b,e.s,tau);
  let svg=clear($("bPlot")),F=frame(svg,520,220,{l:50,r:12,t:16,b:40},[-1.5,3],[-4,6]);yGrid(F,[-4,-2,0,2,4,6],v=>v===0?"1":v>0?"10"+(v>1?"^"+v:""):"1/10"+(v<-1?"^"+(-v):""));
  xAxis(F,[-1,0,1,2,3],"prior SD under H₁ (% per °C, log scale)",v=>fmt(Math.pow(10,v),v<0?1:0));txt(svg,F.m.l,10,"Bayes factor BF₁₀ (log scale): above 1 favors an effect",{});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  const ts=[];for(let t=-1.5;t<=3.0001;t+=0.05)ts.push(t);poly(F,ts,ts.map(t=>Math.max(-4,Math.min(6,Math.log10(bf10(e.b,e.s,Math.pow(10,t)))))),{stroke:css("--p1"),"stroke-width":2.4});
  el("circle",{cx:F.X(Math.log10(tau)),cy:F.Y(Math.max(-4,Math.min(6,Math.log10(bf)))),r:6,fill:css("--p2")},svg);
  svg=clear($("bLind"));F=frame(svg,520,200,{l:50,r:12,t:16,b:40},[0,4],[-3,2]);yGrid(F,[-3,-2,-1,0,1,2],v=>v===0?"1":v>0?"10"+(v>1?"^"+v:""):"1/10"+(v<-1?"^"+(-v):""));
  xAxis(F,[0,1,2,3,4],"sample size relative to now (log scale)",v=>v===0?"×1":"×10"+(v>1?"^"+v:""));txt(svg,F.m.l,10,"BF₁₀ if the p-value stayed at 0.04 while the data grew",{});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  const ks=[];for(let q=0;q<=4.0001;q+=0.05)ks.push(q);poly(F,ks,ks.map(q=>{const s2=e.s/Math.sqrt(Math.pow(10,q));return Math.max(-3,Math.min(2,Math.log10(bf10(2.054*s2,s2,tau))));}),{stroke:css("--p2"),"stroke-width":2.4});
  const lab=bf>100?"extreme evidence for an effect":bf>10?"strong evidence for an effect":bf>3?"moderate evidence for an effect":bf>1/3?"inconclusive":bf>1/10?"moderate evidence for no effect":"strong evidence for no effect";
  $("bStats").innerHTML=[["estimate (SE)",fmt(e.b,2)+" ("+fmt(e.s,2)+")"],["p-value",pFmt(p)],["BF₁₀",bf>1e4?"> 10,000":bf<1e-4?"< 0.0001":fmt(bf,bf<10?2:0)],["reading",lab],["P(H₁ | data), 50:50 prior odds",fmt(bf/(1+bf),3)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("bNow","For "+LAB[k]+", the estimate is "+fmt(e.b,2)+"% per °C (p "+pFmt(p)+"). With a prior SD of "+fmt(tau,tau<1?2:1)+"% under H₁, BF₁₀ = <b>"+(bf>1e4?"more than 10,000":fmt(bf,2))+"</b>: "+lab+". The upper curve shows the same data with every prior width: "+(z>3?"for a strong effect, the Bayes factor favors H₁ over a wide range, but as the prior becomes absurdly wide it still falls.":"as the prior widens beyond plausible effects, the Bayes factor drifts toward H₀, although the data haven't changed.")+" The lower curve is <b>Lindley's paradox</b>: if the p-value stayed at 0.04 while the sample grew 10,000-fold, the Bayes factor would end up favoring \"no effect\", because a fixed p-value in a huge study means a tiny estimated effect, which H₀ predicts better than a prior spread over large effects.");
  $("bReport").innerHTML="Comparing H₁ (effect ~ Normal(0, "+fmt(tau,2)+"²) % per °C) with H₀ (no effect), the Savage–Dickey Bayes factor was <b>BF₁₀ = "+(bf>1e4?"> 10,000":fmt(bf,2))+"</b> ("+lab+"); results under alternative prior widths are shown in Supplementary Figure S3.";}
$("bE").addEventListener("change",drawB);$("bT").addEventListener("input",drawB);drawB();

/* ---------- 23.3 constrained hypotheses ---------- */
const NAMES=["H₀: no group affected","H₌: all affected equally","H_older: only 65+ affected","H_order: 65+ > 15–64 > 0–14","Hᵤ: unconstrained"];
function bfs(es,tau){const P=es.map(e=>post(e,tau)),r=makeRng(2323),N=40000;let cnt=0;for(let i=0;i<N;i++){const d=P.map(p=>p.m+p.s*gaussFrom(r));if(d[2]>d[1]&&d[1]>d[0])cnt++;}
  const pOrd=cnt/N,bfOrd=pOrd/(1/6);
  const bf0=P.reduce((s,p,i)=>s*dn(0,p.m,p.s)/dn(0,0,tau),1);
  /* equality: differences d1 = b2 - b1, d2 = b1 - b0 */
  const C=[[0,-1,1],[-1,1,0]],Sp=C.map(c=>C.map(c2=>c.reduce((s,v,i)=>s+v*c2[i]*P[i].s*P[i].s,0))),mp=C.map(c=>c.reduce((s,v,i)=>s+v*P[i].m,0)),Sr=C.map(c=>C.map(c2=>c.reduce((s,v,i)=>s+v*c2[i]*tau*tau,0)));
  const d2=(m,S)=>{const det=S[0][0]*S[1][1]-S[0][1]*S[1][0],iv=[[S[1][1]/det,-S[0][1]/det],[-S[1][0]/det,S[0][0]/det]],q=m[0]*(iv[0][0]*m[0]+iv[0][1]*m[1])+m[1]*(iv[1][0]*m[0]+iv[1][1]*m[1]);return Math.exp(-0.5*q)/(2*Math.PI*Math.sqrt(det));};
  const bfEq=d2(mp,Sp)/d2([0,0],Sr);
  const bfOld=(dn(0,P[0].m,P[0].s)/dn(0,0,tau))*(dn(0,P[1].m,P[1].s)/dn(0,0,tau))*((1-bPnorm(-P[2].m/P[2].s))/0.5);
  return [bf0,bfEq,bfOld,bfOrd,1];}
function drawH(){const sc=$("hD").value,tau=+$("hT").value,es=EFF[sc];$("hTO").textContent=fmt(tau,1)+"%";const B=bfs(es,tau),tot=sum(B),pp=B.map(b=>b/tot);
  let svg=clear($("hEff")),lo=Math.min(-1,Math.min.apply(null,es.map(e=>e.b-2*e.s))),hi=Math.max(1.5,Math.max.apply(null,es.map(e=>e.b+2*e.s))),F=frame(svg,520,170,{l:70,r:12,t:16,b:36},[lo,hi],[0,4]);
  xAxis(F,niceTicks(lo,hi,6),"% change in visits per °C (95% CI)",v=>fmt(v,1));el("line",{x1:F.X(0),x2:F.X(0),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  ["0–14","15–64","65+"].forEach((g,i)=>{const yy=F.Y(i+1),e=es[i];txt(svg,F.m.l-8,yy+4,"age "+g,{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("line",{x1:F.X(e.b-1.96*e.s),x2:F.X(e.b+1.96*e.s),y1:yy,y2:yy,stroke:css("--p1"),"stroke-width":3},svg);el("circle",{cx:F.X(e.b),cy:yy,r:5,fill:css("--p1")},svg);});
  svg=clear($("hBar"));F=frame(svg,520,220,{l:200,r:20,t:16,b:36},[0,1],[0,5.5]);xAxis(F,[0,0.25,0.5,0.75,1],"posterior probability (equal prior odds)",v=>fmt(v,2));
  NAMES.forEach((n,i)=>{const yy=F.Y(5-i);txt(svg,F.m.l-8,yy+4,n,{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("rect",{x:F.X(0),y:yy-9,width:Math.max(1,F.X(pp[i])-F.X(0)),height:18,fill:css(i===3?"--p2":"--c-prior"),"fill-opacity":0.7},svg);txt(svg,F.X(pp[i])+4,yy+4,fmt(pp[i],3),{});});
  $("hTab").innerHTML="<tr><th>Hypothesis</th><th class='n'>BF vs Hᵤ</th><th class='n'>posterior probability</th></tr>"+NAMES.map((n,i)=>"<tr><td>"+n+"</td><td class='n'>"+(B[i]>1e4?"> 10⁴":B[i]<1e-4?"< 10⁻⁴":fmt(B[i],B[i]<10?2:0))+"</td><td class='n'>"+fmt(pp[i],3)+"</td></tr>").join("");
  const best=pp.indexOf(Math.max.apply(null,pp));
  setNow("hNow",(sc==="c"?"With all districts' summer days, ":"With Lakeside's summer days only, ")+"the hypothesis best supported is <b>"+NAMES[best]+"</b> (posterior probability "+fmt(pp[best],2)+"). "+(sc==="c"?"The effect among older people is clearly positive and the children's effect is close to zero. H_order gains because the estimates fall in the predicted order; H_older competes because the children's and adults' effects are both small. Which wins depends on the prior width: equality and zero constraints are point hypotheses, so, as in 23.2, wide priors favor them. In the simulation, all three groups are affected, in exactly the predicted order, but children and adults only weakly.":"With so few data, the estimates are too imprecise to separate the hypotheses well, and the posterior probabilities depend heavily on the prior: watch them swing as you move the slider. Support for a point hypothesis here mostly reflects the prior's width, not evidence in the data.")+(tau>5?" <b>Caution:</b> with a prior this wide, the point hypotheses (H₀, H₌, H_older) are favored almost automatically, whatever the data, as in 23.2.":"")+" Try a narrow prior (realistic effects of a few percent) and a wide one.");
  $("hReport").innerHTML="Among five hypotheses about age-group heat effects, the order-constrained hypothesis (65+ > 15–64 > 0–14) had a Bayes factor of <b>"+fmt(B[3],2)+"</b> against the unconstrained model and a posterior probability of "+fmt(pp[3],2)+" (equal prior odds; prior SD "+fmt(tau,1)+"% per °C).";}
$("hD").addEventListener("change",drawH);$("hT").addEventListener("input",drawH);drawH();

/* ---------- 23.4 LOO vs Bayes factor ---------- */
const OT=DISTRICTS.find(d=>d.name==="Old Town").id,ROWS=A.rows.filter(r=>r.district_id===OT&&r.g===2),Y=ROWS.map(r=>r.visits),D=A.days,tk=rcsKnots(ROWS.map(r=>r.temp),4);
const base=r=>{const d=D[r.t];return [1,Math.sin(2*Math.PI*d.doy/365.25),Math.cos(2*Math.PI*d.doy/365.25),Math.sin(4*Math.PI*d.doy/365.25),Math.cos(4*Math.PI*d.doy/365.25)].concat([1,2,3,4,5,6].map(j=>d.dow===j?1:0));};
const tmp=r=>rcsRow(r.temp,tk).map((v,i)=>i===0?(v-15)/10:v/10);
const MODELS=[{n:"1: season + weekday",row:r=>base(r)},{n:"2: + temperature",row:r=>base(r).concat(tmp(r))},{n:"3: + temperature + PM2.5",row:r=>base(r).concat(tmp(r),[D[r.t].pm25/10]),pm:true},{n:"4: model 2, negative binomial",row:r=>base(r).concat(tmp(r)),nb:true}];
let LRES=null;
function fitModel(M,pmSD,seed){const X=ROWS.map(M.row),p=X[0].length,pen=[];for(let a=0;a<p;a++){pen.push(new Array(p).fill(0));pen[a][a]=a===0?1/100:1;}if(M.pm)pen[p-1][p-1]=1/(pmSD*pmSD);
  const f=glmFit(X,Y,"poisson",{penalty:pen});let phi=Infinity;if(M.nb){const inv=mean(Y.map((y,i)=>((y-f.mu[i])*(y-f.mu[i])-f.mu[i])/(f.mu[i]*f.mu[i])));phi=inv>0?1/inv:1e6;}
  const V=M.nb?f.vcov.map(r=>r.map(v=>v*Math.max(1,f.phi))):f.vcov,r=bRng(seed),S=400,ll=[];
  const lpNB=(y,mu)=>lgammaFn(y+phi)-lgammaFn(phi)-lgammaFn(y+1)+phi*Math.log(phi/(phi+mu))+y*Math.log(mu/(phi+mu)),lpP=(y,mu)=>y*Math.log(mu)-mu-lgammaFn(y+1);
  for(let s=0;s<S;s++){const b=rmvn(f.beta,V,r);ll.push(X.map((x,i)=>{const mu=Math.exp(x.reduce((q,v,j)=>q+v*b[j],0));return M.nb?lpNB(Y[i],mu):lpP(Y[i],mu);}));}
  const L=psisLoo(ll);
  /* Laplace approximation to the log marginal likelihood */
  let lmax=0;X.forEach((x,i)=>{const mu=Math.exp(x.reduce((q,v,j)=>q+v*f.beta[j],0));lmax+=M.nb?lpNB(Y[i],mu):lpP(Y[i],mu);});
  let lprior=0;for(let a=0;a<p;a++){const sd=1/Math.sqrt(pen[a][a]);lprior+=-0.5*Math.log(2*Math.PI*sd*sd)-0.5*f.beta[a]*f.beta[a]/(sd*sd);}
  const lml=lmax+lprior+0.5*p*Math.log(2*Math.PI)+0.5*bLogdet(V);return {L:L,lml:lml,p:p};}
function runL(){const pmSD=Math.pow(10,+$("lP").value);$("lRun").disabled=true;const res=[];let k=0;
  (function next(){if(k>=MODELS.length){LRES={res:res,pmSD:pmSD};$("lProg").textContent="";$("lRun").disabled=false;drawL();return;}$("lProg").textContent="Fitting model "+(k+1)+" of 4 and computing PSIS-LOO…";res.push(fitModel(MODELS[k],pmSD,2340+k));k++;setTimeout(next,0);})();}
function drawL(){const pmSD=Math.pow(10,+$("lP").value);$("lPO").textContent=fmt(pmSD,pmSD<1?2:0);const svg=clear($("lPlot"));
  if(!LRES||Math.abs(LRES.pmSD-pmSD)>1e-9){$("lTab").innerHTML="";setNow("lNow","Press <b>Fit</b>. Each model is fitted once; 400 posterior draws (from a normal approximation to the posterior) give the pointwise log-likelihoods for PSIS-LOO, and the Laplace approximation gives the marginal likelihood for Bayes factors.");$("lReport").textContent="Fit the models to see a report.";return;}
  const R=LRES.res,best=R.reduce((b,r,i)=>r.L.elpd>R[b].L.elpd?i:b,0),diffs=R.map(r=>{const d=r.L.pointwise.map((v,i)=>v-R[best].L.pointwise[i]);return {d:sum(d),se:Math.sqrt(d.length*(sd(d)**2))};});
  const lo=Math.min.apply(null,diffs.map(x=>x.d-2*x.se))-5,F=frame(svg,520,220,{l:180,r:16,t:16,b:40},[lo,5],[0,5]);xAxis(F,niceTicks(lo,5,5),"ELPD difference from the best model (± 2 SE)",v=>fmt(v,0));
  el("line",{x1:F.X(0),x2:F.X(0),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  MODELS.forEach((M,i)=>{const yy=F.Y(4-i);txt(svg,F.m.l-8,yy+4,M.n,{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("line",{x1:F.X(diffs[i].d-2*diffs[i].se),x2:F.X(diffs[i].d+2*diffs[i].se),y1:yy,y2:yy,stroke:css("--p1"),"stroke-width":3},svg);el("circle",{cx:F.X(diffs[i].d),cy:yy,r:6,fill:css(i===best?"--p2":"--p1")},svg);});
  const lb=i=>R[i].lml-R[1].lml;
  $("lTab").innerHTML="<tr><th>Model</th><th class='n'>ELPD (SE)</th><th class='n'>p_loo</th><th class='n'>max k̂</th><th class='n'>log BF vs model 2</th></tr>"+MODELS.map((M,i)=>"<tr><td>"+M.n+"</td><td class='n'>"+fmt(R[i].L.elpd,1)+" ("+fmt(R[i].L.se,1)+")</td><td class='n'>"+fmt(R[i].L.p_loo,1)+"</td><td class='n' style='color:"+(Math.max.apply(null,R[i].L.k)>0.7?"var(--c-bad)":"var(--c-ok)")+"'>"+fmt(Math.max.apply(null,R[i].L.k),2)+"</td><td class='n'>"+fmt(lb(i),1)+"</td></tr>").join("");
  const pair=(a,b)=>{const d=R[a].L.pointwise.map((v,i)=>v-R[b].L.pointwise[i]);return {d:sum(d),se:Math.sqrt(d.length*(sd(d)**2))};},t21=pair(1,0),p32=pair(2,1),kmax=Math.max.apply(null,R.map(r=>Math.max.apply(null,r.L.k)));
  setNow("lNow","The <b>best predicting model is "+MODELS[best].n+"</b>. "+(best===3?"The negative binomial model predicts much better than the Poisson models, because it gives honest predictive spread for overdispersed counts (Lesson 22's posterior predictive check made the same point). ":"")+"Adding temperature to season and weekday changes the ELPD by "+fmt(t21.d,1)+" (SE "+fmt(t21.se,1)+"): "+(t21.d>2*t21.se?"a clear improvement":"not a clear improvement")+". Adding PM2.5 changes it by "+fmt(p32.d,1)+" (SE "+fmt(p32.se,1)+"): "+(p32.d>2*p32.se?"a clear improvement":"within its uncertainty")+". Now move the PM2.5 prior slider and refit: LOO barely moves, because the data quickly overrule the prior. The log Bayes factor of model 3 against model 2, "+fmt(lb(2),1)+", falls by about 2.3 for every tenfold widening of the prior: the Bayes factor punishes a vague prior that LOO ignores. All Pareto k̂ values are "+(Math.max.apply(null,R.map(r=>Math.max.apply(null,r.L.k)))>0.7?"not all below 0.7: some observations are influential, so their LOO estimates need exact refits.":"below 0.7, so the PSIS approximation is reliable.")+" Note that log Bayes factors involving model 4 also reflect its fixed dispersion parameter; LOO is the fairer comparison there.");
  const SHORT=["season-and-weekday Poisson","Poisson with temperature","Poisson with temperature and PM2.5","negative binomial with temperature"];
  $("lReport").innerHTML="Models were compared by PSIS-LOO. The <b>"+SHORT[best]+" model had the highest expected log predictive density</b>; differences from the other models were "+diffs.map((x,i)=>i===best?null:fmt(x.d,1)+" (SE "+fmt(x.se,1)+")").filter(Boolean).join(", ")+"; "+(kmax<0.7?"all Pareto k̂ < 0.7.":"some Pareto k̂ exceeded 0.7; the contributions of those observations should be confirmed by exact refitting (for example with loo's reloo option).");}
$("lRun").addEventListener("click",runL);$("lP").addEventListener("input",drawL);drawL();

buildQuiz("quizzes",[
 {t:"stat",q:"A posterior 95% credible interval for a heat effect is 0.05% to 0.25% per °C. The ROPE is ±0.3%. The decision is:",o:[["The effect is meaningful","The interval lies inside the ROPE, not outside it.",0],["The effect is practically equivalent to zero","The whole interval lies within the region of negligible effects.",1],["Undecided","That's for intervals overlapping the ROPE boundary.",0],["The effect is absent","It may be real but too small to matter; 'negligible' isn't 'absent'.",0]]},
 {t:"stat",q:"A Bayes factor BF₁₀ = 8 means:",o:[["H₁ is 8 times more likely to be true","That's posterior odds, which also need prior odds.",0],["The data are 8 times more probable under H₁ than under H₀","Multiplied by prior odds, it gives posterior odds.",1],["p = 1/8","Bayes factors aren't p-values.",0],["The effect is 8 times larger than zero","It isn't an effect size.",0]]},
 {t:"stat",q:"An analyst widens the prior under H₁ from Normal(0, 0.05²) to Normal(0, 10²) on a log rate ratio. The Bayes factor for H₁:",o:[["Stays the same, since the data are unchanged","The Bayes factor depends on the prior under H₁.",0],["Moves toward H₀, because the wide prior predicts the data poorly","Lindley's paradox: absurdly wide priors make H₁ a poor predictor.",1],["Moves toward H₁","Widening the prior penalizes H₁.",0],["Becomes undefined","It remains defined.",0]]},
 {t:"epi",q:"Why test \"the effect increases with age\" instead of three separate \"effect = 0\" hypotheses?",o:[["Because it always gives smaller p-values","Bayes factors aren't p-values, and the gain isn't about significance.",0],["Because it directly tests the scientific claim, and order constraints don't depend on point-null priors","Substantive hypotheses are more informative than sequences of null tests.",1],["Because the separate tests are invalid","They are valid, but answer a different question.",0],["Because order hypotheses can't be wrong","They can, and the data may contradict them.",0]]},
 {t:"stat",q:"Two models differ in ELPD by 3.1 with a standard error of 4.0. The best conclusion is:",o:[["The first model is clearly better","The difference is within its uncertainty.",0],["The models predict about equally well; the data don't clearly favor either","A difference smaller than about 2 SE is not decisive.",1],["The second model is better","The sign favors the first, but weakly.",0],["LOO has failed","Nothing indicates failure; check Pareto k for that.",0]]},
 {t:"stat",q:"Adding a variable with a very vague prior leaves LOO almost unchanged but lowers the Bayes factor sharply. Why?",o:[["LOO is broken","Both work as designed.",0],["LOO uses the posterior, which the data dominate; the Bayes factor uses the prior's predictions, which a vague prior makes poor","They answer different questions.",1],["Bayes factors ignore the data","They depend on data through the marginal likelihood.",0],["The variable must be a confounder","Unrelated.",0]]}]);
onTheme(()=>{drawR();drawB();drawH();drawL();});
});
