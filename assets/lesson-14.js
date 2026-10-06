document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const GB=genB(),kids=GB.children,sch=GB.schools,y=kids.map(c=>c.asthma),n=kids.length,ex=v=>1/(1+Math.exp(-v)),T=TRUTH_B;
const lp0=kids.map(c=>T.int+T.ses*c.ses+T.smoke*c.parent_smoke+T.green*(c.green-0.5)+T.boy*(c.sex==="boy"?1:0)+sch[c.school-1].re);
const trueRisk=(i,x)=>ex(lp0[i]+Math.log(T.orPer10)*(x-25)/10);
const births=Math.round(sum(DISTRICTS.map(d=>agePop(d,0)))/15);
function robustRR(X){const f=glmFit(X,y,"poisson"),p=X[0].length,B=[];for(let a=0;a<p;a++)B.push(new Array(p).fill(0));X.forEach((x,i)=>{const r=y[i]-f.mu[i];for(let a=0;a<p;a++)for(let b=0;b<p;b++)B[a][b]+=x[a]*x[b]*r*r;});
  const V=f.vcov,S=V.map(r=>B[0].map((_,b)=>r.reduce((s,v,k)=>s+v*B[k][b],0))),R=S.map(r=>V[0].map((_,b)=>r.reduce((s,v,k)=>s+v*V[k][b],0)));return {rr:Math.exp(f.beta[1]),se:Math.sqrt(R[1][1])};}

/* ---------- 14.1 ---------- */
const levin=(p,r)=>p*(r-1)/(1+p*(r-1));
let cohortMode=null;
function drawLV(){const p=+$("lvP").value/100,r=+$("lvR").value;$("lvPO").textContent=Math.round(100*p)+"%";$("lvRO").textContent=fmt(r,2);
  const svg=clear($("lvPlot")),F=frame(svg,520,240,{l:44,r:12,t:16,b:40},[0,1],[0,0.6]);yGrid(F,[0,0.2,0.4,0.6],v=>Math.round(100*v)+"%");xAxis(F,[0,0.2,0.4,0.6,0.8,1],"proportion of the population exposed",v=>Math.round(100*v)+"%");txt(svg,F.m.l,10,"population attributable fraction (Levin)",{});
  [1.2,1.5,2,3].forEach((rr,k)=>{const xs=[];for(let q=0;q<=1.0001;q+=0.01)xs.push(q);poly(F,xs,xs.map(q=>levin(q,rr)),{stroke:css(["--p4","--p1","--p3","--p2"][k]),"stroke-width":1.6,"stroke-opacity":0.7});txt(svg,F.X(0.98),F.Y(Math.min(0.6,levin(0.98,rr)))-4,"RR "+rr,{"text-anchor":"end",style:"fill:"+css(["--p4","--p1","--p3","--p2"][k])});});
  el("circle",{cx:F.X(p),cy:F.Y(Math.min(0.6,levin(p,r))),r:7,fill:css("--c-ink")},svg);
  const st=[["PAF (Levin)",fmt(100*levin(p,r),1)+"%"],["attributable fraction among exposed",fmt(100*(r-1)/r,1)+"%"]];
  if(cohortMode)st.push(["Levin with crude RR",fmt(100*cohortMode.lc,1)+"%"],["Levin with adjusted RR",fmt(100*cohortMode.la,1)+"%"],["Miettinen with adjusted RR",fmt(100*cohortMode.mi,1)+"%"],["true PAF (simulation)",fmt(100*cohortMode.tr,1)+"%"]);
  $("lvStats").innerHTML=st.map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg="If "+Math.round(100*p)+"% of the population is exposed and exposure raises risk "+fmt(r,2)+"-fold, <b>"+fmt(100*levin(p,r),1)+"%</b> of all cases are attributable to the exposure. A weak risk factor that is very common can cause more cases than a strong but rare one: compare RR 1.2 at 90% exposed with RR 3 at 5%.";
  if(cohortMode)msg+="<br><br><b>In the cohort</b>, "+Math.round(100*cohortMode.pe)+"% of children have true NO₂ ≥ 30 µg/m³, and "+Math.round(100*cohortMode.pc)+"% of cases do. With the crude RR ("+fmt(cohortMode.rc,2)+"), Levin's formula gives "+fmt(100*cohortMode.lc,1)+"%, inflated by confounding. With an RR adjusted for SES and green space by inverse probability weighting ("+fmt(cohortMode.ra,2)+"), Levin gives "+fmt(100*cohortMode.la,1)+"% and Miettinen "+fmt(100*cohortMode.mi,1)+"%. The true attributable fraction for removing high exposure (setting it to the average below 30 µg/m³) is "+fmt(100*cohortMode.tr,1)+"%. Under confounding, Miettinen's formula is the valid one; with mild confounding, as here after adjustment, the two are close.";
  setNow("lvNow",msg);
  $("lvReport").innerHTML=cohortMode?"An estimated <b>"+fmt(100*cohortMode.mi,1)+"% of childhood asthma cases</b> were attributable to residential NO₂ of 30 µg/m³ or more (Miettinen's formula; IPW-adjusted RR "+fmt(cohortMode.ra,2)+"; "+Math.round(100*cohortMode.pc)+"% of cases exposed).":"With "+Math.round(100*p)+"% exposed and a risk ratio of "+fmt(r,2)+", the <b>population attributable fraction is "+fmt(100*levin(p,r),1)+"%</b> (Levin's formula, assuming an unconfounded risk ratio).";}
