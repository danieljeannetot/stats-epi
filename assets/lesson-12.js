document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const GB=genB(),kids=GB.children,sch=GB.schools,y=kids.map(c=>c.asthma),n=kids.length;
const T=TRUTH_B,ex=v=>1/(1+Math.exp(-v));
/* the true model that generated the data: each child's risk at any NO2 level x */
const lp0=kids.map(c=>T.int+T.ses*c.ses+T.smoke*c.parent_smoke+T.green*(c.green-0.5)+T.boy*(c.sex==="boy"?1:0)+sch[c.school-1].re);
const trueRisk=(i,x)=>ex(lp0[i]+Math.log(T.orPer10)*(x-25)/10);
const rU=makeRng(1212),U=kids.map(()=>rU());
function truth(D){let a=0,b=0;for(let i=0;i<n;i++){a+=trueRisk(i,kids[i].no2_true);b+=trueRisk(i,kids[i].no2_true-D);}return {r1:a/n,r0:b/n};}

/* ---------- 12.1 ---------- */
function drawPO(){const D=+$("poD").value;$("poDO").textContent=D;const t=truth(D);
  const svg=clear($("poGrid")),cols=25,sz=19;let both=0,prev=0;
  for(let i=0;i<400;i++){const y1=U[i]<trueRisk(i,kids[i].no2_true),y0=U[i]<trueRisk(i,kids[i].no2_true-D);if(y1&&y0)both++;if(y1&&!y0)prev++;
    const x=10+(i%cols)*sz*1.07,yy=8+Math.floor(i/cols)*sz*0.93;el("rect",{x:x,y:yy,width:sz-4,height:sz*0.93-4,rx:3,fill:y1&&!y0?css("--p4"):y1?css("--p2"):css("--c-rule")},svg);}
  const obsHi=kids.filter(c=>c.no2_true>=30),obsLo=kids.filter(c=>c.no2_true<30),assoc=mean(obsHi.map(c=>c.asthma))/mean(obsLo.map(c=>c.asthma));
  $("poStats").innerHTML=[["risk, NO₂ as observed",fmt(100*t.r1,2)+"%"],["risk, NO₂ lowered by "+D,fmt(100*t.r0,2)+"%"],["causal risk ratio",fmt(t.r0/t.r1,3)],["cases prevented per 1,000",fmt(1000*(t.r1-t.r0),1)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("poNow","Each square is a child among the first 400. In the observed world, "+(both+prev)+" of them develop asthma. If every child's NO₂ were "+D+" µg/m³ lower, <b>"+prev+"</b> of those cases (green) would not have occurred; the other "+both+" (orange) would occur anyway. Across all 5,000 children, the intervention would lower the risk from "+fmt(100*t.r1,2)+"% to "+fmt(100*t.r0,2)+"%: a <b>causal risk ratio of "+fmt(t.r0/t.r1,3)+"</b>, about "+fmt(1000*(t.r1-t.r0),1)+" cases prevented per 1,000 children.<br><br>No real study sees both worlds: for each child, only the observed one exists. The crude comparison of children above and below 30 µg/m³ gives a risk ratio of "+fmt(assoc,2)+", which mixes the causal effect with confounding. The rest of this lesson tries to recover the true answer from observed data.");
  $("poReport").innerHTML="Reducing every child's residential NO₂ by "+D+" µg/m³ would lower the risk of asthma by age 8 from "+fmt(100*t.r1,1)+"% to "+fmt(100*t.r0,1)+"% (<b>causal risk ratio "+fmt(t.r0/t.r1,2)+"; "+fmt(1000*(t.r1-t.r0),1)+" cases prevented per 1,000 children</b>). These are the true values, known only because the data are simulated.";}
$("poD").addEventListener("input",drawPO);drawPO();

/* ---------- 12.2 ---------- */
const COVS={none:[],ses:["ses"],min:["ses","green"],all:["ses","green","parent_smoke","boy"]};
const val=(c,k)=>k==="boy"?(c.sex==="boy"?1:0):c[k];
function gcomp(D,set){const ks=COVS[set],X=kids.map(c=>[1,c.no2_true/10].concat(ks.map(k=>val(c,k)))),f=glmFit(X,y,"binomial");
  let a=0,b=0;kids.forEach((c,i)=>{const base=f.beta[0]+ks.reduce((s,k,j)=>s+f.beta[2+j]*val(c,k),0);a+=ex(base+f.beta[1]*c.no2_true/10);b+=ex(base+f.beta[1]*(c.no2_true-D)/10);});
  return {r1:a/n,r0:b/n,or:Math.exp(f.beta[1]),f:f};}
function drawGC(){const D=+$("gcD").value,set=$("gcM").value;$("gcDO").textContent=D;const g=gcomp(D,set),t=truth(D);
  const margOR=(g.r0/(1-g.r0))/(g.r1/(1-g.r1)),condOR=Math.pow(g.or,-D/10);
  const svg=clear($("gcPlot")),F=frame(svg,520,230,{l:150,r:20,t:16,b:40},[0.1,0.16],[0,5]);xAxis(F,[0.1,0.11,0.12,0.13,0.14,0.15,0.16],"risk of asthma by age 8",v=>fmt(100*v,0)+"%");
  [["true, as observed",t.r1,"--c-ink",4],["true, NO₂ − "+D,t.r0,"--p4",3],["estimated, as observed",g.r1,"--c-lik",2],["estimated, NO₂ − "+D,g.r0,"--p2",1]].forEach(r=>{const yy=F.Y(r[3]);txt(svg,F.m.l-8,yy+4,r[0],{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("circle",{cx:F.X(Math.max(0.1,Math.min(0.16,r[1]))),cy:yy,r:7,fill:css(r[2])},svg);el("line",{x1:F.X(0.1),x2:F.X(Math.max(0.1,Math.min(0.16,r[1]))),y1:yy,y2:yy,stroke:css(r[2]),"stroke-opacity":0.3,"stroke-width":2},svg);});
  $("gcStats").innerHTML=[["estimated causal RR",fmt(g.r0/g.r1,3)],["true causal RR",fmt(t.r0/t.r1,3)],["cases prevented per 1,000 (est. / true)",fmt(1000*(g.r1-g.r0),1)+" / "+fmt(1000*(t.r1-t.r0),1)],["conditional OR for −"+D+" µg/m³",fmt(condOR,3)],["marginal OR (g-computation)",fmt(margOR,3)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const err=Math.abs(g.r0/g.r1-t.r0/t.r1);
  setNow("gcNow","With an outcome model adjusting for <b>"+({none:"nothing",ses:"SES only",min:"SES and green space",all:"SES, green space, smoking and sex"}[set])+"</b>, g-computation estimates that lowering NO₂ by "+D+" µg/m³ would change the risk from "+fmt(100*g.r1,2)+"% to "+fmt(100*g.r0,2)+"%: a risk ratio of <b>"+fmt(g.r0/g.r1,3)+"</b>, against the true "+fmt(t.r0/t.r1,3)+". "+(set==="none"?"Without adjustment, confounding by SES and green space exaggerates the benefit.":set==="ses"?"Adjusting for SES alone leaves the green-space path open.":err<0.01?"The estimate is close to the truth: the model includes a sufficient adjustment set.":"")+(set==="all"?" Adding smoking and sex, which aren't confounders here, changes little.":"")+" Note the three different numbers: the conditional OR from the model ("+fmt(condOR,3)+"), the marginal OR ("+fmt(margOR,3)+") and the marginal RR ("+fmt(g.r0/g.r1,3)+"). They answer different questions; the policy question asks for the last.");
  $("gcReport").innerHTML="Using g-computation with a logistic model adjusted for "+({none:"no covariates",ses:"SES",min:"SES and green space",all:"SES, green space, parental smoking and sex"}[set])+", a "+D+" µg/m³ reduction in NO₂ was estimated to reduce the risk of asthma by age 8 by <b>"+fmt(1000*(g.r1-g.r0),1)+" cases per 1,000 children (causal risk ratio "+fmt(g.r0/g.r1,2)+")</b>; confidence intervals by bootstrap.";}
["gcD"].forEach(id=>$(id).addEventListener("input",drawGC));$("gcM").addEventListener("change",drawGC);drawGC();

/* ---------- 12.3 ---------- */
const A=kids.map(c=>c.no2_true>=30?1:0);
function smd(get,w){let s1=0,s0=0,w1=0,w0=0;const v1=[],v0=[];kids.forEach((c,i)=>{const x=get(c);if(A[i]){s1+=w[i]*x;w1+=w[i];v1.push(x);}else{s0+=w[i]*x;w0+=w[i];v0.push(x);}});return (s1/w1-s0/w0)/Math.sqrt((sd(v1)**2+sd(v0)**2)/2);}
function drawPS(){const tr=+$("psTr").value;$("psTrO").textContent=tr===0?"no trimming":fmt(tr,2)+"–"+fmt(1-tr,2);
  const use=[["psS",c=>c.ses],["psG",c=>c.green],["psT",c=>DISTRICTS[c.district_id-1].traffic]].filter(u=>$(u[0]).checked).map(u=>u[1]);
  const f=glmFit(kids.map(c=>[1].concat(use.map(g=>g(c)))),A,"binomial"),ps=f.mu;
  const keep=ps.map(p=>p>=tr&&p<=1-tr),w=ps.map((p,i)=>keep[i]?(A[i]?1/p:1/(1-p)):0);
  let a1=0,w1=0,a0=0,w0=0;kids.forEach((c,i)=>{if(!keep[i])return;if(A[i]){a1+=w[i]*y[i];w1+=w[i];}else{a0+=w[i]*y[i];w0+=w[i];}});const rrIPW=(a1/w1)/(a0/w0);
  const crude=mean(kids.filter((c,i)=>A[i]).map(c=>c.asthma))/mean(kids.filter((c,i)=>!A[i]).map(c=>c.asthma));
  const go=glmFit(kids.map((c,i)=>[1,A[i],c.ses,c.green]),y,"binomial");let g1=0,g0=0;kids.forEach((c,i)=>{const b=go.beta[0]+go.beta[2]*c.ses+go.beta[3]*c.green;g1+=ex(b+go.beta[1]);g0+=ex(b);});const rrG=g1/g0;
  const svg=clear($("psPlot")),nb=40,h1=new Array(nb).fill(0),h0=new Array(nb).fill(0);ps.forEach((p,i)=>{const k=Math.min(nb-1,Math.floor(p*nb));if(A[i])h1[k]++;else h0[k]++;});
  const hm=Math.max(Math.max.apply(null,h1),Math.max.apply(null,h0))*1.1,F=frame(svg,520,240,{l:44,r:12,t:16,b:40},[0,1],[-hm,hm]);
  xAxis(F,[0,0.2,0.4,0.6,0.8,1],"propensity score: P(high NO₂ | covariates)",v=>fmt(v,1));txt(svg,F.m.l,10,"high NO₂ above the line, lower NO₂ below",{});
  h1.forEach((k,i)=>el("rect",{x:F.X(i/nb)+0.5,y:F.Y(k),width:F.X(1/nb)-F.X(0)-1,height:F.Y(0)-F.Y(k),fill:css("--p2"),"fill-opacity":0.7},svg));
  h0.forEach((k,i)=>el("rect",{x:F.X(i/nb)+0.5,y:F.Y(0),width:F.X(1/nb)-F.X(0)-1,height:F.Y(-k)-F.Y(0),fill:css("--p1"),"fill-opacity":0.7},svg));
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--c-ink")},svg);
  if(tr>0){[tr,1-tr].forEach(v=>el("line",{x1:F.X(v),x2:F.X(v),y1:F.m.t,y2:F.Y(-hm),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg));}
  const one=kids.map(()=>1),vars=[["SES",c=>c.ses],["green space",c=>c.green],["parent smokes",c=>c.parent_smoke],["district traffic",c=>DISTRICTS[c.district_id-1].traffic]];
  $("psBal").innerHTML="<tr><th>Standardized mean difference</th><th class='n'>before weighting</th><th class='n'>after weighting</th></tr>"+vars.map(v=>{const b=smd(v[1],one),a=smd(v[1],w);return "<tr><td>"+v[0]+"</td><td class='n'>"+fmt(b,2)+"</td><td class='n' style='color:"+(Math.abs(a)<0.1?"var(--c-ok)":"var(--c-bad)")+"'>"+fmt(a,2)+"</td></tr>";}).join("");
  const wk=w.filter((v,i)=>keep[i]),maxw=Math.max.apply(null,wk),nk=keep.filter(Boolean).length;
  $("psStats").innerHTML=[["crude RR (high vs lower)",fmt(crude,3)],["IPW RR",fmt(rrIPW,3)],["g-computation RR",fmt(rrG,3)],["largest weight",fmt(maxw,1)],["children kept",fmtInt(nk)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const tIn=$("psT").checked;
  setNow("psNow","The propensity scores of high- and lower-NO₂ children "+(tIn?"barely overlap":Math.abs(smd(c=>c.green,w))>0.1?"overlap only partly: many high-NO₂ children have scores near 1":"overlap well")+". "+(tIn?"Including district traffic, which strongly determines exposure but is not a confounder, pushes scores toward 0 and 1: some children get weights up to <b>"+fmt(maxw,0)+"</b>, so a handful dominate the estimate. This is a <b>positivity</b> problem created by the analyst. ":(Math.abs(smd(c=>c.green,w))>0.1?"Weighting balances SES, but green space stays imbalanced (standardized difference "+fmt(smd(c=>c.green,w),2)+", in red): almost all high-NO₂ children live in low-green areas, so there are few comparable children to weight up. This is a <b>positivity</b> problem in the data themselves, and the reason IPW and g-computation, which bridge the gap with different models, disagree. ":"After weighting, the confounders are balanced (standardized differences below 0.1, in green). "))+"The weighted risk ratio for high vs lower NO₂ is <b>"+fmt(rrIPW,3)+"</b>, against "+fmt(crude,3)+" crude and "+fmt(rrG,3)+" by g-computation with the same confounders. The two causal methods use different models, one for exposure and one for outcome, yet target the same quantity."+(tr>0?" Trimming dropped "+fmtInt(n-nk)+" children with extreme scores: this improves stability but changes the population the estimate refers to.":""));
  $("psReport").innerHTML="Using inverse probability weights from a propensity model including "+(use.length?["SES","green space","district traffic"].filter((_,k)=>$(["psS","psG","psT"][k]).checked).join(", "):"no covariates")+", the <b>risk ratio for NO₂ ≥ 30 vs &lt; 30 µg/m³ was "+fmt(rrIPW,2)+"</b>; covariate balance after weighting is shown in Supplementary Table S2 (maximum weight "+fmt(maxw,1)+").";}
["psS","psG","psT"].forEach(id=>$(id).addEventListener("change",drawPS));$("psTr").addEventListener("input",drawPS);drawPS();

/* ---------- 12.4 ---------- */
const eval_=rr=>rr<=1?1:rr+Math.sqrt(rr*(rr-1));
function rrFrom(ks){/* modified Poisson regression with robust (sandwich) standard errors gives the RR and its CI */
  const X=kids.map(c=>[1,c.no2_true>=30?1:0].concat(ks.map(k=>c[k]))),f=glmFit(X,y,"poisson"),p=X[0].length,B=[];for(let a=0;a<p;a++)B.push(new Array(p).fill(0));
  X.forEach((x,i)=>{const r=y[i]-f.mu[i];for(let a=0;a<p;a++)for(let b=0;b<p;b++)B[a][b]+=x[a]*x[b]*r*r;});
  const V=f.vcov,S=V.map(r=>B[0].map((_,b)=>r.reduce((s,v,k)=>s+v*B[k][b],0))),R=S.map(r=>V[0].map((_,b)=>r.reduce((s,v,k)=>s+v*V[k][b],0))),se=Math.sqrt(R[1][1]);
  return {rr:Math.exp(f.beta[1]),lo:Math.exp(f.beta[1]-1.96*se)};}
function drawEV(){let rr=+$("evR").value,lo=+$("evL").value;if(lo>rr){lo=rr;$("evL").value=rr;}$("evRO").textContent=fmt(rr,2);$("evLO").textContent=fmt(lo,2);
  const e=eval_(rr),el_=eval_(lo),svg=clear($("evPlot")),mx=Math.max(4,Math.ceil(e*1.6)),F=frame(svg,520,280,{l:44,r:12,t:16,b:40},[1,mx],[1,mx]);
  yGrid(F,niceTicks(1,mx,5),v=>fmt(v,1));xAxis(F,niceTicks(1,mx,5),"confounder–exposure risk ratio, RR_EU",v=>fmt(v,1));txt(svg,F.m.l,10,"confounder–outcome risk ratio, RR_UD",{});
  const curve=target=>{const xs=[],ys=[];for(let a=1.001;a<=mx;a+=0.01){const b=target*(a-1)/(a-target);if(a>target&&b>=1&&b<=mx){xs.push(a);ys.push(b);}}return [xs,ys];};
  const c1=curve(rr);if(c1[0].length)el("polygon",{points:c1[0].map((x,i)=>F.X(x)+","+F.Y(c1[1][i])).concat([F.X(mx)+","+F.Y(mx),F.X(c1[0][0])+","+F.Y(mx)]).join(" "),fill:css("--p2"),"fill-opacity":0.12},svg);
  poly(F,c1[0],c1[1],{stroke:css("--p2"),"stroke-width":2.4});const c2=curve(lo);if(lo>1)poly(F,c2[0],c2[1],{stroke:css("--p1"),"stroke-width":1.8,"stroke-dasharray":"5 4"});
  if(e<=mx)el("circle",{cx:F.X(e),cy:F.Y(e),r:6,fill:css("--p2")},svg);
  $("evStats").innerHTML=[["E-value, estimate",fmt(e,2)],["E-value, lower limit",lo<=1?"1 (CI includes 1)":fmt(el_,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("evNow","An unmeasured confounder associated with both high NO₂ and asthma by a risk ratio of at least <b>"+fmt(e,2)+"</b> each could fully explain away an observed risk ratio of "+fmt(rr,2)+"; weaker confounding could not. Any combination in the shaded region (above the orange curve) would also do it, for example a stronger link with the outcome and a weaker one with the exposure. "+(lo>1?"To move the lower confidence limit ("+fmt(lo,2)+") to 1 needs only "+fmt(el_,2)+" (dashed curve).":"The confidence interval already includes 1.")+" Judge these numbers against what is plausible: here, socio-economic position was associated with both exposure and outcome by risk ratios of roughly 1.3 to 1.5, so an unmeasured confounder as strong as that would matter a great deal for an estimate this close to 1.");
  $("evReport").innerHTML="The observed risk ratio of "+fmt(rr,2)+" could be explained away by an unmeasured confounder associated with both exposure and outcome by a risk ratio of <b>"+fmt(e,2)+"</b> each, above and beyond the measured confounders; weaker confounding could not. The corresponding E-value for the lower confidence limit was "+(lo<=1?"1":fmt(el_,2))+".";}
["evR","evL"].forEach(id=>$(id).addEventListener("input",drawEV));
$("evFull").addEventListener("click",()=>{const r=rrFrom(["ses","green"]);$("evR").value=fmt(r.rr,2);$("evL").value=fmt(Math.max(0.8,r.lo),2);drawEV();});
$("evNoG").addEventListener("click",()=>{const r=rrFrom(["ses"]);$("evR").value=fmt(r.rr,2);$("evL").value=fmt(Math.max(0.8,r.lo),2);drawEV();});
$("evFull").click();

buildQuiz("quizzes",[
 {t:"epi",q:"Why can't a causal effect be computed directly for an individual child?",o:[["Because children are too variable","Variability isn't the obstacle.",0],["Because only one potential outcome, under the exposure the child actually had, is ever observed","The other is counterfactual. Average effects are identified under assumptions.",1],["Because asthma is rare","Rarity affects precision, not identifiability.",0],["Because it requires randomization","Randomization identifies average effects, not individual ones.",0]]},
 {t:"epi",q:"Which assumption is violated if some children could never plausibly have lower NO₂ exposure under the intervention considered?",o:[["Consistency","Consistency concerns whether the exposure is well defined.",0],["Exchangeability","Exchangeability concerns confounding.",0],["Positivity","Every type of child must have some chance of each exposure level.",1],["No interference","That's about one person's exposure affecting another's outcome.",0]]},
 {t:"stat",q:"A logistic model gives aOR = 1.15 per 10 µg/m³. G-computation from the same model gives a marginal RR of 0.89 for a 10 µg/m³ reduction. Why aren't these simply reciprocals?",o:[["One of them must be wrong","Both are correct answers to different questions.",0],["The aOR is conditional and on the odds scale; the marginal RR averages risks over the population","Non-collapsibility and the risk vs odds scale both separate them.",1],["G-computation ignores confounders","It uses the same confounder-adjusted model.",0],["Because the outcome is rare, they must be equal","Even for rare outcomes, conditional ORs and marginal RRs differ somewhat.",0]]},
 {t:"stat",q:"After inverse probability weighting, a standardized mean difference of 0.35 remains for SES. This suggests:",o:[["The weights worked well","An SMD above about 0.1 indicates imbalance.",0],["The propensity model is misspecified or positivity is poor; revise it before trusting the estimate","Balance diagnostics check the propensity model.",1],["SES isn't a confounder","Balance concerns the weighting, not whether the variable is a confounder.",0],["The outcome model must be changed","IPW doesn't use an outcome model.",0]]},
 {t:"epi",q:"Adding district traffic, a strong predictor of NO₂ that doesn't affect asthma otherwise, to the propensity model:",o:[["Reduces bias","Traffic isn't a confounder, so it can't reduce confounding.",0],["Creates extreme weights and worse positivity, increasing variance","Instrument-like variables push propensity scores toward 0 and 1.",1],["Makes the weights equal","It makes them more extreme.",0],["Is required by the target trial framework","The framework calls for confounders, not instruments.",0]]},
 {t:"epi",q:"An estimate has RR 1.12 with an E-value of 1.49. This means:",o:[["Confounding of any strength can't explain the result","The E-value is the threshold, not a guarantee.",0],["An unmeasured confounder would need associations of about 1.49 with both exposure and outcome to explain away the RR","And weaker confounding could not, under the E-value's assumptions.",1],["The true RR is 1.49","The E-value is about confounder strength.",0],["The study has 49% bias","It isn't a percentage of bias.",0]]}]);
onTheme(()=>{drawPO();drawGC();drawPS();drawEV();});
});
