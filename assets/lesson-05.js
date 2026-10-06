document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children;
const LF=[0];for(let k=1;k<3000;k++)LF.push(LF[k-1]+Math.log(k));
const llBin=(p,d,n)=>(d>0?d*Math.log(p):0)+(n-d>0?(n-d)*Math.log(1-p):0);
const pc=(v,d)=>fmt(100*v,d===undefined?1:d)+"%";

/* ---------- 5.1 ---------- */
let seed=1,sampleD=0;
function sampleKids(){const n=+$("lN").value,r=makeRng(500+seed);let d=0;for(let i=0;i<n;i++)d+=kids[Math.floor(r()*kids.length)].asthma;sampleD=d;}
function drawL(){const n=+$("lN").value,p0=+$("lPi").value/100,d=sampleD,useLog=$("lLog").checked;$("lNO").textContent=n;$("lPiO").textContent=pc(p0,0);
  const ph=Math.min(0.999,Math.max(0.001,d/n)),llmax=llBin(ph,d,n),xs=[];for(let p=0.002;p<=0.45;p+=0.002)xs.push(p);
  const ys=xs.map(p=>useLog?Math.max(-12,llBin(p,d,n)-llmax):Math.exp(llBin(p,d,n)-llmax));
  const svg=clear($("lik")),F=frame(svg,520,270,{l:44,r:14,t:16,b:40},[0,0.45],useLog?[-12,0.5]:[0,1.1]);
  yGrid(F,useLog?[-12,-8,-4,0]:[0,0.25,0.5,0.75,1],v=>useLog?String(v):fmt(v,2));xAxis(F,[0,0.1,0.2,0.3,0.4],"risk π",v=>Math.round(100*v)+"%");
  txt(svg,F.m.l,10,useLog?"log-likelihood relative to its peak":"likelihood relative to its peak (peak = 1)",{});
  poly(F,xs,ys,{stroke:css("--c-lik"),"stroke-width":2.4});
  el("line",{x1:F.X(ph),x2:F.X(ph),y1:F.m.t,y2:F.Y(F.yr[0]),stroke:css("--p2"),"stroke-dasharray":"4 3"},svg);txt(svg,F.X(ph)+4,F.m.t+12,"MLE "+pc(ph),{style:"fill:"+css("--p2")});
  const rel=llBin(p0,d,n)-llmax,yv=useLog?Math.max(-12,rel):Math.exp(rel);
  el("line",{x1:F.X(p0),x2:F.X(p0),y1:F.Y(F.yr[0]),y2:F.Y(yv),stroke:css("--p1"),"stroke-width":2},svg);el("circle",{cx:F.X(p0),cy:F.Y(yv),r:6,fill:css("--p1")},svg);
  const truth=mean(kids.map(c=>c.asthma));
  $("lStats").innerHTML=[["cases / children",d+" / "+n],["MLE",pc(ph)],["L(candidate) ÷ L(MLE)",rel<-20?"< 10⁻⁸":fmt(Math.exp(rel),3)],["true risk (simulation)",pc(truth)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("lNow","The sample has <b>"+d+" cases among "+n+" children</b>. For each possible risk π, the curve shows how probable exactly this outcome would be, relative to the most probable value. The peak is at "+d+"/"+n+" = <b>"+pc(ph)+"</b>, the maximum likelihood estimate. At your candidate π = "+pc(p0,0)+", the data are "+(rel>-0.005?"about as probable as at the peak.":(rel<-20?"essentially impossible: ":fmt(Math.exp(-rel),Math.exp(-rel)<10?1:0)+" times less probable than at the peak.")+"")+" Increase n and the curve narrows: more data rule out more values of π."+(useLog?" On the log scale, the curve is close to a parabola near its peak; section 5.3 uses that shape to get the standard error.":""));
  $("lReport").innerHTML="Of "+n+" children, "+d+" developed asthma by age 8: an estimated risk of <b>"+pc(ph)+"</b> (maximum likelihood estimate, d/n).";}
["lN"].forEach(id=>$(id).addEventListener("input",()=>{sampleKids();drawL();}));$("lPi").addEventListener("input",drawL);$("lLog").addEventListener("change",drawL);
$("lNew").addEventListener("click",()=>{seed++;sampleKids();drawL();});sampleKids();drawL();

/* ---------- 5.2 ---------- */
$("pD").innerHTML=DISTRICTS.map(d=>"<option value='"+d.id+"'"+(d.name==="Old Town"?" selected":"")+">"+d.name+"</option>").join("");
function drawP(){const id=+$("pD").value,n=+$("pN").value,lam=+$("pL").value;$("pNO").textContent=n;$("pLO").textContent=fmt(lam,1);
  const y=A.rows.filter(r=>r.district_id===id&&r.g===2).slice(0,n).map(r=>r.visits),lh=mean(y);
  const lp=k=>k*Math.log(lam)-lam-LF[k],ll=l=>sum(y.map(k=>k*Math.log(l)-l-LF[k]));
  let svg=clear($("pBars")),pr=y.map(k=>Math.exp(lp(k))),pm=Math.max(0.15,Math.max.apply(null,pr)*1.15),F=frame(svg,520,200,{l:44,r:14,t:16,b:30},[-0.5,n-0.5],[0,pm]);
  yGrid(F,niceTicks(0,pm,3),v=>fmt(v,2));txt(svg,F.m.l,10,"each day's probability of its observed count, if the rate were λ = "+fmt(lam,1),{});
  const w=Math.max(1,F.X(1)-F.X(0)-1);pr.forEach((p,i)=>el("rect",{x:F.X(i)-w/2,y:F.Y(p),width:w,height:F.Y(0)-F.Y(p),fill:css("--c-lik"),"fill-opacity":0.8},svg));
  txt(svg,(F.m.l+F.w-F.m.r)/2,195,"days 1 to "+n,{"text-anchor":"middle"});
  svg=clear($("pLik"));const lo=1,hi=60,xs=[];for(let l=lo;l<=hi;l+=0.25)xs.push(l);const lmax=ll(lh),ys=xs.map(l=>Math.max(-40,ll(l)-lmax));
  F=frame(svg,520,220,{l:44,r:14,t:16,b:40},[lo,hi],[-40,2]);yGrid(F,[-40,-30,-20,-10,0]);xAxis(F,[1,10,20,30,40,50,60],"rate λ (visits per day)");txt(svg,F.m.l,10,"log-likelihood relative to its peak",{});
  poly(F,xs,ys,{stroke:css("--c-lik"),"stroke-width":2.4});el("line",{x1:F.X(lh),x2:F.X(lh),y1:F.m.t,y2:F.Y(-40),stroke:css("--p2"),"stroke-dasharray":"4 3"},svg);
  const cur=Math.max(-40,ll(lam)-lmax);el("circle",{cx:F.X(lam),cy:F.Y(cur),r:6,fill:css("--p1")},svg);
  const se=Math.sqrt(lh/n);
  $("pStats").innerHTML=[["days",String(n)],["MLE λ̂ = mean",fmt(lh,2)],["log-lik at λ",fmt(ll(lam),1)],["SE of λ̂",fmt(se,2)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("pNow","Under a rate of λ = "+fmt(lam,1)+", each bar shows how probable that day's actual count was. The likelihood multiplies all "+n+" bars; on the log scale they add, to "+fmt(ll(lam),1)+". "+(Math.abs(lam-lh)<0.3?"You're at the peak: λ = "+fmt(lh,1)+", the mean of the "+n+" counts, makes the data most probable.":"The best value is λ̂ = "+fmt(lh,1)+", the mean count; your λ is "+fmt(lmax-ll(lam),1)+" log-units worse. "+(lam<lh?"With λ too low, the busy days become improbable and their bars shrink.":"With λ too high, the quiet days become improbable."))+" Add more days and the curve narrows: the standard error, √(λ̂/n) = "+fmt(se,2)+", falls with √n.");
  $("pReport").innerHTML=AGE_GROUPS[2]+" residents of "+DISTRICTS[id-1].name+" made a mean of <b>"+fmt(lh,1)+" emergency visits per day</b> (95% CI "+fmt(lh-1.96*se,1)+" to "+fmt(lh+1.96*se,1)+") over the first "+n+" days of 2020, assuming Poisson variation.";}
["pD","pN","pL"].forEach(id=>$(id).addEventListener("input",drawP));drawP();

/* ---------- 5.3 ---------- */
function likInt(d,n,ph){const ll0=llBin(ph,d,n),f=p=>ll0-llBin(p,d,n)-1.92;let lo=1e-6,hi=ph;if(d===0)return [0,1-Math.pow(Math.exp(-1.92),1/n)];
  for(let i=0;i<80;i++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}const L=(lo+hi)/2;lo=ph;hi=1-1e-6;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(f(m)>0)hi=m;else lo=m;}return [L,(lo+hi)/2];}
function drawC(){let d=+$("cD").value,n=+$("cN").value;if(d>n){d=n;$("cD").value=n;}$("cDO").textContent=d;$("cNO").textContent=n;
  const ph=Math.max(1e-4,Math.min(1-1e-4,d/n)),se=Math.sqrt(ph*(1-ph)/n),wl=ph-1.96*se,wu=ph+1.96*se,li=likInt(d,n,d/n),ll0=llBin(ph,d,n);
  const xmax=Math.min(1,Math.max(0.3,ph+5*se,li[1]*1.3)),xs=[];for(let p=xmax/400;p<xmax;p+=xmax/400)xs.push(p);
  const svg=clear($("curv")),F=frame(svg,520,270,{l:44,r:14,t:16,b:40},[0,xmax],[-6,0.5]);yGrid(F,[-6,-4,-2,0]);xAxis(F,niceTicks(0,xmax,5),"risk π",v=>fmt(100*v,0)+"%");txt(svg,F.m.l,10,"log-likelihood relative to its peak",{});
  poly(F,xs,xs.map(p=>Math.max(-6,llBin(p,d,n)-ll0)),{stroke:css("--c-lik"),"stroke-width":2.4});
  if(d>0&&d<n)poly(F,xs,xs.map(p=>-0.5*(p-ph)*(p-ph)/(se*se)),{stroke:css("--p1"),"stroke-width":1.6,"stroke-dasharray":"5 4"});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(-1.92),y2:F.Y(-1.92),stroke:css("--p2"),"stroke-dasharray":"4 3"},svg);
  const bar=(a,b,y,col)=>el("rect",{x:F.X(Math.max(0,a)),y:y,width:Math.max(1,F.X(Math.min(xmax,b))-F.X(Math.max(0,a))),height:6,fill:css(col)},svg);
  bar(li[0],li[1],F.Y(-6)-14,"--p2");if(d>0&&d<n)bar(wl,wu,F.Y(-6)-24,"--p1");
  $("cStats").innerHTML=[["estimate",pc(d/n)],["SE",d>0&&d<n?pc(se,2):"—"],["Wald 95% CI",d>0&&d<n?pc(wl)+" to "+pc(wu):"undefined"],["likelihood 95% CI",pc(li[0])+" to "+pc(li[1])]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  let msg="With <b>"+d+" cases in "+n+" children</b>, the estimate is "+pc(d/n)+". ";
  if(d===0)msg+="With zero cases, the curvature at the peak is undefined, so the Wald interval collapses to a single point at 0%, which is absurd. The likelihood interval still works: up to "+pc(li[1])+" remains plausible.";
  else{msg+="The dashed blue parabola matches the log-likelihood's curvature at the peak; it gives SE = √(π̂(1 − π̂)/n) = "+pc(se,2)+" and the Wald interval (blue bar). The orange bar is the likelihood interval: all values within 1.92 units of the peak. ";
    msg+=wl<0?"Here the Wald interval goes below zero, an impossible risk. The likelihood interval stays within 0–100% and is asymmetric, like the curve.":Math.abs((li[1]-ph)-(ph-li[0]))>0.25*(li[1]-li[0])?"The likelihood is lopsided, so the two intervals disagree; trust the likelihood interval.":"With this many cases the log-likelihood is nearly a parabola, and the two intervals agree closely.";}
  setNow("cNow",msg);
  $("cReport").innerHTML="Risk "+pc(d/n)+" ("+d+"/"+n+"; <b>95% CI "+pc(li[0])+" to "+pc(li[1])+"</b>, likelihood-based).";}
["cD","cN"].forEach(id=>$(id).addEventListener("input",drawC));drawC();

/* ---------- 5.4 ---------- */
function drawR(){let d=+$("rD").value,n=+$("rN").value;if(d>n)d=n;const a=+$("rA").value/100,b=+$("rB").value/100;
  $("rDO").textContent=d;$("rNO").textContent=n;$("rAO").textContent=pc(a,0);$("rBO").textContent=pc(b,0);
  const ph=Math.max(1e-4,d/n),ll0=llBin(ph,d,n),xs=[];for(let p=0.002;p<=0.45;p+=0.002)xs.push(p);
  const svg=clear($("lr")),F=frame(svg,520,240,{l:44,r:14,t:16,b:40},[0,0.45],[0,1.1]);yGrid(F,[0,0.5,1],v=>fmt(v,1));xAxis(F,[0,0.1,0.2,0.3,0.4],"risk π",v=>Math.round(100*v)+"%");
  txt(svg,F.m.l,10,"likelihood relative to its peak",{});poly(F,xs,xs.map(p=>Math.exp(llBin(p,d,n)-ll0)),{stroke:css("--c-lik"),"stroke-width":2.4});
  [[a,"--p1","1"],[b,"--p2","2"]].forEach(h=>{const y=Math.exp(llBin(h[0],d,n)-ll0);el("line",{x1:F.X(h[0]),x2:F.X(h[0]),y1:F.Y(0),y2:F.Y(y),stroke:css(h[1]),"stroke-width":2.4},svg);el("circle",{cx:F.X(h[0]),cy:F.Y(y),r:6,fill:css(h[1])},svg);txt(svg,F.X(h[0])+5,F.Y(y)-6,"H"+h[2],{style:"fill:"+css(h[1])+";font-weight:600"});});
  const lr=Math.exp(llBin(a,d,n)-llBin(b,d,n)),big=lr>=1?lr:1/lr,fav=lr>=1?"hypothesis 1":"hypothesis 2";
  const lab=big<1.5?"essentially no preference":big<8?"weak support":big<32?"fairly strong support":"strong support";
  $("rStats").innerHTML=[["L(H1) ÷ L(H2)",lr>1e4?"> 10,000":lr<1e-4?"< 0.0001":fmt(lr,lr<10?2:0)],["favors",big<1.5?"neither":fav],["strength",lab]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("rNow","The data ("+d+" cases in "+n+" children) are "+(big>1e4?"more than 10,000":fmt(big,big<10?1:0))+" times more probable if the risk is "+(lr>=1?pc(a,0):pc(b,0))+" than if it is "+(lr>=1?pc(b,0):pc(a,0))+": "+lab+" for "+fav+", using Royall's benchmarks of 8 and 32. The ratio is just the ratio of the two bar heights. Notice that it uses only the data observed, and says nothing about how plausible either value was beforehand; adding that is what a Bayesian prior does.");}
["rD","rN","rA","rB"].forEach(id=>$(id).addEventListener("input",drawR));drawR();

/* ---------- quiz ---------- */
buildQuiz("quizzes",[
 {t:"stat",q:"In a sample of 200 children, 26 develop asthma. The maximum likelihood estimate of the risk is:",o:[["26","That's the number of cases, not the risk.",0],["13%","The MLE of a binomial probability is d/n = 26/200.",1],["The value that maximizes the probability of π","The MLE maximizes the probability of the data, not of π.",0],["It depends on the prior","Maximum likelihood uses no prior.",0]]},
 {t:"stat",q:"Two studies estimate the same risk. Study A's log-likelihood is sharply peaked, study B's is flat. Which is true?",o:[["A has the larger standard error","Sharp curvature means more information and a smaller SE.",0],["A has the smaller standard error","SE = 1/√(curvature). A sharper peak means a more precise estimate.",1],["Their standard errors are equal if their MLEs are equal","The MLE locates the peak; curvature sets the SE.",0],["The flat likelihood means study B is biased","Flatness reflects imprecision, not bias.",0]]},
 {t:"stat",q:"A study observes 0 cases in 40 children. What happens to the Wald interval?",o:[["It gives a sensible interval from 0% upward","With π̂ = 0 the estimated SE is 0, so the Wald interval collapses to [0, 0].",0],["It collapses to a single point at 0%, which is clearly wrong","The likelihood interval still gives a plausible upper limit, around 4.7% here.",1],["It is wider than the likelihood interval","It's degenerate, not wider.",0],["It can't be computed, so no interval is possible","Likelihood-based (or exact) intervals remain available.",0]]},
 {t:"epi",q:"The likelihood ratio for risk 15% versus 10% is 9 given the data. This means:",o:[["There is a 90% probability that the risk is 15%","Likelihood ratios aren't probabilities of hypotheses; that would need a prior.",0],["The data are 9 times more probable if the risk is 15% than if it is 10%","That is exactly what a likelihood ratio measures: fairly strong support by Royall's benchmarks.",1],["The risk is 9 times higher than 10%","The ratio compares the probability of the data, not the risks.",0],["p = 1/9","A likelihood ratio isn't a p-value.",0]]},
 {t:"stat",q:"For Poisson counts over n days, the MLE of the rate λ is:",o:[["The maximum daily count","The MLE uses all days.",0],["The mean daily count","Setting the derivative of Σ(y log λ − λ) to zero gives λ̂ = ȳ.",1],["The median daily count","The median isn't the MLE for a Poisson rate.",0],["The variance of the counts","For Poisson data the variance estimates λ too, but the MLE is the mean.",0]]},
 {t:"stat",q:"Why do we work with the log-likelihood rather than the likelihood?",o:[["Because the log-likelihood has a different maximum","The log is increasing, so the maximum is at the same place.",0],["Because products over observations become sums, which are easier to compute and to differentiate","This is also why numbers don't underflow to zero with many observations.",1],["Because the log-likelihood is a probability","Neither the likelihood nor its log is a probability for the parameter.",0],["Because it removes the need for a model","The log-likelihood still comes from a model.",0]]}]);
onTheme(()=>{drawL();drawP();drawC();drawR();});
});
