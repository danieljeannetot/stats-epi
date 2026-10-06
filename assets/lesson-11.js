document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),D=A.days,ND=D.length;
const city=new Array(ND).fill(0);A.rows.forEach(r=>city[r.t]+=r.visits);
const T03=D.map((d,i)=>{let s=0,n=0;for(let l=0;l<=3;l++){if(i-l>=0){s+=D[i-l].temp_city;n++;}}return s/n;});
const adj=D.map(d=>[Math.sin(2*Math.PI*d.doy/365.25),Math.cos(2*Math.PI*d.doy/365.25),Math.sin(4*Math.PI*d.doy/365.25),Math.cos(4*Math.PI*d.doy/365.25),d.t/365.25].concat([1,2,3,4,5,6].map(j=>d.dow===j?1:0)));
const TG=[];for(let t=-8;t<=30;t+=0.25)TG.push(t);
const lo=quantile(T03,0.005),hi=quantile(T03,0.995);
/* fit a model whose temperature part is given by basis(T) -> array; returns curve on TG relative to its minimum, with 95% CI */
function fitCurve(basis,penFn){const X=D.map((d,i)=>[1].concat(basis(T03[i])).concat(adj[i])),p=X[0].length,q=basis(10).length;
  let pen=null;if(penFn){pen=[];for(let a=0;a<p;a++)pen.push(new Array(p).fill(0));penFn(pen);}
  const f=glmFit(X,city,"poisson",{penalty:pen}),phi=Math.max(1,f.phi),bf=f.beta.slice(1,1+q),V=f.vcov.slice(1,1+q).map(r=>r.slice(1,1+q));
  const B=TG.map(basis),eta=B.map(b=>b.reduce((s,v,k)=>s+v*bf[k],0));const inR=TG.map(t=>t>=lo&&t<=hi);
  let im=0;eta.forEach((e,i)=>{if(inR[i]&&e<eta[im])im=i;});if(!inR[im])im=TG.findIndex(t=>t>=lo);
  const band=B.map((b,i)=>{const dv=b.map((v,k)=>v-B[im][k]);let s=0;for(let a=0;a<q;a++)for(let c=0;c<q;c++)s+=dv[a]*V[a][c]*dv[c];return Math.sqrt(Math.max(0,s*phi));});
  return {rr:eta.map(e=>Math.exp(e-eta[im])),lo:eta.map((e,i)=>Math.exp(e-eta[im]-1.96*band[i])),hi:eta.map((e,i)=>Math.exp(e-eta[im]+1.96*band[i])),mmt:TG[im],aic:f.aic,edf:f.edf,phi:f.phi,qaic:-2*f.loglik/phi+2*f.edf,fit:f,q:q};}
function plotCurve(svgId,res,opts){opts=opts||{};const svg=clear($(svgId)),F=frame(svg,520,300,{l:44,r:12,t:16,b:40},[-8,30],[0.85,1.6]);
  yGrid(F,[0.9,1,1.1,1.2,1.3,1.4,1.5],v=>fmt(v,1));xAxis(F,[-5,0,5,10,15,20,25,30],"mean temperature, lags 0–3 (°C)");txt(svg,F.m.l,10,"rate ratio relative to the minimum-risk temperature",{});
  el("rect",{x:F.m.l,y:F.m.t,width:F.X(lo)-F.m.l,height:F.Y(0.85)-F.m.t,fill:css("--c-soft")},svg);el("rect",{x:F.X(hi),y:F.m.t,width:F.w-F.m.r-F.X(hi),height:F.Y(0.85)-F.m.t,fill:css("--c-soft")},svg);
  const idx=TG.map((_,i)=>i);
  el("polygon",{points:idx.map(i=>F.X(TG[i])+","+F.Y(Math.min(1.6,Math.max(0.85,res.hi[i])))).concat(idx.slice().reverse().map(i=>F.X(TG[i])+","+F.Y(Math.min(1.6,Math.max(0.85,res.lo[i]))))).join(" "),fill:css(opts.col||"--p1"),"fill-opacity":0.15},svg);
  poly(F,TG,res.rr,{stroke:css(opts.col||"--p1"),"stroke-width":2.6});el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(1),y2:F.Y(1),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  el("line",{x1:F.X(res.mmt),x2:F.X(res.mmt),y1:F.Y(1),y2:F.Y(0.85),stroke:css("--p2"),"stroke-width":1.6},svg);txt(svg,F.X(res.mmt)+4,F.Y(0.87),"minimum "+fmt(res.mmt,1)+"°C",{style:"fill:"+css("--p2")});
  txt(svg,F.X(-7.5),F.Y(1.57),"sparse data",{});if(opts.extra)opts.extra(F,svg);return F;}
