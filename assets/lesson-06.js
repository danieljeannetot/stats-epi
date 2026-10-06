document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const kids=genB().children,N=kids.length,TRUE=mean(kids.map(c=>c.asthma));
function erf(x){const t=1/(1+0.3275911*Math.abs(x)),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
const Phi=z=>0.5*(1+erf(z/Math.SQRT2));
function qnorm(p){let lo=-10,hi=10;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(Phi(m)<p)lo=m;else hi=m;}return (lo+hi)/2;}
const pc=(v,d)=>fmt(100*v,d===undefined?1:d)+"%";
let rng=makeRng(6060);
const sampleIdx=n=>{const a=new Array(n);for(let i=0;i<n;i++)a[i]=Math.floor(rng()*N);return a;};

/* ---------- 6.1 ---------- */
let studies=[];
function runCI(){const n=+$("ciN").value;studies=[];for(let s=0;s<100;s++){let d=0;sampleIdx(n).forEach(i=>d+=kids[i].asthma);studies.push(d/n);}drawCI();}
function drawCI(){const n=+$("ciN").value,lev=+$("ciL").value,z=qnorm(1-(1-lev)/2);$("ciNO").textContent=n;
  const svg=clear($("dance")),half=Math.max(0.06,4*Math.sqrt(TRUE*(1-TRUE)/n)),F=frame(svg,520,420,{l:20,r:14,t:16,b:40},[Math.max(0,TRUE-half),TRUE+half],[0,101]);
  xAxis(F,niceTicks(F.xr[0],F.xr[1],6),"risk of asthma",v=>fmt(100*v,0)+"%");txt(svg,F.m.l,10,"100 studies of "+n+" children; each line is one study's "+Math.round(100*lev)+"% CI",{});
  let miss=0;studies.forEach((p,i)=>{const se=Math.sqrt(p*(1-p)/n),lo=p-z*se,hi=p+z*se,ok=lo<=TRUE&&TRUE<=hi;if(!ok)miss++;const y=F.Y(100-i);
    el("line",{x1:F.X(Math.max(F.xr[0],lo)),x2:F.X(Math.min(F.xr[1],hi)),y1:y,y2:y,stroke:ok?css("--p1"):css("--p2"),"stroke-width":ok?1.6:2.6},svg);el("circle",{cx:F.X(p),cy:y,r:1.8,fill:ok?css("--p1"):css("--p2")},svg);});
  el("line",{x1:F.X(TRUE),x2:F.X(TRUE),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-width":1.6},svg);
  const avgw=mean(studies.map(p=>2*z*Math.sqrt(p*(1-p)/n)));
  $("ciStats").innerHTML=[["true risk",pc(TRUE)],["intervals that miss",miss+" of 100"],["coverage",(100-miss)+"%"],["average width",pc(avgw)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("ciNow","Each line is the "+Math.round(100*lev)+"% confidence interval from one simulated study of "+n+" children; the vertical line is the true risk in the whole cohort, "+pc(TRUE)+". <b>"+(100-miss)+" of 100</b> intervals contain it, close to the nominal "+Math.round(100*lev)+"%. Every interval was computed the same way; the ones that miss (orange) are not identifiable from inside a study. Raise the level to 99% and intervals widen so that fewer miss; raise n and they narrow without losing coverage."+(n<60?" With small samples, the simple Wald interval covers less often than claimed; exact or likelihood intervals (Lesson 5) do better.":""));
  const p=studies[0],se=Math.sqrt(p*(1-p)/n);$("ciReport").innerHTML="In the first simulated study, "+Math.round(p*n)+" of "+n+" children developed asthma: <b>risk "+pc(p)+" (95% CI "+pc(p-1.96*se)+" to "+pc(p+1.96*se)+")</b>.";}
$("ciN").addEventListener("input",runCI);$("ciL").addEventListener("change",drawCI);$("ciRun").addEventListener("click",runCI);runCI();

/* ---------- 6.2 ---------- */
let pvMode="null",pvs=[],lastP=null;
function oneTest(n,real){let a1=0,n1=0,a0=0,n0=0;sampleIdx(n).forEach(i=>{const c=kids[i],e=real?c.no2_modeled>=30:rng()<0.5;if(e){n1++;a1+=c.asthma;}else{n0++;a0+=c.asthma;}});
  const p1=a1/n1,p0=a0/n0,pb=(a1+a0)/n,se=Math.sqrt(pb*(1-pb)*(1/n1+1/n0)),z=(p1-p0)/se;return {p:2*(1-Phi(Math.abs(z))),rr:p1/p0,p1:p1,p0:p0,n1:n1,n0:n0};}
function runPV(){const n=+$("pvN").value;pvs=[];for(let s=0;s<1000;s++){const r=oneTest(n,pvMode==="real");pvs.push(r.p);if(s===0)lastP=r;}drawPV();}
function drawPV(){const n=+$("pvN").value;$("pvNO").textContent=n;$("pvNull").setAttribute("aria-pressed",String(pvMode==="null"));$("pvReal").setAttribute("aria-pressed",String(pvMode==="real"));
  const nb=20,c=new Array(nb).fill(0);pvs.forEach(p=>c[Math.min(nb-1,Math.floor(p*nb))]++);const cm=Math.max(80,Math.max.apply(null,c)*1.1);
  const svg=clear($("pvHist")),F=frame(svg,520,260,{l:44,r:14,t:16,b:40},[0,1],[0,cm]);yGrid(F,niceTicks(0,cm,4));xAxis(F,[0,0.05,0.25,0.5,0.75,1],"p-value",v=>v===0.05?"0.05":fmt(v,2));
  txt(svg,F.m.l,10,"p-values from 1,000 studies of "+n+" children",{});
  c.forEach((k,i)=>el("rect",{x:F.X(i/nb)+0.5,y:F.Y(k),width:F.X(1/nb)-F.X(0)-1,height:F.Y(0)-F.Y(k),fill:i===0?css("--p2"):css("--c-lik"),"fill-opacity":0.75},svg));
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(50),y2:F.Y(50),stroke:css("--c-ink"),"stroke-dasharray":"4 3"},svg);txt(svg,F.w-F.m.r,F.Y(50)-4,"expected if the null is true",{"text-anchor":"end"});
  const sig=pvs.filter(p=>p<0.05).length;
  $("pvStats").innerHTML=[["studies with p < 0.05",sig+" of 1,000"],["share",pc(sig/1000)],["median p-value",fmt(quantile(pvs,0.5),3)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("pvNow",pvMode==="null"?"The exposure was assigned by coin toss, so it truly has no effect. The p-values spread evenly between 0 and 1: under a true null, every value is equally likely. <b>"+sig+" of 1,000</b> studies ("+pc(sig/1000)+") still came out \"significant\" at 0.05, exactly the false-positive rate α promises. A single p = 0.04 is therefore weak evidence on its own.":"Now the exposure is high modeled NO₂, which really raises the risk. The p-values pile up near zero, and <b>"+pc(sig/1000)+"</b> of studies reach p < 0.05: that share is the <b>power</b> of a study this size. Even so, "+(1000-sig)+" studies missed a real effect. Increase the number of children to see power rise.");
  if(lastP){const r=lastP,se=Math.sqrt((1-r.p1)/(r.p1*r.n1)+(1-r.p0)/(r.p0*r.n0)),lo=Math.exp(Math.log(r.rr)-1.96*se),hi=Math.exp(Math.log(r.rr)+1.96*se);
    $("pvReport").innerHTML="In the first simulated study, the risk of asthma was "+pc(r.p1)+" in the exposed and "+pc(r.p0)+" in the unexposed (<b>RR "+fmt(r.rr,2)+", 95% CI "+fmt(lo,2)+" to "+fmt(hi,2)+"; p = "+(r.p<0.001?"&lt;0.001":fmt(r.p,3))+"</b>).";}}
$("pvNull").addEventListener("click",()=>{pvMode="null";runPV();});$("pvReal").addEventListener("click",()=>{pvMode="real";runPV();});$("pvN").addEventListener("change",runPV);$("pvN").addEventListener("input",()=>{$("pvNO").textContent=$("pvN").value;});$("pvRun").addEventListener("click",runPV);runPV();

/* ---------- 6.3 ---------- */
const R0=0.12;
function power(rr,n,a){const p0=R0,p1=Math.min(0.99,R0*rr),pb=(p0+p1)/2,z=qnorm(1-a/2),se0=Math.sqrt(2*pb*(1-pb)/n),se1=Math.sqrt(p0*(1-p0)/n+p1*(1-p1)/n);return Phi((Math.abs(p1-p0)-z*se0)/se1);}
let simRes=null;
function drawPW(){const rr=+$("pwRR").value,n=+$("pwN").value,a=+$("pwA").value;$("pwRRO").textContent=fmt(rr,2);$("pwNO").textContent=fmtInt(n);
  const svg=clear($("pwPlot")),F=frame(svg,520,250,{l:44,r:14,t:16,b:40},[50,5000],[0,1]);yGrid(F,[0,0.25,0.5,0.8,1],v=>Math.round(100*v)+"%");xAxis(F,[50,1000,2000,3000,4000,5000],"children per group",v=>fmtInt(v));
  txt(svg,F.m.l,10,"power to detect RR "+fmt(rr,2)+" (baseline risk 12%, α = "+a+")",{});
  const xs=[];for(let k=50;k<=5000;k+=25)xs.push(k);poly(F,xs,xs.map(k=>power(rr,k,a)),{stroke:css("--p1"),"stroke-width":2.4});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0.8),y2:F.Y(0.8),stroke:css("--c-muted"),"stroke-dasharray":"4 3"},svg);
  const pw=power(rr,n,a);el("circle",{cx:F.X(n),cy:F.Y(pw),r:6,fill:css("--p1")},svg);
  let n80=null;for(let k=50;k<=200000;k+=10){if(power(rr,k,a)>=0.8){n80=k;break;}}
  const st=[["power",pc(pw,0)],["type II error",pc(1-pw,0)],["per group for 80% power",n80?fmtInt(n80):"> 200,000"]];
  if(simRes)st.push(["mean RR among significant studies",fmt(simRes.mean,2)]);
  $("pwStats").innerHTML=st.map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg="With "+fmtInt(n)+" children per group and a true risk ratio of "+fmt(rr,2)+", a study has a <b>"+pc(pw,0)+" chance</b> of reaching p < "+a+". "+(rr===1?"With no true effect, the 'power' is just α: every rejection is a false positive.":pw<0.8?"That's below the conventional 80%; about "+(n80?fmtInt(n80):"many more")+" per group would be needed.":"That meets the conventional 80% target.");
  if(simRes)msg+="<br><br><b>Simulation of 2,000 studies at this size:</b> "+pc(simRes.share,0)+" reached significance. Among those that did, the average estimated risk ratio was <b>"+fmt(simRes.mean,2)+"</b>, against a truth of "+fmt(rr,2)+". "+(simRes.mean>rr*1.1?"Significant small studies systematically overestimate the effect: to clear the significance bar, they need an estimate well above the truth.":"At this power, significant studies are only mildly biased.");
  setNow("pwNow",msg);}
function simPW(){const rr=+$("pwRR").value,n=+$("pwN").value,a=+$("pwA").value,z=qnorm(1-a/2),p0=R0,p1=Math.min(0.99,R0*rr),r=makeRng(321);let sig=0,sumrr=0;
  const binom=(n,p)=>{if(n*p>30){return Math.max(0,Math.round(n*p+Math.sqrt(n*p*(1-p))*gaussFrom(r)));}let k=0;for(let i=0;i<n;i++)if(r()<p)k++;return k;};
  for(let s=0;s<2000;s++){const a1=binom(n,p1),a0=binom(n,p0);if(a0===0||a1===0)continue;const q1=a1/n,q0=a0/n,pb=(a1+a0)/(2*n),se=Math.sqrt(pb*(1-pb)*2/n),zz=(q1-q0)/se;if(Math.abs(zz)>z&&zz>0){sig++;sumrr+=q1/q0;}}
  simRes={share:sig/2000,mean:sig?sumrr/sig:NaN};drawPW();}
["pwRR","pwN"].forEach(id=>$(id).addEventListener("input",()=>{simRes=null;drawPW();}));$("pwA").addEventListener("change",()=>{simRes=null;drawPW();});$("pwSim").addEventListener("click",simPW);drawPW();

/* ---------- 6.4 ---------- */
let mtP=[],fwer=null;
function runMT(){const k=+$("mtK").value,n=1000;mtP=[];const idx=sampleIdx(n);for(let j=0;j<k;j++){let a1=0,n1=0,a0=0,n0=0;idx.forEach(i=>{const e=rng()<0.5;if(e){n1++;a1+=kids[i].asthma;}else{n0++;a0+=kids[i].asthma;}});
  const p1=a1/n1,p0=a0/n0,pb=(a1+a0)/n,z=(p1-p0)/Math.sqrt(pb*(1-pb)*(1/n1+1/n0));mtP.push(2*(1-Phi(Math.abs(z))));}fwer=null;drawMT();}
function manyMT(){const k=+$("mtK").value,thr=$("mtBon").checked?0.05/k:0.05;let hit=0;for(let s=0;s<1000;s++){let any=false;for(let j=0;j<k;j++){if(rng()<thr){any=true;break;}}if(any)hit++;}fwer=hit/1000;drawMT();}
function drawMT(){const k=+$("mtK").value,bon=$("mtBon").checked,thr=bon?0.05/k:0.05;$("mtKO").textContent=k;
  const svg=clear($("mtPlot")),F=frame(svg,520,250,{l:44,r:14,t:16,b:40},[-0.5,Math.max(k,1)-0.5],[0,1]);yGrid(F,[0,0.25,0.5,0.75,1],v=>fmt(v,2));xAxis(F,[0,Math.max(0,k-1)],"exposure tested",v=>"#"+(v+1));
  txt(svg,F.m.l,10,"p-value of each null exposure in one study of 1,000 children",{});
  const w=Math.max(2,F.X(1)-F.X(0)-2);let s=0;mtP.slice(0,k).forEach((p,i)=>{const sig=p<thr;if(sig)s++;el("rect",{x:F.X(i)-w/2,y:F.Y(p),width:w,height:F.Y(0)-F.Y(p),fill:sig?css("--p2"):css("--c-lik"),"fill-opacity":0.8},svg);});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(thr),y2:F.Y(thr),stroke:css("--p2"),"stroke-dasharray":"4 3"},svg);
  const theo=1-Math.pow(1-thr,k);
  $("mtStats").innerHTML=[["threshold",thr<0.001?thr.toExponential(1):fmt(thr,4)],["false positives this study",String(s)],["P(at least one), theory",pc(theo,0)],["P(at least one), 1,000 runs",fwer===null?"—":pc(fwer,0)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("mtNow","None of the "+k+" exposures has any effect: each was assigned by coin toss. "+(mtP.length<k?"Press Run.":"In this study, <b>"+s+"</b> came out significant at the "+(bon?"Bonferroni threshold "+fmt(thr,4):"0.05 level")+".")+" The chance that at least one of "+k+" null tests is significant is "+(bon?"held at about 5% by the correction.":"1 − 0.95<sup>"+k+"</sup> = <b>"+pc(theo,0)+"</b>.")+" "+(bon?"The price: a real effect must now reach p < "+fmt(thr,4)+" to be detected, so power falls.":"Report how many tests were run, so readers can judge a lone significant result."));
  $("mtReport").innerHTML="We examined "+k+" exposures. Applying a Bonferroni correction for "+k+" tests, results were considered significant at <b>p &lt; "+(0.05/k<0.001?(0.05/k).toExponential(1):fmt(0.05/k,4))+"</b>.";}
$("mtK").addEventListener("input",runMT);$("mtBon").addEventListener("change",()=>{fwer=null;drawMT();});$("mtRun").addEventListener("click",runMT);$("mtMany").addEventListener("click",manyMT);runMT();

/* ---------- 6.5 ---------- */
function drawEQ(){const e=+$("eqE").value,s=+$("eqS").value,m=+$("eqM").value;$("eqEO").textContent=fmt(e,2);$("eqSO").textContent=fmt(s,3);$("eqMO").textContent=fmt(m,2);
  const lo=Math.exp(Math.log(e)-1.96*s),hi=Math.exp(Math.log(e)+1.96*s),lo90=Math.exp(Math.log(e)-1.645*s),hi90=Math.exp(Math.log(e)+1.645*s),ml=1-m,mu=1+m;
  const svg=clear($("eqPlot")),F=frame(svg,520,200,{l:20,r:14,t:16,b:40},[0.5,2],[0,1]);xAxis(F,[0.5,0.75,1,1.25,1.5,1.75,2],"risk ratio",v=>fmt(v,2));
  el("rect",{x:F.X(ml),y:F.m.t,width:F.X(mu)-F.X(ml),height:F.Y(0)-F.m.t,fill:css("--p4"),"fill-opacity":0.15},svg);txt(svg,F.X(1),F.m.t+12,"equivalence region",{"text-anchor":"middle",style:"fill:"+css("--p4")});
  el("line",{x1:F.X(1),x2:F.X(1),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"4 3"},svg);
  el("line",{x1:F.X(Math.max(0.5,lo)),x2:F.X(Math.min(2,hi)),y1:F.Y(0.45),y2:F.Y(0.45),stroke:css("--p1"),"stroke-width":3},svg);
  el("line",{x1:F.X(Math.max(0.5,lo90)),x2:F.X(Math.min(2,hi90)),y1:F.Y(0.25),y2:F.Y(0.25),stroke:css("--p4"),"stroke-width":3},svg);
  el("circle",{cx:F.X(e),cy:F.Y(0.45),r:5,fill:css("--p1")},svg);txt(svg,F.X(Math.min(2,hi))+4,F.Y(0.45)+4,"95% CI",{});txt(svg,F.X(Math.min(2,hi90))+4,F.Y(0.25)+4,"90% CI (for TOST)",{});
  const sig=lo>1||hi<1,eqv=lo90>ml&&hi90<mu;
  let verdict,detail;
  if(sig&&!eqv&&(lo>mu||hi<ml)){verdict="significant and important";detail="The 95% CI excludes 1, and lies entirely outside the margin: there is evidence of an effect larger than what was defined as negligible.";}
  else if(sig&&eqv){verdict="significant but negligible";detail="The CI excludes 1, so the result is statistically significant, but the 90% CI lies inside the margin: the effect is real but too small to matter by the agreed definition. Large studies often produce this.";}
  else if(!sig&&eqv){verdict="equivalent: evidence of no meaningful effect";detail="The CI includes 1 and the 90% CI lies inside the margin. Both one-sided tests reject, so the data support the claim that any effect is negligible.";}
  else if(!sig){verdict="inconclusive";detail="The CI includes 1, but also includes risk ratios outside the margin. The data are compatible with no effect and with a meaningful one. This is <i>absence of evidence</i>, not evidence of absence.";}
  else{verdict="significant, size uncertain";detail="The CI excludes 1, but overlaps the margin: there is an effect, but the data can't tell whether it is meaningful.";}
  $("eqStats").innerHTML=[["95% CI",fmt(lo,2)+" to "+fmt(hi,2)],["significant at 0.05?",sig?"yes":"no"],["equivalent within ±"+fmt(m,2)+"?",eqv?"yes":"no"],["conclusion",verdict]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("eqNow","<b>"+verdict.charAt(0).toUpperCase()+verdict.slice(1)+".</b> "+detail+" The margin, here a risk ratio from "+fmt(ml,2)+" to "+fmt(mu,2)+", must be justified on subject-matter grounds and fixed in advance.");}
["eqE","eqS","eqM"].forEach(id=>$(id).addEventListener("input",drawEQ));drawEQ();

/* ---------- quiz ---------- */
buildQuiz("quizzes",[
 {t:"stat",q:"A study reports a risk of 13% (95% CI 9% to 18%). Which statement is correct?",o:[["There is a 95% probability that the true risk is between 9% and 18%","That's the interpretation of a Bayesian credible interval, not a confidence interval.",0],["The interval was produced by a method that captures the true risk in 95% of studies","The 95% describes the long-run behavior of the procedure.",1],["95% of children have a risk between 9% and 18%","The interval concerns the population risk, not individual risks.",0],["A repeat study would give a risk between 9% and 18% with 95% probability","Not exactly: the next estimate has its own sampling variation around the truth.",0]]},
 {t:"stat",q:"A study finds p = 0.03 for an association. What does this mean?",o:[["There is a 3% probability that the null hypothesis is true","p-values are computed assuming the null is true; they aren't its probability.",0],["If there were no association, data at least this extreme would occur about 3% of the time","That's the definition.",1],["There is a 97% probability that the association is real","This reverses the conditional probability, as in Lesson 2.",0],["The association is large","p-values say nothing about effect size on their own.",0]]},
 {t:"epi",q:"A small study of a new exposure finds RR 2.4 (p = 0.04). Later, larger studies find RR around 1.3. The best explanation is:",o:[["The exposure became less harmful","That's possible in principle but rarely the explanation.",0],["Winner's curse: in low-powered studies, results that reach significance tend to overestimate the effect","To cross the significance threshold with a small sample, the estimate must be well above the truth.",1],["The larger studies were biased toward the null","Not necessarily; the simplest explanation is the small study's selection by significance.",0],["The p-value was miscalculated","The p-value can be correct and the estimate still exaggerated.",0]]},
 {t:"stat",q:"You test 20 exposures that truly have no effect, each at α = 0.05. The probability that at least one is significant is about:",o:[["5%","That's the rate per test.",0],["64%","1 − 0.95²⁰ ≈ 0.64.",1],["100%","It's likely but not certain.",0],["20%","Probabilities don't add this way for 'at least one'.",0]]},
 {t:"epi",q:"A study of NO₂ and asthma finds RR 1.08 (95% CI 0.85 to 1.37), p = 0.52. The authors conclude \"NO₂ has no effect on asthma\". What is wrong?",o:[["Nothing; p > 0.05 shows no effect","Non-significance doesn't show absence of an effect.",0],["The interval includes risk ratios up to 1.37, so a meaningful harmful effect is compatible with the data","This is absence of evidence, not evidence of absence. An equivalence test would be needed.",1],["They should have used a one-sided test","That wouldn't make the conclusion valid.",0],["The p-value is too large to report","All p-values can be reported.",0]]},
 {t:"stat",q:"Power is:",o:[["The probability that the null hypothesis is false","Power is conditional on a specified effect being real.",0],["The probability of rejecting the null when a specified effect truly exists","That is 1 minus the type II error rate.",1],["The same as the significance level α","α is the type I error rate under the null.",0],["The probability that a significant result is true","That's closer to a positive predictive value of research findings, which also depends on prior plausibility.",0]]},
 {t:"epi",q:"A very large study finds RR 1.02 (95% CI 1.01 to 1.03), p < 0.001. With an equivalence margin of 0.9 to 1.1, the most accurate summary is:",o:[["A strong, important effect","The p-value is tiny because the study is huge, not because the effect is large.",0],["Statistically significant but negligible","The interval excludes 1 but lies well inside the margin of practical importance.",1],["No effect, since the RR is near 1","The interval excludes 1, so there is evidence of a small effect.",0],["Inconclusive","The interval is narrow and lies inside the margin, so it is quite conclusive.",0]]}]);
onTheme(()=>{drawCI();drawPV();drawPW();drawMT();drawEQ();});
});
