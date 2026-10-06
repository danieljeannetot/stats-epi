document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children;
const city=new Array(A.days.length).fill(0);A.rows.forEach(r=>{city[r.t]+=r.visits;});
const MU=mean(city),SIG=Math.sqrt(sum(city.map(v=>(v-MU)*(v-MU)))/city.length);
let rng=makeRng(4242);
const draw=(arr,n)=>{const out=new Array(n);for(let i=0;i<n;i++)out[i]=arr[Math.floor(rng()*arr.length)];return out;};

/* ---------- 4.1 and 4.2 ---------- */
let means=[],last=null;
function hist(svg,vals,lo,hi,nb,color,F){const w=(hi-lo)/nb,c=new Array(nb).fill(0);vals.forEach(v=>{const i=Math.floor((v-lo)/w);if(i>=0&&i<nb)c[i]++;});return c;}
function drawS(){const n=+$("sN").value;$("sNO").textContent=n;const svg=clear($("sdist"));
  const se=SIG/Math.sqrt(n),lo=MU-4.5*SIG/Math.sqrt(5),hi=MU+4.5*SIG/Math.sqrt(5),nb=60,w=(hi-lo)/nb,c=new Array(nb).fill(0);
  means.forEach(v=>{const i=Math.floor((v-lo)/w);if(i>=0&&i<nb)c[i]++;});const cm=Math.max(5,Math.max.apply(null,c)*1.15);
  const F=frame(svg,520,270,{l:44,r:14,t:16,b:40},[lo,hi],[0,cm]);yGrid(F,niceTicks(0,cm,4));xAxis(F,niceTicks(lo,hi,6),"sample mean (visits per day)",v=>fmt(v,0));
  txt(svg,F.m.l,10,"number of samples with each mean ("+fmtInt(means.length)+" samples of "+n+" days)",{});
  c.forEach((k,i)=>el("rect",{x:F.X(lo+i*w)+0.5,y:F.Y(k),width:Math.max(0.5,F.X(lo+w)-F.X(lo)-1),height:F.Y(0)-F.Y(k),fill:css("--p1"),"fill-opacity":0.6},svg));
  el("line",{x1:F.X(MU),x2:F.X(MU),y1:F.m.t,y2:F.Y(0),stroke:css("--p2"),"stroke-width":2.4},svg);
  if(last!==null)el("line",{x1:F.X(last),x2:F.X(last),y1:F.m.t+10,y2:F.Y(0),stroke:css("--c-ink"),"stroke-width":2,"stroke-dasharray":"4 3"},svg);
  const emp=means.length>1?sd(means):NaN;
  $("sStats").innerHTML=[["true mean",fmt(MU,1)],["latest estimate",last===null?"—":fmt(last,1)],["mean of estimates",means.length?fmt(mean(means),1):"—"],["spread of estimates (SD)",isNaN(emp)?"—":fmt(emp,1)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  if(!means.length)setNow("sNow","The population of 1,827 days has a true mean of <b>"+fmt(MU,1)+"</b> visits per day (orange line). Press <b>Draw 1 sample</b> to pick "+n+" days at random and compute their mean.");
  else setNow("sNow","The latest sample of "+n+" days gave an estimate of <b>"+fmt(last,1)+"</b>, "+fmt(Math.abs(last-MU),1)+" "+(last>MU?"above":"below")+" the truth. After "+fmtInt(means.length)+" samples, the estimates average "+fmt(mean(means),1)+", very close to the true "+fmt(MU,1)+": the sample mean is <b>unbiased</b>. But individual estimates scatter, with an SD of "+(isNaN(emp)?"—":fmt(emp,1))+". That scatter, the histogram you're building, is the <b>sampling distribution</b>. A real study sees only one bar of it.");
  drawSE(n,emp);}
function drawSE(n,emp){const svg=clear($("sePlot")),F=frame(svg,520,260,{l:44,r:14,t:16,b:40},[5,200],[0,SIG/Math.sqrt(5)*1.1]);
  yGrid(F,niceTicks(0,F.yr[1],4),v=>fmt(v,0));xAxis(F,[5,25,50,100,150,200],"days per sample, n");txt(svg,F.m.l,10,"standard error of the mean",{});
  const xs=[];for(let k=5;k<=200;k++)xs.push(k);poly(F,xs,xs.map(k=>SIG/Math.sqrt(k)),{stroke:css("--p1"),"stroke-width":2.4});
  el("circle",{cx:F.X(n),cy:F.Y(SIG/Math.sqrt(n)),r:6,fill:css("--p1")},svg);
  if(!isNaN(emp)&&means.length>=20){const x=F.X(n),y=F.Y(emp);el("line",{x1:x-6,x2:x+6,y1:y-6,y2:y+6,stroke:css("--p2"),"stroke-width":2.4},svg);el("line",{x1:x-6,x2:x+6,y1:y+6,y2:y-6,stroke:css("--p2"),"stroke-width":2.4},svg);}
  const se=SIG/Math.sqrt(n);
  setNow("seNow","With n = "+n+" days, the standard error is σ/√n = "+fmt(SIG,1)+"/√"+n+" = <b>"+fmt(se,1)+"</b> visits per day. "+(means.length>=20?"Your "+fmtInt(means.length)+" simulated samples have an SD of "+fmt(emp,1)+" (orange cross), close to the formula.":"Draw at least 20 samples to compare the formula with the simulation.")+" The SD of the data, "+fmt(SIG,1)+", doesn't change with n; the SE does. Going from 20 to 80 days halves it, from "+fmt(SIG/Math.sqrt(20),1)+" to "+fmt(SIG/Math.sqrt(80),1)+".");
  $("seReport").innerHTML="In a random sample of "+n+" days, the city's emergency departments saw a mean of "+(last===null?"…":fmt(last,0))+" visits per day (SD "+fmt(SIG,0)+"; <b>SE "+fmt(se,1)+"</b>).";}
const doDraw=k=>{const n=+$("sN").value;for(let i=0;i<k;i++){last=mean(draw(city,n));means.push(last);}drawS();};
$("sOne").addEventListener("click",()=>doDraw(1));$("sHund").addEventListener("click",()=>doDraw(100));$("sThou").addEventListener("click",()=>doDraw(1000));
$("sReset").addEventListener("click",()=>{means=[];last=null;drawS();});
$("sN").addEventListener("input",()=>{means=[];last=null;drawS();});drawS();

/* ---------- 4.3 ---------- */
const lake014=A.rows.filter(r=>r.district==="Lakeside"&&r.g===0).map(r=>r.visits);
const SRC={pm:{v:A.days.map(d=>d.pm25),lab:"average PM2.5 (µg/m³)"},lake:{v:lake014,lab:"average visits per day"},temp:{v:A.days.map(d=>d.temp_city),lab:"average temperature (°C)"}};
let cn=5;
function skew(a){const m=mean(a),s=sd(a);return sum(a.map(x=>Math.pow((x-m)/s,3)))/a.length;}
function drawCLT(){const S=SRC[$("cVar").value],r=makeRng(77+cn),ms=[];for(let i=0;i<2000;i++){let s=0;for(let j=0;j<cn;j++)s+=S.v[Math.floor(r()*S.v.length)];ms.push(s/cn);}
  const m=mean(ms),s=sd(ms),lo=Math.min.apply(null,ms),hi=Math.max.apply(null,ms),nb=45,w=(hi-lo)/nb,c=new Array(nb).fill(0);ms.forEach(v=>{c[Math.min(nb-1,Math.floor((v-lo)/w))]++;});
  const dens=c.map(k=>k/(2000*w)),svg=clear($("clt")),pk=1/(s*Math.sqrt(2*Math.PI)),ymax=Math.max(Math.max.apply(null,dens),pk)*1.12;
  const F=frame(svg,520,260,{l:44,r:14,t:16,b:40},[lo,hi],[0,ymax]);xAxis(F,niceTicks(lo,hi,6),S.lab,v=>fmt(v,1));txt(svg,F.m.l,10,"distribution of 2,000 averages of n = "+cn+" values",{});
  dens.forEach((d,i)=>el("rect",{x:F.X(lo+i*w)+0.5,y:F.Y(d),width:Math.max(0.5,F.X(lo+w)-F.X(lo)-1),height:F.Y(0)-F.Y(d),fill:css("--c-lik"),"fill-opacity":0.6},svg));
  const xs=[];for(let x=lo;x<=hi;x+=(hi-lo)/200)xs.push(x);poly(F,xs,xs.map(x=>Math.exp(-(x-m)*(x-m)/(2*s*s))*pk),{stroke:css("--p1"),"stroke-width":2.4});
  const sk=skew(ms),sk0=skew(S.v);
  $("cStats").innerHTML=[["n averaged",String(cn)],["skewness of the data",fmt(sk0,2)],["skewness of the averages",fmt(sk,2)],["SD of the averages",fmt(s,2)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("cNow","Each of the 2,000 averages uses "+cn+" randomly chosen days. "+(cn===1?"With n = 1, the 'averages' are just single days, so you see the original distribution, with skewness "+fmt(sk0,2)+".":"The skewness has fallen from "+fmt(sk0,2)+" in the raw data to <b>"+fmt(sk,2)+"</b> in the averages, roughly by a factor of √n.")+" "+(Math.abs(sk)<0.15?"The normal curve now describes the averages well: the central limit theorem at work.":"The averages are still noticeably "+(sk>0?"right-":"left-")+"skewed; the normal curve fits poorly in the tails. Increase n.")+($("cVar").value==="temp"&&cn<5?" Temperature's two peaks merge quickly into one as values are averaged.":""));}
$("cVar").addEventListener("change",drawCLT);
document.querySelectorAll("#cN button").forEach(b=>b.addEventListener("click",()=>{cn=+b.dataset.n;document.querySelectorAll("#cN button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));drawCLT();}));drawCLT();

/* ---------- 4.4 ---------- */
const NO2=kids.map(c=>c.no2_modeled),TRUE_NO2=mean(NO2);let smp=[],boot=[];
function newSample(){const n=+$("bN").value;$("bNO").textContent=n;smp=draw(NO2,n);boot=[];drawBoot();}
function runBoot(){const r=makeRng(Math.floor(rng()*1e6)+1);boot=[];for(let b=0;b<2000;b++){let s=0;for(let i=0;i<smp.length;i++)s+=smp[Math.floor(r()*smp.length)];boot.push(s/smp.length);}drawBoot();}
function drawBoot(){const m=mean(smp),s=sd(smp),seF=s/Math.sqrt(smp.length),svg=clear($("boot"));
  const lo=TRUE_NO2-14,hi=TRUE_NO2+14;const F=frame(svg,520,260,{l:44,r:14,t:16,b:40},[lo,hi],[0,1]);xAxis(F,niceTicks(lo,hi,7),"mean NO₂ (µg/m³)",v=>fmt(v,0));
  let seB=NaN,ql=NaN,qh=NaN;
  if(boot.length){const nb=56,w=(hi-lo)/nb,c=new Array(nb).fill(0);boot.forEach(v=>{const i=Math.floor((v-lo)/w);if(i>=0&&i<nb)c[i]++;});const cm=Math.max.apply(null,c)*1.12;
    c.forEach((k,i)=>{const h=(F.Y(0)-F.m.t)*k/cm;el("rect",{x:F.X(lo+i*w)+0.5,y:F.Y(0)-h,width:Math.max(0.5,F.X(lo+w)-F.X(lo)-1),height:h,fill:css("--p4"),"fill-opacity":0.6},svg);});
    seB=sd(boot);ql=quantile(boot,0.025);qh=quantile(boot,0.975);el("rect",{x:F.X(ql),y:F.Y(0)+2,width:F.X(qh)-F.X(ql),height:6,fill:css("--p4")},svg);txt(svg,F.m.l,10,"2,000 bootstrap means; the bar below the axis is the 95% percentile interval",{});}
  else txt(svg,F.m.l,10,"press Run to resample the study sample",{});
  el("line",{x1:F.X(m),x2:F.X(m),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-width":2,"stroke-dasharray":"4 3"},svg);
  el("line",{x1:F.X(TRUE_NO2),x2:F.X(TRUE_NO2),y1:F.m.t,y2:F.Y(0),stroke:css("--p2"),"stroke-width":2.4},svg);
  $("bStats").innerHTML=[["sample mean",fmt(m,1)],["SE by formula",fmt(seF,2)],["SE by bootstrap",isNaN(seB)?"—":fmt(seB,2)],["95% interval",isNaN(ql)?"—":fmt(ql,1)+"–"+fmt(qh,1)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("bNow",!boot.length?"The study sample has "+smp.length+" children with a mean modeled NO₂ of <b>"+fmt(m,1)+"</b> µg/m³. The truth, known only because the data are simulated, is "+fmt(TRUE_NO2,1)+". Press <b>Run</b> to resample this one sample 2,000 times.":"Each bootstrap resample draws "+smp.length+" children <i>from the sample</i>, with replacement, so some appear twice and others not at all. The 2,000 resampled means have an SD of <b>"+fmt(seB,2)+"</b>, close to the formula s/√n = "+fmt(seF,2)+". Their middle 95% runs from "+fmt(ql,1)+" to "+fmt(qh,1)+" µg/m³, which "+(TRUE_NO2>=ql&&TRUE_NO2<=qh?"contains":"misses")+" the true mean. The bootstrap is centered on the sample mean, not the truth: it describes the uncertainty of the estimate, it doesn't correct it. Its strength is that it works for estimates with no simple SE formula, like a median or an attributable fraction.");
  $("bReport").innerHTML="Mean modeled NO₂ in a random sample of "+smp.length+" children was "+fmt(m,1)+" µg/m³ (<b>bootstrap SE "+(isNaN(seB)?"…":fmt(seB,2))+"; 95% percentile interval "+(isNaN(ql)?"…":fmt(ql,1)+" to "+fmt(qh,1))+"</b>, 2,000 resamples).";}
$("bN").addEventListener("input",newSample);$("bNew").addEventListener("click",newSample);$("bRun").addEventListener("click",runBoot);newSample();

/* ---------- quiz ---------- */
buildQuiz("quizzes",[
 {t:"stat",q:"A study reports mean daily visits of 436 with SD 52, from 20 days. What is the standard error of the mean?",o:[["52","That's the SD of the data, not of the mean.",0],["About 11.6","SE = 52/√20 ≈ 11.6.",1],["2.6","That's 52/20; the SE divides by the square root of n.",0],["It can't be computed without the population SD","The sample SD is used as an estimate of it.",0]]},
 {t:"stat",q:"To halve the standard error of a mean, you need:",o:[["Twice as many observations","SE falls with √n, so doubling n reduces it by only about 30%.",0],["Four times as many observations","√4 = 2, so the SE halves.",1],["Half as many observations","Fewer observations increase the SE.",0],["A smaller SD in the data","That would help, but it isn't something you can usually choose.",0]]},
 {t:"stat",q:"The central limit theorem says that:",o:[["Data become normally distributed when the sample is large","The data keep their own distribution; it is averages that become normal.",0],["Averages of many independent values are approximately normally distributed","This holds whatever the shape of the data, as long as the variance is finite.",1],["Any estimate is unbiased in large samples","That's a different property, and not always true.",0],["The SD of the data shrinks with n","The SD of the data doesn't depend on n.",0]]},
 {t:"epi",q:"An abstract reports \"PM2.5: 13.0 ± 0.1 µg/m³ (mean ± SE), n = 1,827 days\". What is misleading?",o:[["Nothing; the SE is the correct measure of variability","The SE describes the precision of the mean, not how much days vary.",0],["It suggests days hardly vary in pollution, when the SD is about 4.5 µg/m³","With 1,827 days the SE is tiny. To describe the data, report the SD or, for skewed PM2.5, the median and IQR.",1],["The mean should be replaced by the mode","The issue is the spread measure, not the center.",0],["The sample is too small","1,827 days is a large sample.",0]]},
 {t:"stat",q:"A bootstrap resample is drawn:",o:[["From the population, without replacement","The population isn't available; the bootstrap uses the sample itself.",0],["From the sample, with replacement, with the same size as the sample","This mimics drawing a new sample from the population the sample represents.",1],["From the sample, without replacement","That would reproduce the same sample every time.",0],["From a normal distribution with the sample's mean and SD","That's a parametric bootstrap, a different method.",0]]},
 {t:"stat",q:"The sample mean is called unbiased because:",o:[["Every sample gives the true value","Individual samples miss; unbiasedness is about the average across samples.",0],["Across repeated samples, its average equals the true mean","Bias is E[estimator] − truth, and for the sample mean that is zero.",1],["It isn't affected by outliers","Outliers do affect the mean; that's about robustness, not bias.",0],["Its standard error is small","Precision and bias are separate properties.",0]]}]);
onTheme(()=>{drawS();drawCLT();drawBoot();});
});
