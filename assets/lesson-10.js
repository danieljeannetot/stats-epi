document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children,D=A.days,ND=D.length;
const city=new Array(ND).fill(0);A.rows.forEach(r=>city[r.t]+=r.visits);
const tk=rcsKnots(D.map(d=>d.temp_city),5);
const TERMS={tDow:{lab:"day of week",cols:d=>[1,2,3,4,5,6].map(j=>d.dow===j?1:0)},
  tSea:{lab:"season",cols:d=>[Math.sin(2*Math.PI*d.doy/365.25),Math.cos(2*Math.PI*d.doy/365.25),Math.sin(4*Math.PI*d.doy/365.25),Math.cos(4*Math.PI*d.doy/365.25)]},
  tTrend:{lab:"long-term trend",cols:d=>[d.t/365.25]},
  tTemp:{lab:"temperature",cols:d=>rcsRow(d.temp_city,tk).map((v,i)=>i===0?(v-15)/10:v/10)},
  tPM:{lab:"PM2.5",cols:d=>[d.pm25/10]}};
const ORDER=["tDow","tSea","tTrend","tTemp","tPM"];
function design(keys){return D.map(d=>[1].concat(...keys.map(k=>TERMS[k].cols(d))));}
const cache={};function fitKeys(keys){const id=keys.join(",");if(!cache[id])cache[id]=glmFit(design(keys),city,"poisson");return cache[id];}

