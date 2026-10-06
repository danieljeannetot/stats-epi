document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA();
function lgamma(x){const g=7,c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);x-=1;let a=c[0];const t=x+g+0.5;for(let i=1;i<9;i++)a+=c[i]/(x+i);return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);}
const dbinom=(k,n,p)=>Math.exp(lgamma(n+1)-lgamma(k+1)-lgamma(n-k+1)+k*Math.log(p)+(n-k)*Math.log(1-p));
const dpois=(k,m)=>Math.exp(k*Math.log(m)-m-lgamma(k+1));
const dnb=(k,m,phi)=>Math.exp(lgamma(k+phi)-lgamma(phi)-lgamma(k+1)+phi*Math.log(phi/(phi+m))+k*Math.log(m/(phi+m)));
function erf(x){const t=1/(1+0.3275911*Math.abs(x)),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
const pnorm=(x,m,s)=>0.5*(1+erf((x-m)/(s*Math.SQRT2))),dnorm=(x,m,s)=>Math.exp(-(x-m)*(x-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
const opts=DISTRICTS.map(d=>"<option value='"+d.id+"'"+(d.name==="Lakeside"?" selected":"")+">"+d.name+"</option>").join("");
$("rvD").innerHTML=opts;$("oD").innerHTML=opts.replace(" selected","").replace("value='6'","value='6' selected");
function series(id,g){return A.rows.filter(r=>r.district_id===id&&r.g===g);}
function bars(svg,counts,lo,hi,ymax,opts){const F=frame(svg,520,opts.h||260,{l:44,r:14,t:16,b:40},[lo-0.5,hi+0.5],[0,ymax]);
  yGrid(F,niceTicks(0,ymax,4),v=>opts.pct?Math.round(100*v)+"%":String(v));xAxis(F,niceTicks(lo,hi,8).filter(v=>Number.isInteger(v)),opts.xlab);
  const w=Math.max(1,F.X(1)-F.X(0)-1);counts.forEach((c,i)=>{const k=lo+i;el("rect",{x:F.X(k)-w/2,y:F.Y(c),width:w,height:F.Y(0)-F.Y(c),fill:css("--c-lik"),"fill-opacity":opts.op||0.6},svg);});return F;}

/* ---------- 3.1 ---------- */
function drawRV(){const id=+$("rvD").value,g=+$("rvG").value,d=DISTRICTS[id-1],y=series(id,g).map(r=>r.visits),n=y.length;
  const lo=0,hi=Math.max.apply(null,y),c=new Array(hi+1).fill(0);y.forEach(v=>c[v]++);const p=c.map(v=>v/n);
  const m=mean(y),v=sd(y)**2;const svg=clear($("pmf"));const F=bars(svg,p,lo,hi,Math.max.apply(null,p)*1.15,{pct:true,xlab:"visits on a day"});
  txt(svg,F.m.l,10,"share of the 1,827 days with each number of visits",{});
  el("line",{x1:F.X(m),x2:F.X(m),y1:F.m.t,y2:F.Y(0),stroke:css("--p1"),"stroke-width":2.4},svg);txt(svg,F.X(m)+4,F.m.t+12,"E[Y] ≈ "+fmt(m,1),{style:"fill:"+css("--p1")});
  const mode=p.indexOf(Math.max.apply(null,p));
  $("rvStats").innerHTML=[["days",fmtInt(n)],["mean",fmt(m,2)],["variance",fmt(v,2)],["variance ÷ mean",fmt(v/m,2)],["most common",String(mode)],["range",Math.min.apply(null,y)+"–"+hi]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("rvNow","Each bar is the share of days with that many visits by "+AGE_GROUPS[g]+" residents of "+d.name+": an estimate of P(Y = y). The expected value, the long-run average, is about <b>"+fmt(m,1)+"</b> visits a day; it sits where the distribution would balance. The variance, "+fmt(v,1)+", measures spread in squared visits; its square root, "+fmt(Math.sqrt(v),1)+", is the SD. "+(v/m>1.3?"The variance is "+fmt(v/m,1)+" times the mean. A Poisson distribution would make them equal, so keep this ratio in mind for section 3.4.":"The variance is close to the mean, as a Poisson distribution would predict.")+(m<3?" With so few visits per day, the distribution is lopsided: counts can't go below zero.":""));
  $("rvReport").innerHTML="Residents of "+d.name+" aged "+AGE_GROUPS[g]+" made a mean of <b>"+fmt(m,1)+" emergency visits per day</b> (variance "+fmt(v,1)+"; range "+Math.min.apply(null,y)+"–"+hi+") over 2020–2024.";}
$("rvD").addEventListener("change",drawRV);$("rvG").addEventListener("change",drawRV);drawRV();

/* ---------- 3.2 ---------- */
let distMode="bin";
function drawDist(){const bin=distMode==="bin";$("rowN").hidden=!bin;$("rowP").hidden=!bin;$("rowL").hidden=bin;$("cmpPoi").parentElement.hidden=!bin;
  $("dBin").setAttribute("aria-pressed",String(bin));$("dPoi").setAttribute("aria-pressed",String(!bin));
  const n=+$("bN").value,p=+$("bP").value/100,mu=bin?n*p:+$("pL").value/10;$("bNO").textContent=n;$("bPO").textContent=fmt(100*p,0)+"%";$("pLO").textContent=fmt(mu,1);
  const sdv=Math.sqrt(bin?n*p*(1-p):mu),hi=Math.min(bin?n:400,Math.ceil(mu+4.5*sdv+3)),lo=Math.max(0,Math.floor(mu-4.5*sdv));
  const pr=[];for(let k=lo;k<=hi;k++)pr.push(bin?dbinom(k,n,p):dpois(k,mu));
  const showP=bin&&$("cmpPoi").checked,pp=[];if(showP)for(let k=lo;k<=hi;k++)pp.push(dpois(k,mu));
  const svg=clear($("dist")),ymax=Math.max.apply(null,pr.concat(pp))*1.15;const F=bars(svg,pr,lo,hi,ymax,{xlab:bin?"number of children with the outcome":"number of events",op:0.75});
  txt(svg,F.m.l,10,"P(Y = k)",{});
  if(showP){const xs=pp.map((_,i)=>lo+i);poly(F,xs,pp,{stroke:css("--p1"),"stroke-width":2.2});xs.forEach((x,i)=>el("circle",{cx:F.X(x),cy:F.Y(pp[i]),r:2.6,fill:css("--p1")},svg));}
  const v=bin?n*p*(1-p):mu;let diff=0;if(showP)pr.forEach((q,i)=>{diff=Math.max(diff,Math.abs(q-pp[i]));});
  $("dStats").innerHTML=[["mean",fmt(mu,2)],["variance",fmt(v,2)],["SD",fmt(Math.sqrt(v),2)],["P(Y = 0)",fmt(100*(bin?dbinom(0,n,p):dpois(0,mu)),1)+"%"]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  let msg;
  if(bin){msg="A binomial with <b>n = "+n+"</b> trials and <b>π = "+fmt(100*p,0)+"%</b>: for example, the number of children with asthma in a class of "+n+". The expected number is nπ = "+fmt(mu,1)+", and the variance nπ(1 − π) = "+fmt(v,2)+", a little less than the mean.";
    if(showP)msg+="<br><br>The blue dots show a Poisson with the same mean. The largest difference in any probability is "+fmt(100*diff,2)+" percentage points. "+(diff<0.005?"With many trials and a small π, the two are practically identical: this is why counts of rare events in large populations are modeled as Poisson.":"Increase n and decrease π, keeping nπ similar, and the two converge.");}
  else msg="A Poisson with mean <b>μ = "+fmt(mu,1)+"</b>, for example the number of emergency visits on a day. Its variance is also "+fmt(mu,1)+": one parameter sets both. "+(mu<5?"For small means the distribution is right-skewed, with a real chance of zero ("+fmt(100*dpois(0,mu),1)+"%).":"For larger means it becomes nearly symmetric and close to a normal distribution.");
  setNow("dNow",msg);
  $("dReport").innerHTML=bin?"In a class of "+n+" children with an asthma risk of "+fmt(100*p,0)+"%, the expected number of cases is <b>"+fmt(mu,1)+"</b> (SD "+fmt(Math.sqrt(v),1)+"), and the probability of no cases at all is "+fmt(100*dbinom(0,n,p),1)+"%.":"With an expected "+fmt(mu,1)+" visits per day under a Poisson model, about 95% of days would see between <b>"+Math.max(0,Math.round(mu-1.96*Math.sqrt(mu)))+" and "+Math.round(mu+1.96*Math.sqrt(mu))+" visits</b>.";}
["bN","bP","pL"].forEach(id=>$(id).addEventListener("input",drawDist));$("cmpPoi").addEventListener("change",drawDist);
$("dBin").addEventListener("click",()=>{distMode="bin";drawDist();});$("dPoi").addEventListener("click",()=>{distMode="poi";drawDist();});drawDist();

/* ---------- 3.3 ---------- */
function drawNorm(){const m=+$("nM").value,s=+$("nS").value;let a=+$("nA").value,b=+$("nB").value;if(a>b){const t=a;a=b;b=t;}
  $("nMO").textContent=fmt(m,1);$("nSO").textContent=fmt(s,2);$("nAO").textContent=fmt(+$("nA").value,2);$("nBO").textContent=fmt(+$("nB").value,2);
  const peak=dnorm(m,m,s),ymax=Math.max(0.5,peak*1.12),svg=clear($("norm")),F=frame(svg,520,260,{l:44,r:14,t:16,b:40},[-4,4],[0,ymax]);
  yGrid(F,niceTicks(0,ymax,4),v=>fmt(v,v<1?1:0));xAxis(F,[-4,-3,-2,-1,0,1,2,3,4],"x");txt(svg,F.m.l,10,"density f(x)",{});
  const xs=[];for(let x=-4;x<=4.0001;x+=0.02)xs.push(x);const sh=xs.filter(x=>x>=a&&x<=b);
  if(sh.length)el("polygon",{points:[F.X(sh[0])+","+F.Y(0)].concat(sh.map(x=>F.X(x)+","+F.Y(Math.min(ymax,dnorm(x,m,s))))).concat([F.X(sh[sh.length-1])+","+F.Y(0)]).join(" "),fill:css("--p1"),"fill-opacity":0.25},svg);
  poly(F,xs,xs.map(x=>dnorm(x,m,s)),{stroke:css("--p1"),"stroke-width":2.4});
  if(peak>1)el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(1),y2:F.Y(1),stroke:css("--p2"),"stroke-dasharray":"4 3"},svg);
  const area=pnorm(b,m,s)-pnorm(a,m,s);
  $("nStats").innerHTML=[["area (probability)",fmt(100*area,1)+"%"],["height at the peak",fmt(peak,2)],["μ ± 1.96σ",fmt(m-1.96*s,2)+" to "+fmt(m+1.96*s,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("nNow","The shaded area between "+fmt(a,2)+" and "+fmt(b,2)+" is <b>"+fmt(100*area,1)+"%</b> of the total: that is P("+fmt(a,2)+" ≤ X ≤ "+fmt(b,2)+"). "+(peak>1?"The peak of the curve is at a height of <b>"+fmt(peak,2)+"</b>, above 1 (dashed line). That's fine: with σ = "+fmt(s,2)+" the distribution is narrow, so it must be tall for the total area to equal 1. Heights are not probabilities.":"The height at the peak is "+fmt(peak,2)+". Make σ smaller than about 0.4 and the height will exceed 1, while the area stays 1.")+" For any normal distribution, about 95% of the area lies within 1.96 standard deviations of the mean.");
  $("nReport").innerHTML="If daily mean temperature were normally distributed with mean μ and SD σ, about 95% of days would fall between <b>μ − 1.96σ and μ + 1.96σ</b>. Here that is "+fmt(m-1.96*s,2)+" to "+fmt(m+1.96*s,2)+". (Real temperature is bimodal, so this is only an approximation.)";}
["nM","nS","nA","nB"].forEach(id=>$(id).addEventListener("input",drawNorm));drawNorm();

/* ---------- 3.4 ---------- */
function drawOD(){const id=+$("oD").value,g=+$("oG").value,f=$("oF").value,d=DISTRICTS[id-1];
  let rows=series(id,g);if(f!=="all")rows=rows.filter(r=>{const mo=+r.date.slice(5,7);return (mo===12||mo<=2)&&(f!=="both"||r.dow===2);});
  const y=rows.map(r=>r.visits),n=y.length,m=mean(y),v=sd(y)**2,phi=v>m?m*m/(v-m):Infinity;
  const lo=Math.max(0,Math.floor(m-4*Math.sqrt(v))),hi=Math.ceil(m+4.5*Math.sqrt(v)),c=new Array(hi-lo+1).fill(0);y.forEach(x=>{if(x>=lo&&x<=hi)c[x-lo]++;});const p=c.map(x=>x/n);
  const xs=p.map((_,i)=>lo+i),pp=xs.map(k=>dpois(k,m)),pn=isFinite(phi)?xs.map(k=>dnb(k,m,phi)):pp;
  const svg=clear($("od")),ymax=Math.max.apply(null,p.concat(pp,pn))*1.15,F=bars(svg,p,lo,hi,ymax,{pct:true,xlab:"visits on a day",h:270});
  txt(svg,F.m.l,10,"share of days with each count ("+fmtInt(n)+" days)",{});
  poly(F,xs,pp,{stroke:css("--p1"),"stroke-width":2.4});poly(F,xs,pn,{stroke:css("--p2"),"stroke-width":2.4,"stroke-dasharray":"6 3"});
  const sdPois=Math.sqrt(m),sdObs=Math.sqrt(v);
  $("oStats").innerHTML=[["mean",fmt(m,2)],["variance",fmt(v,2)],["variance ÷ mean",fmt(v/m,2)],["negative binomial φ",isFinite(phi)?fmt(phi,1):"∞"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const fl={all:"all 1,827 days",season:"winter days only",both:"winter Tuesdays only"}[f];
  setNow("oNow","Using "+fl+", "+AGE_GROUPS[g]+" residents of "+d.name+" averaged <b>"+fmt(m,1)+"</b> visits a day with a variance of <b>"+fmt(v,1)+"</b>: "+fmt(v/m,2)+" times the mean. "+(v/m>1.15?"The blue Poisson curve, which forces the variance to equal the mean, is too narrow: it underestimates how often quiet and busy days occur. The dashed negative binomial, with the observed variance, fits much better. A Poisson model would treat the data as "+fmt(v/m,1)+" times more informative than they are, and its standard errors would be "+fmt(Math.sqrt(v/m),2)+" times too small.":"Here the variance is close to the mean, and the Poisson fits well.")+(f==="all"?"<br><br>Much of this extra variation comes from season and day of week. Restrict to winter days, then to winter Tuesdays, and watch the ratio fall.":f==="season"?"<br><br>Restricting to winter removed seasonal variation, and the ratio fell. Restrict further to Tuesdays.":"<br><br>With season and weekday removed, what remains is closer to Poisson. Regression models do this kind of adjustment for many variables at once."));
  $("oReport").innerHTML="Daily emergency visits among "+AGE_GROUPS[g]+" residents of "+d.name+" were overdispersed (<b>variance-to-mean ratio "+fmt(v/m,2)+"</b>, "+fl+"), so a negative binomial or quasi-Poisson model is preferred to a Poisson model.";}
["oD","oG","oF"].forEach(id=>$(id).addEventListener("change",drawOD));drawOD();

/* ---------- quiz ---------- */
buildQuiz("quizzes",[
 {t:"stat",q:"For a Poisson distribution with mean 8, the variance is:",o:[["√8 ≈ 2.8","That's the standard deviation.",0],["8","The Poisson has a single parameter that is both its mean and its variance.",1],["64","That would be the square of the mean.",0],["It depends on the sample size","The variance of the distribution is fixed by its mean.",0]]},
 {t:"stat",q:"A normal density has a height of 2 at its peak. This means:",o:[["Something is wrong: probabilities can't exceed 1","Heights of a density are not probabilities; only areas are.",0],["The distribution is narrow, so it must be tall to have total area 1","For example, a normal with σ = 0.2 peaks at about 2.",1],["The value at the peak occurs with probability 2","A single point has probability zero under a continuous distribution.",0],["The variance is 2","The height depends on σ, but it isn't the variance.",0]]},
 {t:"stat",q:"When does the binomial distribution approach the Poisson?",o:[["When n is small and π is large","The opposite: many trials, each with a small probability.",0],["When n is large and π is small, with nπ held moderate","This is the Poisson limit of the binomial, and why counts of rare events in big populations are Poisson.",1],["Always, for any n and π","For small n or large π the two differ clearly.",0],["When π = 0.5","With π = 0.5 the binomial is symmetric but not Poisson.",0]]},
 {t:"epi",q:"Daily emergency visits have a mean of 25 and a variance of 70. What is the main consequence of analyzing them with a plain Poisson model?",o:[["The estimated mean will be wrong","Poisson regression still estimates the mean correctly.",0],["Standard errors will be too small, by a factor of about 1.7","√(70/25) ≈ 1.67. Intervals will be too narrow and p-values too small.",1],["The model can't be fitted","It can be fitted; the problem is in the uncertainty it reports.",0],["Nothing, because the counts are large","Overdispersion matters regardless of the size of the counts.",0]]},
 {t:"epi",q:"Why does restricting to winter Tuesdays reduce the variance-to-mean ratio of daily visits?",o:[["Because there are fewer days","Fewer days make the estimate noisier, but don't reduce overdispersion on their own.",0],["Because it removes variation due to season and day of week, which the Poisson model doesn't know about","Overdispersion is largely unmodeled heterogeneity. Accounting for it, by restriction or regression, brings counts closer to Poisson.",1],["Because Tuesdays are always quiet","The level changes, but the ratio falls because the days are more alike.",0],["Because winter visits are Poisson by definition","No calendar period is Poisson by definition.",0]]},
 {t:"stat",q:"For a normal distribution, the probability of a value within 1.96 standard deviations of the mean is about:",o:[["68%","That's for ±1 SD.",0],["95%","This is why 1.96 appears in so many 95% confidence intervals.",1],["99.7%","That's for ±3 SD.",0],["50%","Half the area lies within about ±0.67 SD.",0]]}]);
onTheme(()=>{drawRV();drawDist();drawNorm();drawOD();});
});
