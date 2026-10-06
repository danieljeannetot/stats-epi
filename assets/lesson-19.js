document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children;
const pc=(v,d)=>fmt(100*v,d===undefined?1:d)+"%";
function lbeta(a,b){return lgammaFn(a)+lgammaFn(b)-lgammaFn(a+b);}
const dbeta=(x,a,b)=>Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-lbeta(a,b));
function qbetaGrid(a,b,ps){const xs=[],cs=[];let c=0;for(let i=1;i<2000;i++){const x=i/2000;c+=dbeta(x,a,b)/2000;xs.push(x);cs.push(c);}return ps.map(p=>xs[Math.max(0,cs.findIndex(v=>v>=p*c))]);}
const hexRgb=h=>{h=h.trim();if(h.startsWith("#")){const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];}const m=h.match(/\d+/g);return m?m.slice(0,3).map(Number):[100,100,100];};

/* ---------- 19.1 ---------- */
const rB=makeRng(1919),order=kids.map((_,i)=>i).sort(()=>rB()-0.5);
function drawB(){const n=+$("bN").value,m=+$("bM").value/100,s=+$("bS").value;$("bNO").textContent=fmtInt(n);$("bMO").textContent=Math.round(100*m)+"%";$("bSO").textContent=s;
  const d=sum(order.slice(0,n).map(i=>kids[i].asthma)),a=m*s,b=(1-m)*s,ap=a+d,bp=b+n-d;
  const xs=[];for(let x=0.002;x<0.6;x+=0.002)xs.push(x);const pr=xs.map(x=>dbeta(x,a,b)),po=xs.map(x=>dbeta(x,ap,bp));
  let lk=xs.map(x=>n?Math.exp(d*Math.log(x)+(n-d)*Math.log(1-x)):1);const lm=Math.max.apply(null,lk),pm=Math.max.apply(null,po);lk=lk.map(v=>v/lm*pm);
  const ymax=Math.max(pm,Math.max.apply(null,pr.filter(isFinite)))*1.1,svg=clear($("bPlot")),F=frame(svg,520,270,{l:44,r:12,t:16,b:40},[0,0.6],[0,ymax]);
  xAxis(F,[0,0.1,0.2,0.3,0.4,0.5,0.6],"risk of asthma by age 8",v=>Math.round(100*v)+"%");txt(svg,F.m.l,10,"density",{});
  poly(F,xs,pr.map(v=>Math.min(v,ymax)),{stroke:css("--c-prior"),"stroke-width":2.2,"stroke-dasharray":"6 4"});if(n)poly(F,xs,lk,{stroke:css("--c-lik"),"stroke-width":2});poly(F,xs,po,{stroke:css("--c-post"),"stroke-width":2.8});
  const q=qbetaGrid(ap,bp,[0.025,0.5,0.975]),ph=n?d/n:NaN,se=n?Math.sqrt(ph*(1-ph)/n):NaN,truth=mean(kids.map(c=>c.asthma));
  $("bStats").innerHTML=[["data",d+" cases / "+fmtInt(n)],["posterior mean",pc(ap/(ap+bp))],["95% credible interval",pc(q[0])+" to "+pc(q[2])],["estimate d/n (95% CI)",n?pc(ph)+" ("+pc(Math.max(0,ph-1.96*se))+"–"+pc(ph+1.96*se)+")":"—"],["whole-cohort risk",pc(truth)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const wPrior=s/(s+n);
  setNow("bNow",(n===0?"With no data, the posterior is the prior.":"The posterior is Beta("+fmt(ap,1)+", "+fmt(bp,1)+"): the prior's "+fmt(a,1)+" \"cases\" and "+fmt(b,1)+" \"non-cases\" plus the "+d+" cases and "+(n-d)+" non-cases observed.")+" Its mean, "+pc(ap/(ap+bp))+", is a weighted average of the prior mean ("+Math.round(100*m)+"%) and the data"+(n?" ("+pc(ph)+")":"")+", with "+fmt(100*wPrior,0)+"% of the weight on the prior. "+(n>=500?"With this many children the data dominate, and the credible interval almost matches the confidence interval.":s>n?"The prior is worth more children than the data, so it dominates. Is that justified?":"As data accumulate, the prior's influence fades.")+" The credible interval means what people usually want a confidence interval to mean: given the prior and the data, there is a 95% probability that the risk lies in it.");
  $("bReport").innerHTML="With a Beta("+fmt(a,1)+", "+fmt(b,1)+") prior (mean "+Math.round(100*m)+"%, worth "+s+" children) and "+d+" cases among "+n+" children, the posterior median risk was <b>"+pc(q[1])+" (95% credible interval "+pc(q[0])+" to "+pc(q[2])+")</b>.";}
["bN","bM","bS"].forEach(id=>$(id).addEventListener("input",drawB));drawB();

/* ---------- the grid used in 19.2–19.4 ---------- */
const LK=DISTRICTS.find(d=>d.name==="Lakeside").id,WARM=A.rows.filter(r=>r.district_id===LK&&r.g===2&&[6,7,8].indexOf(+r.date.slice(5,7))>=0);
const E20=[4,11],BR=[-0.06,0.12],NA=70,NBt=90;
const aG=Array.from({length:NA},(_,i)=>Math.log(E20[0]+(E20[1]-E20[0])*(i+0.5)/NA)),bG=Array.from({length:NBt},(_,j)=>BR[0]+(BR[1]-BR[0])*(j+0.5)/NBt);
let LL=null,curN=0,sel={a:Math.log(8),b:0.02};
function computeLL(n){const d=WARM.slice(0,n),xs=d.map(r=>r.temp-20),ys=d.map(r=>r.visits),sy=sum(ys),sxy=sum(ys.map((y,i)=>y*xs[i]));
  LL=aG.map(a=>bG.map(b=>{let s=0;for(let i=0;i<xs.length;i++)s+=Math.exp(a+b*xs[i]);return a*sy+b*sxy-s;}));curN=n;}
function normMap(M){let mx=-Infinity;M.forEach(r=>r.forEach(v=>{if(v>mx)mx=v;}));return M.map(r=>r.map(v=>Math.exp(v-mx)));}
function drawMap(cv,P,col,opts){opts=opts||{};const ctx=cv.getContext("2d"),W=cv.width,H=cv.height,l=46,b=34,t=10,r=8,pw=W-l-r,ph=H-t-b;ctx.clearRect(0,0,W,H);
  const rgb=hexRgb(css(col)),bg=hexRgb(css("--c-panel"));for(let i=0;i<NA;i++)for(let j=0;j<NBt;j++){const v=P[i][j];if(v<0.002)continue;const a=Math.pow(v,0.6),c=[0,1,2].map(k=>Math.round(bg[k]*(1-a)+rgb[k]*a));
    ctx.fillStyle="rgb("+c.join(",")+")";const x0=Math.floor(l+j*pw/NBt),x1=Math.ceil(l+(j+1)*pw/NBt),y0=Math.floor(t+(NA-1-i)*ph/NA),y1=Math.ceil(t+(NA-i)*ph/NA);ctx.fillRect(x0,y0,x1-x0,y1-y0);}
  ctx.strokeStyle=css("--c-rule");ctx.strokeRect(l,t,pw,ph);ctx.fillStyle=css("--c-muted");ctx.font="11px "+getComputedStyle(document.body).fontFamily;
  [-0.05,0,0.05,0.1].forEach(v=>{const x=l+(v-BR[0])/(BR[1]-BR[0])*pw;ctx.fillText((v>0?"+":"")+Math.round(100*v)+"%",x-12,H-b+16);});
  [4,6,8,10].forEach(v=>{const y=t+ph-(v-E20[0])/(E20[1]-E20[0])*ph;if(y>t)ctx.fillText(String(v),l-22,y+4);});
  const x0=l+(0-BR[0])/(BR[1]-BR[0])*pw;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x0,t);ctx.lineTo(x0,t+ph);ctx.stroke();ctx.setLineDash([]);
  const toXY=(a,bb)=>[l+(bb-BR[0])/(BR[1]-BR[0])*pw,t+ph-(Math.exp(a)-E20[0])/(E20[1]-E20[0])*ph];
  if(opts.pts){ctx.fillStyle=css("--c-ink");opts.pts.forEach(p=>{const q=toXY(p.a,p.b);ctx.beginPath();ctx.arc(q[0],q[1],2,0,7);ctx.fill();});}
  if(opts.ring){const q=toXY(opts.ring.a,opts.ring.b);ctx.strokeStyle=css("--p2");ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(q[0],q[1],7,0,7);ctx.stroke();ctx.lineWidth=1;}
  cv.__inv=(px,py)=>{const bb=BR[0]+(px-l)/pw*(BR[1]-BR[0]),e=E20[0]+(t+ph-py)/ph*(E20[1]-E20[0]);return {a:Math.log(Math.max(E20[0],Math.min(E20[1],e))),b:Math.max(BR[0],Math.min(BR[1],bb))};};}
function scatterCurves(svgId,curves,title,colors){const n=curN,d=WARM.slice(0,n),svg=clear($(svgId)),F=frame(svg,520,260,{l:44,r:12,t:16,b:40},[15,32],[0,22]);yGrid(F,[0,5,10,15,20]);xAxis(F,[15,20,25,30],"temperature in Lakeside (°C)");txt(svg,F.m.l,10,title,{});
  d.forEach(r=>el("circle",{cx:F.X(r.temp),cy:F.Y(Math.min(22,r.visits)),r:2.6,fill:css("--c-lik"),"fill-opacity":0.6},svg));const xs=[15,20,25,32];
  curves.forEach((c,k)=>{const ts=[];for(let T=15;T<=32;T+=0.5)ts.push(T);poly(F,ts,ts.map(T=>Math.exp(c.a+c.b*(T-20))),{stroke:css(colors?colors(k):"--p2"),"stroke-width":c.w||2.4,"stroke-opacity":c.o||1});});return F;}

/* ---------- 19.2 ---------- */
function drawL(){const n=+$("lN").value;$("lNO").textContent=n;if(n!==curN)computeLL(n);const P=normMap(LL);drawMap($("lMap"),P,"--c-lik",{ring:sel});
  const ai=Math.max(0,Math.min(NA-1,Math.round((Math.exp(sel.a)-E20[0])/(E20[1]-E20[0])*NA-0.5))),bj=Math.max(0,Math.min(NBt-1,Math.round((sel.b-BR[0])/(BR[1]-BR[0])*NBt-0.5))),rel=P[ai][bj];
  let mi=0,mj=0;P.forEach((r,i)=>r.forEach((v,j)=>{if(v>P[mi][mj]){mi=i;mj=j;}}));const best={a:aG[mi],b:bG[mj]};
  scatterCurves("lCurve",[{a:best.a,b:best.b,w:1.6,o:0.5},{a:sel.a,b:sel.b}],"visits on each summer day (gray); your curve (orange), best curve (faint)",k=>k?"--p2":"--c-ink");
  setNow("lNow","Your point says: "+fmt(Math.exp(sel.a),1)+" visits on a 20°C day, changing by "+fmt(100*(Math.exp(sel.b)-1),1)+"% per °C. For each of the "+n+" days, that equation predicts an expected count, and the Poisson distribution gives the probability of the count actually observed. Multiplied together, the data are "+(rel>0.99?"<b>as likely as anywhere on the map</b>: you've found the peak.":"<b>"+(rel<1e-6?"more than a million":fmt(1/rel,rel>0.1?1:0))+" times less likely</b> than at the peak ("+fmt(Math.exp(best.a),1)+" visits, "+fmt(100*(Math.exp(best.b)-1),1)+"% per °C).")+" "+(n<40?"With few days the dark region is broad: many equations fit about equally well.":"With more days the dark region shrinks.")+" The tilt of the region shows that the two parameters trade off a little.");}
$("lN").addEventListener("input",()=>{drawL();drawP();drawD();});
$("lMap").addEventListener("click",e=>{const cv=$("lMap"),r=cv.getBoundingClientRect(),q=cv.__inv((e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height);sel=q;drawL();});

/* ---------- 19.3 ---------- */
let POST=null;
function drawP(){const m=+$("pM").value/100,s=+$("pS").value/100;$("pMO").textContent=fmt(100*m,2)+"%";$("pSO").textContent=fmt(100*s,2)+"%";
  const lpr=aG.map(a=>bG.map(b=>-0.5*Math.pow((a-Math.log(8))/1,2)-0.5*Math.pow((b-m)/s,2)));const Pr=normMap(lpr),Li=normMap(LL),lpo=LL.map((r,i)=>r.map((v,j)=>v+lpr[i][j]));POST=normMap(lpo);
  drawMap($("mPr"),Pr,"--c-prior");drawMap($("mLi"),Li,"--c-lik");drawMap($("mPo"),POST,"--c-post");
  const mb=t=>{let s1=0,s0=0;t.forEach(r=>r.forEach((v,j)=>{s1+=v*bG[j];s0+=v;}));return s1/s0;},bL=mb(Li),bP=mb(POST);
  $("pStats").innerHTML=[["likelihood centre, β",fmt(100*bL,2)+"% per °C"],["prior mean",fmt(100*m,2)+"%"],["posterior mean",fmt(100*bP,2)+"%"],["days of data",String(curN)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("pNow","The posterior (green) is the prior times the likelihood, rescaled. Its centre for β, "+fmt(100*bP,2)+"% per °C, lies between the prior's "+fmt(100*m,2)+"% and the likelihood's "+fmt(100*bL,2)+"%, "+(Math.abs(bP-bL)<Math.abs(bP-m)?"closer to the likelihood, because the data are more precise than the prior.":"closer to the prior, because the prior is more precise than these data.")+" "+(s<0.01?"A prior this narrow is a strong claim; with only "+curN+" days, it largely decides the answer.":"")+" Increase the days of data in 19.2 and the likelihood, and so the posterior, narrows toward the data's answer whatever the prior.");}
["pM","pS"].forEach(id=>$(id).addEventListener("input",()=>{drawP();drawD();}));

/* ---------- 19.4 ---------- */
let dSeed=1;
function drawD(){if(!POST)return;const r=makeRng(1900+dSeed),cells=[];let tot=0;POST.forEach((row,i)=>row.forEach((v,j)=>{if(v>1e-6){tot+=v;cells.push([i,j,tot]);}}));
  const da=(Math.log(E20[1])-Math.log(E20[0]))/NA,db=(BR[1]-BR[0])/NBt,draws=[];
  for(let s=0;s<400;s++){const u=r()*tot;let lo=0,hi=cells.length-1;while(lo<hi){const m=(lo+hi)>>1;if(cells[m][2]<u)lo=m+1;else hi=m;}const c=cells[lo];draws.push({a:aG[c[0]]+(r()-0.5)*0.02,b:bG[c[1]]+(r()-0.5)*db});}
  drawMap($("dMap"),POST,"--c-post",{pts:draws.slice(0,150)});
  scatterCurves("dCurve",draws.slice(0,80).map(d=>({a:d.a,b:d.b,w:1.2,o:0.25})),"80 curves, one per posterior draw",()=>"--c-post");
  const bs=draws.map(d=>d.b).sort((a,b)=>a-b),v30=draws.map(d=>Math.exp(d.a+10*d.b)).sort((a,b)=>a-b),ppos=mean(draws.map(d=>d.b>0?1:0));
  const dd=WARM.slice(0,curN),fq=glmFit(dd.map(r=>[1,r.temp-20]),dd.map(r=>r.visits),"poisson"),seq=fq.se[1]*Math.sqrt(Math.max(1,fq.phi));
  $("dStats").innerHTML=[["β, posterior median (95% CrI)",fmt(100*quantile(bs,0.5),2)+"% ("+fmt(100*quantile(bs,0.025),2)+" to "+fmt(100*quantile(bs,0.975),2)+")"],["P(β > 0 | data)",fmt(ppos,3)],["expected visits at 30°C",fmt(quantile(v30,0.5),1)+" ("+fmt(quantile(v30,0.025),1)+"–"+fmt(quantile(v30,0.975),1)+")"],["frequentist estimate (95% CI)",fmt(100*fq.beta[1],2)+"% ("+fmt(100*(fq.beta[1]-1.96*seq),2)+" to "+fmt(100*(fq.beta[1]+1.96*seq),2)+")"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("dNow","Each dot on the map is one posterior draw, sampled in proportion to the posterior's height; each draw gives one curve. Where the curves agree, we're certain; where they fan out, at hot temperatures with few days, we aren't. Summaries come from counting draws: the middle 95% of β values is the credible interval, and the share of draws with β > 0, <b>"+fmt(ppos,3)+"</b>, is the posterior probability that heat increases visits in this model. The frequentist estimate, from the same equation without the prior, is close"+(curN<40?", though with so few days the prior pulls the Bayesian answer noticeably.":".")+" Note that the frequentist interval uses a quasi-Poisson correction for overdispersion, which this simple Poisson posterior does not include; the next lessons address that.");
  $("dReport").innerHTML="Each 1°C increase in temperature on summer days was associated with a <b>"+fmt(100*quantile(bs,0.5),1)+"% change in daily visits among Lakeside residents aged 65+ (95% credible interval "+fmt(100*quantile(bs,0.025),1)+" to "+fmt(100*quantile(bs,0.975),1)+"%)</b>; posterior probability of a harmful effect "+fmt(ppos,2)+" (Poisson model; prior β ~ Normal("+fmt(+$("pM").value,2)+"%, "+fmt(+$("pS").value,2)+"%)).";}
$("dRe").addEventListener("click",()=>{dSeed++;drawD();});

computeLL(150);drawL();drawP();drawD();
buildQuiz("quizzes",[
 {t:"stat",q:"A Beta(2, 18) prior for a risk is updated with 7 cases among 50 children. The posterior is:",o:[["Beta(7, 43)","That ignores the prior.",0],["Beta(9, 61)","Add cases to a and non-cases to b: 2 + 7 and 18 + 43.",1],["Beta(9, 18)","The non-cases must be added too.",0],["Beta(14, 100)","There's no doubling.",0]]},
 {t:"stat",q:"The posterior distribution of β is proportional to:",o:[["The likelihood plus the prior","They multiply (or their logs add).",0],["The likelihood times the prior","Bayes' rule: posterior ∝ likelihood × prior.",1],["The prior alone, once data are seen","The data enter through the likelihood.",0],["The probability of β given the prior only","That's just the prior.",0]]},
 {t:"epi",q:"A Bayesian and a frequentist analysis of the same heat model, with lots of data and a weakly informative prior, give:",o:[["Very different estimates, because the methods differ","With ample data and weak priors, the numbers are usually close.",0],["Similar numbers, interpreted differently: a credible interval vs a confidence interval","The model equation and likelihood are shared.",1],["Identical numbers with identical interpretations","The interpretations differ.",0],["Bayesian intervals that are always wider","Not in general.",0]]},
 {t:"stat",q:"The share of posterior draws with β > 0 is 0.97. This is:",o:[["A p-value of 0.03","A p-value is a different probability, computed under the null.",0],["The posterior probability that β is positive, given the model, prior and data","Posterior probabilities are computed by counting draws.",1],["The power of the study","Power is a pre-data property.",0],["The probability that the data arose by chance","That's a common misreading of p-values, not this.",0]]},
 {t:"stat",q:"With a narrow prior centered at zero and only 15 days of data, the posterior for β is likely to be:",o:[["Close to the maximum likelihood estimate","With little data, a strong prior dominates.",0],["Pulled strongly toward zero","The prior is more precise than the data.",1],["Undefined","It's well defined.",0],["Identical to the prior","Data still move it somewhat.",0]]},
 {t:"stat",q:"Why plug posterior draws into the model equation?",o:[["To check the sampler converged","That's done with diagnostics (Lesson 21).",0],["To turn uncertainty about parameters into uncertainty about quantities of interest, such as expected visits at 30°C","Any derived quantity gets a posterior by computing it on every draw.",1],["Because the posterior mean of the curve equals the curve at the posterior mean","Not for nonlinear functions.",0],["To remove the prior's influence","The draws reflect the prior.",0]]}]);
onTheme(()=>{drawB();drawL();drawP();drawD();});
});