/* ---------- 10.1 ---------- */
function drawT(){const keys=ORDER.filter(k=>$(k).checked),f=fitKeys(keys),phi=f.phi,r=f.pearson;
  let svg=clear($("tRes")),F=frame(svg,520,200,{l:40,r:10,t:16,b:30},[0,ND],[-6,6]);yGrid(F,[-4,0,4]);xAxis(F,[0,366,731,1096,1461,1826],null,v=>String(2020+Math.round(v/365.25)));
  txt(svg,F.m.l,10,"Pearson residuals over time (30-day average in blue)",{});
  for(let i=0;i<ND;i+=2)el("circle",{cx:F.X(i),cy:F.Y(Math.max(-6,Math.min(6,r[i]))),r:1.2,fill:css("--c-lik"),"fill-opacity":0.5},svg);
  const ma=r.map((_,i)=>mean(r.slice(Math.max(0,i-15),Math.min(ND,i+15))));poly(F,ma.map((_,i)=>i),ma,{stroke:css("--p1"),"stroke-width":2});
  const acf=[];const m=mean(r),c0=sum(r.map(v=>(v-m)*(v-m)));for(let k=1;k<=21;k++){let c=0;for(let i=k;i<ND;i++)c+=(r[i]-m)*(r[i-k]-m);acf.push(c/c0);}
  svg=clear($("tAcf"));F=frame(svg,520,150,{l:40,r:10,t:16,b:30},[0.5,21.5],[-0.2,0.8]);yGrid(F,[-0.2,0,0.2,0.4,0.6,0.8],v=>fmt(v,1));xAxis(F,[1,7,14,21],"lag (days)");txt(svg,F.m.l,10,"autocorrelation of residuals",{});
  const bd=1.96/Math.sqrt(ND);el("rect",{x:F.m.l,y:F.Y(bd),width:F.w-F.m.l-F.m.r,height:F.Y(-bd)-F.Y(bd),fill:css("--p4"),"fill-opacity":0.15},svg);
  acf.forEach((v,k)=>{const x=F.X(k+1);el("line",{x1:x,x2:x,y1:F.Y(0),y2:F.Y(v),stroke:Math.abs(v)>bd?css("--p2"):css("--c-lik"),"stroke-width":5},svg);});
  const rows=keys.map(k=>{const sm=fitKeys(keys.filter(x=>x!==k)),df=f.p-sm.p,lr=(sm.deviance-f.deviance)/phi;return {k:k,df:df,lr:lr,p:pchisqUpper(lr,df)};});
  $("tTab").innerHTML=keys.length?"<tr><th>Term (dropped from the model)</th><th class='n'>df</th><th class='n'>LR ÷ φ</th><th class='n'>p</th></tr>"+rows.map(q=>"<tr><td>"+TERMS[q.k].lab+"</td><td class='n'>"+q.df+"</td><td class='n'>"+fmt(q.lr,1)+"</td><td class='n'>"+pFmt(q.p)+"</td></tr>").join(""):"<tr><td class='small'>Add a term to see its likelihood ratio test.</td></tr>";
  const qaic=-2*f.loglik/phi+2*f.p;
  $("tStats").innerHTML=[["parameters",String(f.p)],["dispersion φ",fmt(phi,2)],["AIC",fmtInt(f.aic)],["lag-1 autocorrelation",fmt(acf[0],2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg;if(!keys.length)msg="With only an intercept, the model predicts the same count every day. The residuals carry everything: the annual wave in the blue line, and huge autocorrelation (today's residual strongly predicts tomorrow's: "+fmt(acf[0],2)+"). Dispersion φ = "+fmt(phi,1)+". Start by adding season.";
  else{const miss=ORDER.filter(k=>keys.indexOf(k)<0).map(k=>TERMS[k].lab);
    msg="With "+keys.map(k=>TERMS[k].lab).join(", ")+": dispersion φ = <b>"+fmt(phi,2)+"</b>, lag-1 autocorrelation "+fmt(acf[0],2)+", AIC "+fmtInt(f.aic)+". ";
    msg+=keys.indexOf("tSea")<0?"The residuals still rise and fall with the seasons; add the annual cycle. ":acf[0]>0.15?"Some autocorrelation remains: neighboring days share unmodeled influences. ":"The residual series looks close to noise. ";
    msg+=keys.indexOf("tDow")<0?"The weekly cycle shows up as autocorrelation at lags 7, 14 and 21. ":"";
    msg+="Each row of the table tests one term by dropping it: a large statistic and small p mean it improves the fit. "+(miss.length?"Not yet included: "+miss.join(", ")+".":"Even the full model leaves φ above 1; quasi-Poisson standard errors account for that.");}
  setNow("tNow",msg);
  $("tReport").innerHTML="Daily emergency visits were modeled with quasi-Poisson regression"+(keys.length?", including "+keys.map(k=>TERMS[k].lab).join(", "):"")+". <b>Dispersion "+fmt(phi,2)+"; QAIC "+fmtInt(qaic)+"</b>; residual autocorrelation at lag 1: "+fmt(acf[0],2)+".";}
ORDER.forEach(k=>$(k).addEventListener("change",drawT));drawT();

/* ---------- 10.2 ---------- */
let oSeed=1,train=[],test=[];
const sx=t=>(t-10)/18;
function newTrain(){const n=+$("oN").value,r=makeRng(1000+oSeed),idx=new Set();while(idx.size<n)idx.add(Math.floor(r()*ND));train=[...idx];test=D.map((_,i)=>i).filter(i=>!idx.has(i));}
const polyRow=(t,d)=>{const x=sx(t),out=[1];for(let k=1;k<=d;k++)out.push(Math.pow(x,k));return out;};
function mse(beta,idx,d){return mean(idx.map(i=>{const p=polyRow(D[i].temp_city,d).reduce((s,v,k)=>s+v*beta[k],0);return Math.pow(city[i]-p,2);}));}
function fitPoly(idx,d){try{return lmFit(idx.map(i=>polyRow(D[i].temp_city,d)),idx.map(i=>city[i])).beta;}catch(e){return null;}}
function cv(d){const r=makeRng(77+oSeed),sh=train.slice().sort(()=>r()-0.5),k=5,errs=[];for(let f=0;f<k;f++){const te=sh.filter((_,i)=>i%k===f),tr=sh.filter((_,i)=>i%k!==f);const b=fitPoly(tr,d);if(!b||tr.length<=d+1)return NaN;errs.push(mse(b,te,d));}return mean(errs);}
function drawO(){const d=+$("oD").value;$("oDO").textContent=d;$("oNO").textContent=$("oN").value;
  const res=[];for(let k=1;k<=10;k++){const b=fitPoly(train,k);res.push(b&&train.length>k+1?{tr:mse(b,train,k),te:mse(b,test,k),cv:cv(k),b:b}:{tr:NaN,te:NaN,cv:NaN,b:null});}
  const cur=res[d-1];let svg=clear($("oFit")),F=frame(svg,520,240,{l:44,r:10,t:16,b:36},[-12,33],[200,800]);yGrid(F,[200,400,600,800]);xAxis(F,[-10,0,10,20,30],"temperature (°C)");
  txt(svg,F.m.l,10,"daily city visits: gray = all days, dark = training days",{});
  for(let i=0;i<ND;i+=3)el("circle",{cx:F.X(D[i].temp_city),cy:F.Y(Math.max(200,Math.min(800,city[i]))),r:1.3,fill:css("--c-lik"),"fill-opacity":0.35},svg);
  train.forEach(i=>el("circle",{cx:F.X(D[i].temp_city),cy:F.Y(Math.max(200,Math.min(800,city[i]))),r:3.4,fill:css("--c-ink")},svg));
  if(cur.b){const xs=[];for(let t=-12;t<=33;t+=0.25)xs.push(t);poly(F,xs,xs.map(t=>polyRow(t,d).reduce((s,v,k)=>s+v*cur.b[k],0)),{stroke:css("--p2"),"stroke-width":2.4});}
  svg=clear($("oErr"));const all=res.flatMap(q=>[q.tr,q.te,q.cv]).filter(v=>isFinite(v)),ymax=Math.min(Math.max.apply(null,all),4*res[0].te)*1.05,ymin=Math.min.apply(null,all)*0.9;
  F=frame(svg,520,200,{l:54,r:10,t:16,b:36},[0.5,10.5],[ymin,ymax]);yGrid(F,niceTicks(ymin,ymax,4),v=>fmtInt(v));xAxis(F,[1,2,3,4,5,6,7,8,9,10],"polynomial degree");txt(svg,F.m.l,10,"mean squared error",{});
  [["tr","--p1"],["cv","--p4"],["te","--p2"]].forEach(c=>{const pts=res.map((q,k)=>[k+1,q[c[0]]]).filter(q=>isFinite(q[1]));poly(F,pts.map(q=>q[0]),pts.map(q=>Math.min(ymax,q[1])),{stroke:css(c[1]),"stroke-width":2.2});pts.forEach(q=>el("circle",{cx:F.X(q[0]),cy:F.Y(Math.min(ymax,q[1])),r:q[0]===d?6:3,fill:css(c[1])},svg));});
  const bestTe=res.reduce((b,q,k)=>q.te<res[b].te?k:b,0)+1,bestCv=res.reduce((b,q,k)=>(isFinite(q.cv)&&(!isFinite(res[b].cv)||q.cv<res[b].cv))?k:b,0)+1;
  $("oStats").innerHTML=[["training error",fmtInt(cur.tr)],["5-fold CV error",isFinite(cur.cv)?fmtInt(cur.cv):"—"],["error on new days",fmtInt(cur.te)],["best degree (new days / CV)",bestTe+" / "+bestCv]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("oNow","With degree "+d+" fitted to "+train.length+" days, the training error is "+fmtInt(cur.tr)+" but the error on the other "+fmtInt(test.length)+" days is <b>"+fmtInt(cur.te)+"</b>. "+(cur.te>1.3*cur.tr?"The model fits its training days much better than new ones: it is fitting noise. ":"")+"Training error falls with every extra degree (blue). Error on new days (orange) is lowest at degree "+bestTe+". Cross-validation (green), which uses only the training days, points to degree "+bestCv+". "+(train.length<60?"With few training days, high degrees swing wildly at the temperature extremes. Increase the training sample and the penalty for flexibility shrinks.":"With many training days, overfitting sets in later."));}
$("oD").addEventListener("input",drawO);$("oN").addEventListener("input",()=>{newTrain();drawO();});$("oNew").addEventListener("click",()=>{oSeed++;newTrain();drawO();});newTrain();drawO();

/* ---------- 10.3 ---------- */
const rI=makeRng(31),base=[];for(let i=0;i<30;i++)base.push(kids[Math.floor(rI()*kids.length)]);
function drawI(){const ex=+$("iX").value,ey=+$("iY").value;$("iXO").textContent=fmt(ex,2);$("iYO").textContent=fmt(ey,1);
  const X0=base.map(c=>[1,c.green]),y0=base.map(c=>c.no2_modeled),f0=lmFit(X0,y0),X1=X0.concat([[1,ex]]),y1=y0.concat([ey]),f1=lmFit(X1,y1);
  const xm=mean(X1.map(r=>r[1])),sxx=sum(X1.map(r=>(r[1]-xm)*(r[1]-xm))),h=1/X1.length+(ex-xm)*(ex-xm)/sxx,res=ey-(f1.beta[0]+f1.beta[1]*ex);
  const cook=res*res/(2*f1.sigma*f1.sigma)*h/((1-h)*(1-h)),meanH=2/X1.length;
  const svg=clear($("iPlot")),F=frame(svg,520,280,{l:44,r:10,t:16,b:36},[0,1.6],[0,90]);yGrid(F,[0,20,40,60,80]);xAxis(F,[0,0.4,0.8,1.2,1.6],"green space",v=>fmt(v,1));txt(svg,F.m.l,10,"modeled NO₂ (µg/m³), 30 children plus one extra",{});
  base.forEach(c=>el("circle",{cx:F.X(c.green),cy:F.Y(c.no2_modeled),r:3.4,fill:css("--c-lik")},svg));
  poly(F,[0,1.6],[f0.beta[0],f0.beta[0]+1.6*f0.beta[1]],{stroke:css("--c-lik"),"stroke-width":2,"stroke-dasharray":"5 4"});poly(F,[0,1.6],[f1.beta[0],f1.beta[0]+1.6*f1.beta[1]],{stroke:css("--p2"),"stroke-width":2.4});
  el("circle",{cx:F.X(ex),cy:F.Y(ey),r:7,fill:css("--p2"),stroke:css("--c-panel"),"stroke-width":2},svg);
  $("iStats").innerHTML=[["slope without",fmt(f0.beta[1],1)],["slope with",fmt(f1.beta[1],1)],["leverage h",fmt(h,3)+" (avg "+fmt(meanH,3)+")"],["Cook's distance",fmt(cook,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const big=cook>0.5,hl=h>3*meanH,out=Math.abs(res)>2.5*f1.sigma;
  setNow("iNow","The extra child "+(hl?"has an unusual amount of green space (<b>high leverage</b>, h = "+fmt(h,2)+", "+fmt(h/meanH,1)+" times the average)":"has typical green space (low leverage)")+(out?" and an NO₂ far from the line (<b>large residual</b>)":" and an NO₂ close to the line")+". "+(big?"Together these make it <b>highly influential</b>: Cook's distance "+fmt(cook,2)+", and the slope moves from "+fmt(f0.beta[1],1)+" to "+fmt(f1.beta[1],1)+".":"Cook's distance is "+fmt(cook,2)+", so removing it would change little.")+" Try a child at green space 1.5 (beyond everyone else) with high NO₂: leverage and a large residual together make the most influential points. Green space above 1 is impossible in these data, so such a point would be an error to check.");}
["iX","iY"].forEach(id=>$(id).addEventListener("input",drawI));drawI();

/* ---------- 10.4 ---------- */
let vRes=null;
function runV(){const K=+$("vK").value,n=+$("vN").value,r=makeRng(4000+K+n),counts=new Array(K+1).fill(0);let anySel=0,selP=[];
  for(let s=0;s<500;s++){const idx=[];for(let i=0;i<n;i++)idx.push(Math.floor(r()*kids.length));const yy=idx.map(i=>kids[i].asthma),ym=mean(yy),ys=sd(yy);let sel=0;
    for(let k=0;k<K;k++){const x=idx.map(()=>gaussFrom(r)),xm=mean(x),xs=sd(x);let c=0;for(let i=0;i<n;i++)c+=(x[i]-xm)*(yy[i]-ym);const rr=c/((n-1)*xs*ys),z=rr*Math.sqrt(n-2)/Math.sqrt(1-rr*rr),p=2*(1-pnormStd(Math.abs(z)));if(p<0.05){sel++;selP.push(p);}}
    counts[Math.min(K,sel)]++;if(sel>0)anySel++;}
  vRes={counts:counts,any:anySel/500,mean:counts.reduce((s,c,i)=>s+c*i,0)/500,maxP:selP.length?Math.max.apply(null,selP):NaN,K:K};drawV();}
function drawV(){$("vKO").textContent=$("vK").value;$("vNO").textContent=$("vN").value;const svg=clear($("vPlot"));
  if(!vRes){txt(svg,20,20,"Press Run.",{});return;}const K=vRes.K,mx=Math.min(K,Math.max(6,vRes.counts.findIndex((c,i)=>i>2&&vRes.counts.slice(i).every(v=>v===0))));const cm=Math.max.apply(null,vRes.counts)*1.1;
  const F=frame(svg,520,220,{l:44,r:10,t:16,b:36},[-0.5,mx+0.5],[0,cm]);yGrid(F,niceTicks(0,cm,4));xAxis(F,Array.from({length:mx+1},(_,i)=>i),"noise variables selected in a study");txt(svg,F.m.l,10,"number of studies (of 500)",{});
  const w=F.X(1)-F.X(0)-6;vRes.counts.slice(0,mx+1).forEach((c,i)=>el("rect",{x:F.X(i)-w/2,y:F.Y(c),width:w,height:F.Y(0)-F.Y(c),fill:i===0?css("--c-lik"):css("--p2"),"fill-opacity":0.75},svg));
  $("vStats").innerHTML=[["studies selecting ≥ 1 noise variable",fmt(100*vRes.any,0)+"%"],["average noise variables selected",fmt(vRes.mean,2)],["largest p among selected","< 0.05, by construction"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("vNow","None of the "+K+" candidates has anything to do with asthma. Yet <b>"+fmt(100*vRes.any,0)+"%</b> of studies selected at least one, on average "+fmt(vRes.mean,2)+" per study, about 5% of the candidates. Every selected variable arrives with p < 0.05, so the final model's p-values say nothing: they were guaranteed by the selection. Bigger studies don't fix this; the false-positive rate per candidate stays at 5%. The cure is to specify the model before looking, from subject knowledge.");}
$("vRun").addEventListener("click",runV);["vK","vN"].forEach(id=>$(id).addEventListener("input",()=>{vRes=null;drawV();}));drawV();

buildQuiz("quizzes",[
 {t:"stat",q:"Residuals from a daily time-series model rise and fall with the seasons. This means:",o:[["The model is overdispersed","Seasonal patterns in residuals show missing structure, not just extra variance.",0],["The model omits seasonal variation, which may also confound the exposure","Add seasonal terms; seasonality is a classic confounder of temperature and pollution effects.",1],["The outcome isn't Poisson","The distribution isn't the issue here.",0],["Nothing, residuals always vary","Systematic patterns are a warning sign.",0]]},
 {t:"stat",q:"Two models of the same data have AIC 18,210 and 18,180. Which is preferred?",o:[["18,210","Higher AIC is worse.",0],["18,180","Lower AIC is better; a difference of 30 is substantial.",1],["Neither: AIC must be below 100","Only differences in AIC matter.",0],["It depends on the p-values","AIC is an alternative to p-value-based comparison.",0]]},
 {t:"stat",q:"As polynomial degree rises, the training error falls while the error on new data rises. This is:",o:[["Underfitting","Underfitting shows as high error on both.",0],["Overfitting","The model fits noise in the training data that doesn't recur.",1],["Confounding","Not a model-flexibility issue.",0],["Overdispersion","That concerns variance, not flexibility.",0]]},
 {t:"stat",q:"A point has high leverage but lies exactly on the fitted line. Its Cook's distance is:",o:[["High, because leverage is high","Influence needs both leverage and a residual.",0],["Close to zero, because removing it barely changes the fit","With no residual, it agrees with the other points.",1],["Undefined","It's defined for every point.",0],["Equal to its leverage","Cook's distance combines leverage and the residual.",0]]},
 {t:"epi",q:"An analysis selects confounders with backward stepwise regression and reports the final model's 95% CIs. The problem is:",o:[["Stepwise is too slow","Speed isn't the issue.",0],["The intervals ignore that the model was chosen from the data, so they're too narrow and the p-values too small","Post-selection inference is biased; choose confounders from a DAG.",1],["Backward selection should be forward","Both have the same problem.",0],["Nothing, if the sample is large","Large samples don't remove selection effects.",0]]},
 {t:"stat",q:"To compare a model with and without a temperature spline (4 extra parameters), you use:",o:[["A t-test on one coefficient","The spline adds several coefficients; test them jointly.",0],["A likelihood ratio test with 4 degrees of freedom (scaled by φ for quasi-Poisson)","Nested models differing by 4 parameters: LR ~ χ²₄.",1],["The R² of each model","GLMs are compared by likelihood or information criteria.",0],["The number of significant spline terms","Individual spline coefficients aren't interpretable on their own.",0]]}]);
onTheme(()=>{drawT();drawO();drawI();drawV();});
});