["lvP","lvR"].forEach(id=>$(id).addEventListener("input",()=>{cohortMode=null;drawLV();}));
$("lvCoh").addEventListener("click",()=>{const A=kids.map(c=>c.no2_true>=30?1:0),pe=mean(A),pc=mean(kids.filter((c,i)=>y[i]).map(c=>c.no2_true>=30?1:0));
  const rc=mean(kids.filter((c,i)=>A[i]).map(c=>c.asthma))/mean(kids.filter((c,i)=>!A[i]).map(c=>c.asthma));
  /* adjusted RR by inverse probability weighting on SES and green space (Lesson 12) */
  const ps=glmFit(kids.map(c=>[1,c.ses,c.green]),A,"binomial").mu;let a1=0,w1=0,a0=0,w0=0;kids.forEach((c,i)=>{const w=A[i]?1/ps[i]:1/(1-ps[i]);if(A[i]){a1+=w*y[i];w1+=w;}else{a0+=w*y[i];w0+=w;}});const ra=(a1/w1)/(a0/w0);
  const lowMean=mean(kids.filter(c=>c.no2_true<30).map(c=>c.no2_true));let a=0,b=0;kids.forEach((c,i)=>{a+=trueRisk(i,c.no2_true);b+=trueRisk(i,c.no2_true>=30?lowMean:c.no2_true);});
  cohortMode={pe:pe,pc:pc,rc:rc,ra:ra,lc:levin(pe,rc),la:levin(pe,ra),mi:pc*(ra-1)/ra,tr:1-b/a};$("lvP").value=Math.round(100*pe);$("lvR").value=fmt(ra,2);drawLV();});
drawLV();

/* ---------- 14.2 ---------- */
const VAL=kids.filter(c=>c.validation===1),cal=lmFit(VAL.map(c=>[1,c.no2_modeled,c.ses,c.green]),VAL.map(c=>c.no2_personal)),xcal=kids.map(c=>cal.beta[0]+cal.beta[1]*c.no2_modeled+cal.beta[2]*c.ses+cal.beta[3]*c.green);
const fits={};function srcFit(k){if(!fits[k]){const xs=k==="true"?kids.map(c=>c.no2_true):k==="naive"?kids.map(c=>c.no2_modeled):xcal;const f=glmFit(kids.map((c,i)=>[1,xs[i]/10,c.ses,c.green]),y,"binomial");fits[k]={xs:xs,f:f,b:k==="true"?Math.log(T.orPer10)/10:f.beta[1]/10};}return fits[k];}
function pafFor(k,xstar,bOverride,idx){const S=srcFit(k),f=S.f;let a=0,c=0;const I=idx||kids.map((_,i)=>i);
  if(k==="true"){const b=bOverride===undefined?Math.log(T.orPer10)/10:bOverride;I.forEach(i=>{const x=kids[i].no2_true;a+=ex(lp0[i]+b*(x-25));c+=ex(lp0[i]+b*(Math.min(x,xstar)-25));});}
  else{const b=bOverride===undefined?S.b:bOverride;I.forEach(i=>{const base=f.beta[0]+f.beta[2]*kids[i].ses+f.beta[3]*kids[i].green,x=S.xs[i];a+=ex(base+b*x);c+=ex(base+b*Math.min(x,xstar));});}
  return {paf:1-c/a,r:a/I.length};}