const at=(res,t)=>{const i=TG.findIndex(x=>x>=t);return {rr:res.rr[i],lo:res.lo[i],hi:res.hi[i]};};
const p99=quantile(T03,0.99),p01=quantile(T03,0.01);
function stats(id,res,extra){const h=at(res,p99),c=at(res,p01);$(id).innerHTML=[["RR at 99th percentile ("+fmt(p99,1)+"°C)",fmt(h.rr,2)+" ("+fmt(h.lo,2)+"–"+fmt(h.hi,2)+")"],["RR at 1st percentile ("+fmt(p01,1)+"°C)",fmt(c.rr,2)+" ("+fmt(c.lo,2)+"–"+fmt(c.hi,2)+")"],["temperature parameters",fmt(res.edf-12,1)],["AIC",fmtInt(res.aic)]].concat(extra||[]).map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");}

/* ---------- 11.1 categories ---------- */
function drawC(){const K=+$("cK").value,typ=$("cT").value;$("cKO").textContent=K;
  const cuts=[];for(let k=1;k<K;k++)cuts.push(typ==="q"?quantile(T03,k/K):lo+(hi-lo)*k/K);
  const cat=t=>{let c=0;while(c<cuts.length&&t>cuts[c])c++;return c;},basis=t=>{const c=cat(t),o=new Array(K-1).fill(0);if(c>0)o[c-1]=1;return o;};
  const res=fitCurve(basis);
  plotCurve("cPlot",res,{col:"--p2",extra:(F,svg)=>cuts.forEach(c=>el("line",{x1:F.X(c),x2:F.X(c),y1:F.m.t,y2:F.Y(0.85),stroke:css("--c-muted"),"stroke-dasharray":"2 4"},svg))});
  stats("cStats",res);
  const jump=[];cuts.forEach(c=>{const a=at(res,c-0.3),b=at(res,c+0.3);jump.push(Math.abs(b.rr-a.rr));});const mj=Math.max.apply(null,jump),ci=jump.indexOf(mj);
  setNow("cNow","With "+K+" categories, the curve is a staircase. The largest jump is at the cut-point "+fmt(cuts[ci],1)+"°C: a day at "+fmt(cuts[ci]-0.3,1)+"°C and a day at "+fmt(cuts[ci]+0.3,1)+"°C get rate ratios that differ by "+fmt(mj,2)+", although they are almost the same temperature. Within each step, every day is treated alike. "+(typ==="q"?"Quantile cut-points put most categories in the dense middle of the distribution and lump all the extreme days, where the effects are, into the outer categories.":"Equal-width bands give the extremes their own categories, but with few days each, so their estimates are noisy.")+" More categories trace the shape better, but each estimate rests on fewer days. AIC: "+fmtInt(res.aic)+".");}
["cK","cT"].forEach(id=>$(id).addEventListener("input",drawC));drawC();

/* ---------- 11.2 polynomials ---------- */
function drawP(){const d=+$("pD").value;$("pDO").textContent=d;const basis=t=>{const x=(t-10)/15,o=[];for(let k=1;k<=d;k++)o.push(Math.pow(x,k));return o;};
  const res=fitCurve(basis);plotCurve("pPlot",res,{col:"--p3"});stats("pStats",res);
  const edge=at(res,-7.5),h=at(res,29.5);
  setNow("pNow",d===1?"A straight line on the log scale: temperature can only increase or decrease visits steadily. It cannot capture a U shape, so the \"minimum\" sits at the edge of the data.":"A polynomial of degree "+d+". "+(d===2?"A parabola captures the U shape, but forces it to be symmetric around its minimum, "+fmt(res.mmt,1)+"°C.":"Higher degrees bend more freely, but watch the edges: at −7.5°C the curve reaches "+fmt(edge.rr,2)+" ("+fmt(edge.lo,2)+"–"+fmt(edge.hi,2)+"), and at 29.5°C "+fmt(h.rr,2)+". Because every coefficient affects the whole curve, the few extreme days have little say, and the tails swing in whatever direction the middle of the data dictates.")+" AIC: "+fmtInt(res.aic)+".");}
$("pD").addEventListener("input",drawP);drawP();

/* ---------- 11.3 splines ---------- */
function drawS(){const K=+$("sK").value;$("sKO").textContent=K;const kn=rcsKnots(T03,K),basis=t=>rcsRow(t,kn).map((v,i)=>i===0?(v-10)/10:v/10);
  const res=fitCurve(basis);plotCurve("sPlot",res,{col:"--p1",extra:(F,svg)=>kn.forEach(k=>{el("line",{x1:F.X(k),x2:F.X(k),y1:F.Y(0.86),y2:F.Y(0.9),stroke:css("--p1"),"stroke-width":3},svg);})});
  stats("sStats",res,[["knots at (°C)",kn.map(k=>fmt(k,1)).join(", ")]]);
  const svg=clear($("sBasis")),F=frame(svg,520,170,{l:44,r:12,t:16,b:30},[-8,30],[-1,1]);xAxis(F,[-5,0,5,10,15,20,25,30],null);txt(svg,F.m.l,10,"the basis functions (scaled); the fitted curve is their weighted sum",{});
  const cols=["--p1","--p2","--p3","--p4","--p5","--c-lik"],Bs=TG.map(basis);for(let k=0;k<Bs[0].length;k++){const v=Bs.map(b=>b[k]),m=Math.max.apply(null,v.map(Math.abs))||1;poly(F,TG,v.map(x=>x/m),{stroke:css(cols[k%cols.length]),"stroke-width":1.8});}
  const h=at(res,p99);
  setNow("sNow","A natural cubic spline with "+K+" knots (blue ticks), placed at quantiles of temperature. It uses "+(K-1)+" parameters for temperature, built from the "+(K-1)+" basis functions below: the first is a straight line, the others add bends between the knots. The curve is U-shaped with its minimum at <b>"+fmt(res.mmt,1)+"°C</b>, and beyond the outer knots it is forced to be straight, which keeps the tails sensible. At the 99th percentile, the rate ratio is <b>"+fmt(h.rr,2)+"</b> ("+fmt(h.lo,2)+"–"+fmt(h.hi,2)+"). "+(K>=6?"With many knots the curve starts to follow noise; compare AIC across choices.":"Add knots for more flexibility.")+" AIC: "+fmtInt(res.aic)+".");
  $("sReport").innerHTML="Compared with the minimum-risk temperature of "+fmt(res.mmt,1)+"°C, a 4-day mean temperature at the 99th percentile ("+fmt(p99,1)+"°C) was associated with a <b>rate ratio of "+fmt(h.rr,2)+" (95% CI "+fmt(h.lo,2)+" to "+fmt(h.hi,2)+")</b> for emergency visits (natural cubic spline, "+K+" knots; quasi-Poisson regression adjusted for season, trend and day of week).";}
$("sK").addEventListener("input",drawS);drawS();

/* ---------- 11.4 penalized spline ---------- */
const kn12=rcsKnots(T03,12),basis12=t=>rcsRow(t,kn12).map((v,i)=>i===0?(v-10)/10:v/10);
function penFor(lam){return P=>{for(let k=2;k<=11;k++)P[k][k]=lam;};}
function drawG(){const L=+$("gL").value,lam=Math.pow(10,L);$("gLO").textContent="10^"+fmt(L,2);
  const res=fitCurve(basis12,penFor(lam));plotCurve("gPlot",res,{col:"--p4",extra:(F,svg)=>kn12.forEach(k=>el("line",{x1:F.X(k),x2:F.X(k),y1:F.Y(0.86),y2:F.Y(0.9),stroke:css("--p4"),"stroke-width":2},svg))});
  stats("gStats",res,[["effective df for temperature",fmt(res.edf-12,1)+" of 11"]]);
  const edfT=res.edf-12;
  setNow("gNow","The spline has 12 knots and could use 11 parameters, but the penalty (here 10<sup>"+fmt(L,2)+"</sup>) shrinks its wiggles. It uses <b>"+fmt(edfT,1)+" effective degrees of freedom</b>. "+(edfT>8?"With a small penalty the curve follows the noise in the data.":edfT<2?"With a large penalty the bends are shrunk away and the curve approaches a straight line on the log scale, which misses the U shape.":"This penalty keeps the main shape and smooths away noise.")+" AIC: "+fmtInt(res.aic)+". Press the button to let AIC choose the penalty: that is what <code>mgcv::gam()</code> does automatically, with criteria such as REML.");}
$("gL").addEventListener("input",drawG);
$("gBest").addEventListener("click",()=>{let best=null;for(let L=-4;L<=5;L+=0.5){const r=fitCurve(basis12,penFor(Math.pow(10,L)));if(!best||r.aic<best.aic)best={L:L,aic:r.aic};}$("gL").value=best.L;drawG();});drawG();

buildQuiz("quizzes",[
 {t:"epi",q:"Temperature is split into quintiles. A day at the upper edge of the middle quintile and a day just inside the top quintile:",o:[["Get similar rate ratios, as they should","Categories treat them as different groups.",0],["Can get very different rate ratios, although their temperatures are almost equal","Cut-points create artificial jumps.",1],["Are excluded","No days are excluded by categorization.",0],["Get the average of their two categories","Each day gets its own category's estimate.",0]]},
 {t:"stat",q:"Why do high-degree polynomials behave badly at the extremes of temperature?",o:[["Because extreme temperatures have no effect","They often have the largest effects.",0],["Because each coefficient shapes the whole curve, so sparse extreme data are dominated by the middle of the range","Polynomials are global, unlike splines.",1],["Because polynomials can't be fitted in Poisson regression","They can.",0],["Because the log link forbids curvature","It doesn't.",0]]},
 {t:"stat",q:"A natural (restricted) cubic spline differs from an ordinary cubic spline in that it:",o:[["Has no knots","Both have knots.",0],["Is constrained to be linear beyond the outer knots","This stabilizes the tails, where data are sparse.",1],["Is always a straight line","Only beyond the outer knots.",0],["Can only be used with linear regression","It can be used in any regression model.",0]]},
 {t:"stat",q:"A penalized spline uses 6.3 effective degrees of freedom. This means:",o:[["It has exactly 6 knots","Effective df reflect the penalty, not the knot count.",0],["The penalty lets it use about as much flexibility as an unpenalized spline with 6–7 parameters","Effective df measure the flexibility actually used.",1],["It overfits","Not necessarily; that depends on the data.",0],["6.3 knots were placed at random","Knots are placed at fixed positions.",0]]},
 {t:"epi",q:"How should a U-shaped temperature–visits curve usually be presented?",o:[["As a single rate ratio per °C","A single slope can't describe a U shape.",0],["As rate ratios relative to a stated reference temperature, such as the minimum-risk temperature, with confidence bands","Results are interpretable only relative to a reference.",1],["As the spline coefficients","Individual spline coefficients have no direct interpretation.",0],["As p-values for each knot","Knots aren't hypotheses.",0]]},
 {t:"stat",q:"Choosing the number of knots by trying several and reporting the most significant result is:",o:[["Good practice","It inflates false positives and exaggerates effects.",0],["A form of data dredging; fix the flexibility in advance or use a penalty chosen by a criterion","Pre-specification or penalization avoids it.",1],["Required by reporting guidelines","Guidelines ask for the approach to be described and justified.",0],["Harmless if the sample is large","Selection effects don't vanish with size.",0]]}]);
onTheme(()=>{drawC();drawP();drawS();drawG();});
});