let lastCases=null;
function drawCF(){const xs=+$("cfX").value,k=$("cfB").value;$("cfXO").textContent=xs+" µg/m³";const X=kids.map(c=>c.no2_true),res=pafFor(k,xs),S=srcFit(k);
  const svg=clear($("cfPlot")),nb=50,lo=0,hi=70,w=(hi-lo)/nb,c=new Array(nb).fill(0);X.forEach(v=>{const i=Math.floor((v-lo)/w);if(i>=0&&i<nb)c[i]++;});const cm=Math.max.apply(null,c)*1.1;
  const F=frame(svg,520,260,{l:44,r:12,t:16,b:40},[lo,hi],[0,cm]);yGrid(F,niceTicks(0,cm,4));xAxis(F,[0,10,20,30,40,50,60,70],"true residential NO₂ (µg/m³)");txt(svg,F.m.l,10,"number of children; orange = exposure above the counterfactual",{});
  c.forEach((v,i)=>{const x0=lo+i*w,above=x0+w/2>xs;el("rect",{x:F.X(x0)+0.5,y:F.Y(v),width:F.X(w)-F.X(0)-1,height:F.Y(0)-F.Y(v),fill:above?css("--p2"):css("--c-lik"),"fill-opacity":above?0.75:0.5},svg);});
  [[10,"WHO 2021"],[40,"former guideline"]].forEach(g=>{el("line",{x1:F.X(g[0]),x2:F.X(g[0]),y1:F.m.t,y2:F.Y(0),stroke:css("--p4"),"stroke-dasharray":"3 3"},svg);txt(svg,F.X(g[0])+3,F.m.t+12,g[1],{style:"fill:"+css("--p4")});});
  el("line",{x1:F.X(xs),x2:F.X(xs),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-width":2},svg);
  const per10k=10000*res.r*res.paf,perYear=births*res.r*res.paf,above=mean(X.map(v=>v>xs?1:0));lastCases=perYear;
  $("cfStats").innerHTML=[["children above the counterfactual",fmt(100*above,0)+"%"],["PAF",fmt(100*res.paf,1)+"%"],["attributable cases per 10,000 children",fmt(per10k,0)],["per annual birth cohort (≈ "+fmtInt(births)+")",fmt(perYear,0)],["OR per 10 µg/m³ used",fmt(Math.exp(10*S.b),3)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const p0=pafFor(k,0).paf,p40=pafFor(k,40).paf;
  setNow("cfNow","Relative to a counterfactual of <b>"+xs+" µg/m³</b>, "+fmt(100*above,0)+"% of children have excess exposure, and <b>"+fmt(100*res.paf,1)+"%</b> of asthma cases by age 8 are attributable to it: about "+fmt(per10k,0)+" per 10,000 children, or "+fmt(perYear,0)+" for each year's birth cohort in the city. The same data give "+fmt(100*p0,1)+"% against zero NO₂ and "+fmt(100*p40,1)+"% against 40 µg/m³: the counterfactual changes the answer "+fmt(p0/Math.max(p40,1e-6),0)+"-fold. "+(k==="naive"?"Using the naive estimate from modeled NO₂, the burden is underestimated because measurement error attenuated the exposure–response coefficient (Lesson 13).":k==="rc"?"The regression-calibrated coefficient corrects most of that underestimation.":"These are the true values, using the model that generated the data."));
  $("cfReport").innerHTML="Relative to a counterfactual NO₂ level of "+xs+" µg/m³, an estimated <b>"+fmt(100*res.paf,1)+"% of childhood asthma cases (about "+fmt(perYear,0)+" new cases per birth cohort)</b> were attributable to residential NO₂"+(k==="naive"?", using an exposure–response function not corrected for measurement error":k==="rc"?", using a measurement-error-corrected exposure–response function":"")+".";}
$("cfX").addEventListener("input",drawCF);$("cfB").addEventListener("change",drawCF);drawCF();

/* ---------- 14.3 ---------- */
function drawDY(){const C=+$("dyC").value,L=+$("dyL").value,W=+$("dyW").value,D=+$("dyD").value,E=+$("dyE").value;
  $("dyCO").textContent=fmtInt(C);$("dyLO").textContent=L+" years";$("dyWO").textContent=fmt(W,3);$("dyDO").textContent=fmt(D,1);$("dyEO").textContent=E+" years";
  const yld=C*W*L,yll=D*E,tot=yld+yll,svg=clear($("dyPlot")),mx=Math.max(50,tot*1.15),F=frame(svg,520,150,{l:60,r:20,t:16,b:40},[0,mx],[0,2]);xAxis(F,niceTicks(0,mx,5),"DALYs per year",v=>fmtInt(v));
  el("rect",{x:F.X(0),y:F.Y(1.6),width:F.X(yld)-F.X(0),height:F.Y(0.4)-F.Y(1.6),fill:css("--p1"),"fill-opacity":0.75},svg);el("rect",{x:F.X(yld),y:F.Y(1.6),width:F.X(yld+yll)-F.X(yld),height:F.Y(0.4)-F.Y(1.6),fill:css("--p2"),"fill-opacity":0.75},svg);
  txt(svg,F.m.l-6,F.Y(1)+4,"DALYs",{"text-anchor":"end",style:"fill:"+css("--c-ink")});if(yld>mx*0.12)txt(svg,F.X(yld/2),F.Y(1)+4,"YLD",{"text-anchor":"middle",style:"fill:#fff;font-weight:600"});if(yll>mx*0.08)txt(svg,F.X(yld+yll/2),F.Y(1)+4,"YLL",{"text-anchor":"middle",style:"fill:#fff;font-weight:600"});
  $("dyStats").innerHTML=[["YLD",fmt(yld,0)],["YLL",fmt(yll,0)],["DALYs",fmt(tot,0)],["share from disability",fmt(100*yld/Math.max(tot,1e-9),0)+"%"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("dyNow",fmtInt(C)+" attributable cases, each lived with for about "+L+" years at a disability weight of "+fmt(W,3)+", give <b>"+fmt(yld,0)+" years lived with disability</b>. "+fmt(D,1)+" attributable deaths, each losing about "+E+" years, add "+fmt(yll,0)+" years of life lost. Total: <b>"+fmt(tot,0)+" DALYs per year</b>, "+fmt(100*yld/Math.max(tot,1e-9),0)+"% from disability. Childhood asthma is rarely fatal, so its burden is mostly YLD and hinges on the disability weight and duration, both uncertain and partly value judgments. The values here are illustrative, not official estimates.");
  $("dyReport").innerHTML="NO₂-attributable childhood asthma was estimated to cause <b>"+fmt(tot,0)+" DALYs per year</b> ("+fmt(yld,0)+" YLD and "+fmt(yll,0)+" YLL), assuming an average duration of "+L+" years and a disability weight of "+fmt(W,3)+".";}
["dyC","dyL","dyW","dyD","dyE"].forEach(id=>$(id).addEventListener("input",drawDY));
$("dyFrom").addEventListener("click",()=>{if(lastCases!==null){$("dyC").value=Math.round(lastCases/5)*5;drawDY();}});drawDY();

/* ---------- 14.4 ---------- */
let mcRes=null;
function runMC(){const k=$("cfB").value,xs=+$("cfX").value,S=srcFit(k),se=S.f.se[1]/10,r=makeRng(1414),N=4000;
  const sub=[];const rs=makeRng(7);for(let i=0;i<800;i++)sub.push(Math.floor(rs()*n));
  const base=pafFor(k,xs,S.b,sub),r0=base.r,seR=Math.sqrt(r0*(1-r0)/n),L0=+$("dyL").value,W0=+$("dyW").value,out=[];
  for(let s=0;s<N;s++){const b=$("mcRR").checked?S.b+se*gaussFrom(r):S.b;const pf=pafFor(k,xs,b,sub).paf;const rr=$("mcBase").checked?Math.max(0.001,r0+seR*gaussFrom(r)):r0;
    const L=$("mcDur").checked?5+10*r():L0,W=$("mcDur").checked?0.03+0.05*r():W0;out.push(births*rr*pf*L*W+(+$("dyD").value)*(+$("dyE").value));}
  out.sort((a,b)=>a-b);const pt=births*r0*base.paf*L0*W0+(+$("dyD").value)*(+$("dyE").value);
  const plug=[S.b-1.96*se,S.b+1.96*se].map(b=>births*r0*pafFor(k,xs,b,sub).paf*L0*W0+(+$("dyD").value)*(+$("dyE").value));
  mcRes={out:out,pt:pt,plug:plug,lo:quantile(out,0.025),hi:quantile(out,0.975),med:quantile(out,0.5),k:k,xs:xs};drawMC();}
function drawMC(){const svg=clear($("mcPlot"));if(!mcRes){txt(svg,20,20,"Press Run. The simulation uses the exposure–response source and counterfactual chosen in 14.2, and the duration and weight from 14.3.",{});$("mcStats").innerHTML="";setNow("mcNow","Each simulation draws the uncertain inputs, recomputes the attributable fraction for the city's children, and converts it to DALYs.");return;}
  const o=mcRes.out,lo=Math.max(0,quantile(o,0.002)),hi=quantile(o,0.998),nb=45,w=(hi-lo)/nb||1,c=new Array(nb).fill(0);o.forEach(v=>{const i=Math.floor((v-lo)/w);if(i>=0&&i<nb)c[i]++;});const cm=Math.max.apply(null,c)*1.1;
  const F=frame(svg,520,240,{l:44,r:12,t:16,b:40},[lo,hi],[0,cm]);xAxis(F,niceTicks(lo,hi,6),"DALYs per year",v=>fmtInt(v));txt(svg,F.m.l,10,"4,000 simulated burden estimates",{});
  c.forEach((v,i)=>el("rect",{x:F.X(lo+i*w)+0.5,y:F.Y(v),width:Math.max(0.5,F.X(lo+w)-F.X(lo)-1),height:F.Y(0)-F.Y(v),fill:css("--p4"),"fill-opacity":0.6},svg));
  el("rect",{x:F.X(mcRes.lo),y:F.Y(0)+3,width:F.X(mcRes.hi)-F.X(mcRes.lo),height:6,fill:css("--p4")},svg);
  $("mcStats").innerHTML=[["point estimate",fmtInt(mcRes.pt)],["median of simulations",fmtInt(mcRes.med)],["95% uncertainty interval",fmtInt(mcRes.lo)+" to "+fmtInt(mcRes.hi)],["plugging in the RR's CI limits",fmtInt(Math.min.apply(null,mcRes.plug))+" to "+fmtInt(Math.max.apply(null,mcRes.plug))]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const which=["mcRR","mcBase","mcDur"].filter(id=>$(id).checked).map(id=>({mcRR:"the exposure–response coefficient",mcBase:"the baseline risk",mcDur:"duration and disability weight"}[id]));
  setNow("mcNow","With uncertainty in "+(which.length?which.join(", "):"nothing (so every draw is the same)")+", the burden ranges from <b>"+fmtInt(mcRes.lo)+" to "+fmtInt(mcRes.hi)+" DALYs per year</b> (95% uncertainty interval). "+($("mcDur").checked?"Adding uncertainty in duration and disability weight widens the interval considerably: for childhood asthma, these inputs often matter as much as the epidemiological estimate. ":"")+"Plugging in the confidence limits of the coefficient gives "+fmtInt(Math.min.apply(null,mcRes.plug))+" to "+fmtInt(Math.max.apply(null,mcRes.plug))+", which accounts for that one source only and can't combine several. Simulation handles any number of uncertain inputs, and their combined effect."+(mcRes.lo<0?" The interval extends below zero because the exposure–response estimate itself is compatible with no effect, or even a protective one; the burden is then compatible with zero.":"")+(mcRes.k==="naive"?" The whole distribution is shifted down, because the naive coefficient is attenuated: no amount of uncertainty analysis fixes a biased input.":""));}
$("mcGo").addEventListener("click",runMC);["mcRR","mcBase","mcDur"].forEach(id=>$(id).addEventListener("change",()=>{mcRes=null;drawMC();}));drawMC();

buildQuiz("quizzes",[
 {t:"epi",q:"An exposure doubles risk (RR = 2) and 20% of the population is exposed. The PAF is about:",o:[["50%","That's the attributable fraction among the exposed.",0],["17%","0.2 × 1 / (1 + 0.2 × 1) ≈ 0.167.",1],["20%","That's the exposure prevalence.",0],["100%","Only if everyone's disease were caused by the exposure.",0]]},
 {t:"epi",q:"Levin's formula is applied with an adjusted risk ratio in the presence of confounding. The result:",o:[["Is always correct","Levin's formula with an adjusted RR is biased under confounding.",0],["Can be biased; use Miettinen's formula with the proportion of cases exposed, or g-computation","Miettinen's formula is valid with an adjusted RR.",1],["Is valid only for rare outcomes","The problem is confounding, not rarity.",0],["Overestimates the PAF by exactly the confounding ratio","There's no such simple rule.",0]]},
 {t:"epi",q:"Two reports give very different NO₂-attributable asthma burdens for the same city. The most likely explanation to check first is:",o:[["Different statistical software","Software rarely matters this much.",0],["Different counterfactual exposure levels","Zero, a guideline value, or the lowest observed level can change the burden several-fold.",1],["Different confidence levels","Intervals affect uncertainty, not the point estimate.",0],["Rounding","Unlikely to explain large differences.",0]]},
 {t:"stat",q:"Childhood asthma has a low disability weight but lasts many years and is rarely fatal. Its DALYs are dominated by:",o:[["YLL","With few deaths, years of life lost are small.",0],["YLD","Long duration multiplies even a small disability weight.",1],["Neither: DALYs are undefined without deaths","DALYs combine both components, either of which can be zero.",0],["Attributable fractions","The PAF determines attributable cases, not the YLL/YLD split.",0]]},
 {t:"stat",q:"Why is Monte Carlo simulation preferred to plugging the RR's confidence limits into the burden formula?",o:[["It always gives narrower intervals","It often gives wider ones, because it includes more sources of uncertainty.",0],["It combines uncertainty from several inputs at once, through any nonlinear formula","Plugging in limits handles one input at a time.",1],["It removes bias","Simulation propagates uncertainty; biased inputs stay biased.",0],["It doesn't need a relative risk","It still needs an exposure–response estimate.",0]]},
 {t:"epi",q:"PAFs for air pollution, smoking and obesity in the same population sum to 140%. This means:",o:[["The calculations must be wrong","Not necessarily.",0],["Many cases have more than one cause, so they are counted in several PAFs","Causes interact; removing any one prevents some of the same cases.",1],["The population is being double-counted","The population isn't, but cases can be attributable to several factors.",0],["Each PAF should be divided by 1.4","PAFs shouldn't be rescaled to sum to 100%.",0]]}]);
onTheme(()=>{drawLV();drawCF();drawDY();drawMC();});
});
