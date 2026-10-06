document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),D=A.days,ND=D.length;
const y=new Array(ND).fill(0);A.rows.forEach(r=>y[r.t]+=r.visits);
const pm01=D.map((d,i)=>(d.pm25+D[Math.max(0,i-1)].pm25)/2/10);
const tk=rcsKnots(D.map(d=>d.temp_city),4),tempB=D.map(d=>rcsRow(d.temp_city,tk).map((v,i)=>i===0?(v-15)/10:v/10));
const dowB=D.map(d=>[1,2,3,4,5,6].map(j=>d.dow===j?1:0));
/* cubic B-spline basis of time with df columns (well conditioned even with many knots); first column dropped for the intercept */
function bsBasis(x,lo,hi,df){const nint=Math.max(0,df-3+1),h=(hi-lo)/(nint+1),kn=[];for(let i=-3;i<=nint+4;i++)kn.push(lo+i*h);
  return x.map(v=>{const nb=kn.length-4,B=new Array(nb).fill(0);let j=Math.min(nb-1+3,Math.max(3,Math.floor((v-lo)/h)+3));
    let N=[1];for(let d=1;d<=3;d++){const M=new Array(d+1).fill(0);for(let r=0;r<d;r++){const left=kn[j-d+1+r],right=kn[j+1+r],w=(right-left)>0?(v-left)/(right-left):0;M[r]+=(1-w)*N[r];M[r+1]+=w*N[r];}N=M;}
    for(let r=0;r<=3;r++){const idx=j-3+r;if(idx>=0&&idx<nb)B[idx]=N[r];}return B.slice(1);});}
function timeBasis(df){if(df<1)return D.map(()=>[]);return bsBasis(D.map(d=>d.t),-0.5,ND-0.5,df+1);}
const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------- 15.1 decomposition ---------- */
const trB=timeBasis(5),seB=D.map(d=>[Math.sin(2*Math.PI*d.doy/365.25),Math.cos(2*Math.PI*d.doy/365.25),Math.sin(4*Math.PI*d.doy/365.25),Math.cos(4*Math.PI*d.doy/365.25)]);
const dec=glmFit(D.map((d,i)=>[1].concat(trB[i],seB[i],dowB[i])),y,"poisson"),bb=dec.beta;
const part=(i,a,b)=>{let s=0;for(let k=a;k<b;k++)s+=bb[k]*[1].concat(trB[i],seB[i],dowB[i])[k];return s;};
const nT=trB[0].length,P={tr:[1,1+nT],se:[1+nT,5+nT],dw:[5+nT,11+nT]};
const comp={};Object.keys(P).forEach(k=>{comp[k]=D.map((_,i)=>part(i,P[k][0],P[k][1]));comp[k+"m"]=mean(comp[k]);});
function drawD(){const yr=$("dYr").value,use={tr:$("dTr").checked,se:$("dSe").checked,dw:$("dDw").checked};
  const idx=D.map((d,i)=>i).filter(i=>yr==="all"||D[i].year===+yr);
  const fit=idx.map(i=>Math.exp(bb[0]+Object.keys(P).reduce((s,k)=>s+(use[k]?comp[k][i]:comp[k+"m"]),0)));
  let svg=clear($("dSer")),F=frame(svg,1000,260,{l:50,r:12,t:16,b:30},[0,idx.length-1],[250,750]);yGrid(F,[300,400,500,600,700]);
  const mt=[];idx.forEach((i,j)=>{if(D[i].date.slice(8)==="01"&&(yr!=="all"||D[i].date.slice(5,7)==="01"))mt.push(j);});xAxis(F,mt,null,j=>yr==="all"?D[idx[j]].date.slice(0,4):months[+D[idx[j]].date.slice(5,7)-1]);
  txt(svg,F.m.l,12,"daily emergency visits, whole city (gray) and the fitted components (blue)",{});
  poly(F,idx.map((_,j)=>j),idx.map(i=>y[i]),{stroke:css("--c-lik"),"stroke-width":1,"stroke-opacity":0.7});poly(F,idx.map((_,j)=>j),fit,{stroke:css("--p1"),"stroke-width":2.2});
  const ratio=idx.map((i,j)=>y[i]/fit[j]);svg=clear($("dRes"));F=frame(svg,1000,150,{l:50,r:12,t:16,b:24},[0,idx.length-1],[0.7,1.3]);yGrid(F,[0.8,1,1.2],v=>fmt(v,1));
  txt(svg,F.m.l,12,"what remains: observed ÷ fitted",{});poly(F,idx.map((_,j)=>j),ratio,{stroke:css("--p2"),"stroke-width":1});
  const sdR=sd(ratio),wk=[0,1,2,3,4,5,6].map(k=>mean(idx.filter(i=>D[i].dow===k).map(i=>y[i]))),on=Object.keys(use).filter(k=>use[k]);
  setNow("dNow","The blue line combines "+(on.length?on.map(k=>({tr:"the long-term trend",se:"the seasonal cycle",dw:"the day-of-week pattern"}[k])).join(", "):"nothing but the overall mean")+". "+(use.se?"The seasonal cycle peaks in winter and dips in late summer.":"Without the seasonal cycle, the remainder still swings with the seasons.")+" "+(use.dw?"The weekly pattern adds a sawtooth: Mondays average "+fmt(wk[1],0)+" visits, Sundays "+fmt(wk[0],0)+".":"Add day of week to remove the weekly sawtooth.")+" What remains (orange) varies by about ±"+fmt(100*sdR,0)+"% from day to day. That remainder is where the short-term effects of temperature and pollution live, mixed with noise.");}
["dTr","dSe","dDw"].forEach(id=>$(id).addEventListener("change",drawD));$("dYr").addEventListener("change",drawD);drawD();

/* ---------- 15.2 and 15.3 ---------- */
const cache={};
function fitTS(df,temp){const key=df+"-"+temp;if(cache[key])return cache[key];const tb=timeBasis(df*5);
  const X=D.map((d,i)=>[1,pm01[i]].concat(tb[i],temp?tempB[i]:[],dowB[i])),f=glmFit(X,y,"poisson"),phi=f.phi,b=f.beta[1],se=f.se[1]*Math.sqrt(phi);
  const r=f.pearson,m=mean(r),c0=sum(r.map(v=>(v-m)*(v-m))),acf=[];for(let k=1;k<=21;k++){let c=0;for(let i=k;i<ND;i++)c+=(r[i]-m)*(r[i-k]-m);acf.push(c/c0);}
  return cache[key]={b:b,se:se,phi:phi,acf:acf};}
function drawT(){const df=+$("tDf").value,temp=$("tTemp").checked;$("tDfO").textContent=df===0?"none":df+" per year";
  const all=[];for(let k=0;k<=12;k++)all.push(fitTS(k,temp));const cur=all[df];
  const rr=all.map(a=>Math.exp(a.b)),lo=all.map(a=>Math.exp(a.b-1.96*a.se)),hi=all.map(a=>Math.exp(a.b+1.96*a.se)),ymin=Math.min(0.97,Math.min.apply(null,lo)),ymax=Math.max(1.08,Math.max.apply(null,hi));
  const svg=clear($("tSens")),F=frame(svg,520,260,{l:50,r:12,t:16,b:40},[-0.5,12.5],[ymin,ymax]);yGrid(F,niceTicks(ymin,ymax,5),v=>fmt(v,2));xAxis(F,[0,2,4,6,8,10,12],"degrees of freedom per year for the time spline");txt(svg,F.m.l,10,"rate ratio per 10 µg/m³ PM2.5, with 95% CI",{});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(1),y2:F.Y(1),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  const tr=Math.exp(10*TRUTH_A.pmPer1);el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(tr),y2:F.Y(tr),stroke:css("--p4"),"stroke-width":2,"stroke-dasharray":"6 4"},svg);txt(svg,F.w-F.m.r-4,F.Y(tr)-5,"truth",{"text-anchor":"end",style:"fill:"+css("--p4")});
  el("rect",{x:F.X(3.5),y:F.m.t,width:F.X(8.5)-F.X(3.5),height:F.Y(ymin)-F.m.t,fill:css("--p1"),"fill-opacity":0.06},svg);txt(svg,F.X(6),F.m.t+12,"usual range",{"text-anchor":"middle"});
  all.forEach((a,k)=>{el("line",{x1:F.X(k),x2:F.X(k),y1:F.Y(lo[k]),y2:F.Y(hi[k]),stroke:css(k===df?"--p2":"--c-lik"),"stroke-width":k===df?3:2},svg);el("circle",{cx:F.X(k),cy:F.Y(rr[k]),r:k===df?6:4,fill:css(k===df?"--p2":"--c-lik")},svg);});
  $("tStats").innerHTML=[["rate ratio per 10 µg/m³",fmt(rr[df],3)],["95% CI",fmt(lo[df],3)+" to "+fmt(hi[df],3)],["dispersion φ",fmt(cur.phi,2)],["true rate ratio (simulation)",fmt(tr,3)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("tNow","With "+(df===0?"no control for season or trend":df+" degrees of freedom per year for time")+(temp?" and adjustment for temperature":", <b>without</b> temperature")+", each 10 µg/m³ of PM2.5 is associated with a rate ratio of <b>"+fmt(rr[df],3)+"</b>. "+(df<2?"With little or no control for time, the estimate is distorted by seasonal confounding: PM2.5 and visits both follow the seasons. ":df>9?"With very flexible time control, the estimate becomes less precise, as the spline starts to soak up short-term variation. ":"In the usual range of 4 to 8 per year, the estimate is stable. ")+(temp?"":(function(){const w=fitTS(df,true),d=Math.abs(Math.exp(w.b)-rr[df]);return d>0.003?"Leaving out temperature changes the estimate (with temperature: "+fmt(Math.exp(w.b),3)+"), because hot and cold days differ in both visits and pollution. ":"Leaving out temperature changes the estimate very little here ("+fmt(Math.exp(w.b),3)+" with it): in this city, once the season is controlled, day-to-day temperature and PM2.5 are only weakly related. In real data that is often not so, which is why temperature is routinely included. ";})())+"The dashed green line is the true effect used to simulate the data, "+fmt(tr,3)+".");
  drawA(cur,df);}
function drawA(cur,df){const svg=clear($("aAcf")),F=frame(svg,520,220,{l:44,r:12,t:16,b:36},[0.5,21.5],[-0.2,0.6]);yGrid(F,[-0.2,0,0.2,0.4,0.6],v=>fmt(v,1));xAxis(F,[1,7,14,21],"lag (days)");txt(svg,F.m.l,10,"autocorrelation of Pearson residuals",{});
  const bd=1.96/Math.sqrt(ND);el("rect",{x:F.m.l,y:F.Y(bd),width:F.w-F.m.l-F.m.r,height:F.Y(-bd)-F.Y(bd),fill:css("--p4"),"fill-opacity":0.15},svg);
  cur.acf.forEach((v,k)=>el("line",{x1:F.X(k+1),x2:F.X(k+1),y1:F.Y(0),y2:F.Y(Math.max(-0.2,Math.min(0.6,v))),stroke:Math.abs(v)>bd?css("--p2"):css("--c-lik"),"stroke-width":7},svg));
  const big=cur.acf.filter(v=>Math.abs(v)>bd).length;
  setNow("aNow","With "+(df===0?"no time control":df+" df per year")+", the lag-1 residual autocorrelation is <b>"+fmt(cur.acf[0],2)+"</b>, and "+big+" of 21 lags fall outside the green band expected for pure noise. "+(cur.acf[0]>0.2?"Unmodeled seasonal variation makes neighboring days alike: standard errors from this model are too small.":cur.acf[0]>0.08?"Some short-term dependence remains; it is common, and modest residual autocorrelation is usually tolerated.":"The residuals are close to independent.")+" Dispersion φ = "+fmt(cur.phi,2)+": quasi-Poisson standard errors are √φ = "+fmt(Math.sqrt(cur.phi),2)+" times the Poisson ones.");}
$("tDf").addEventListener("input",drawT);$("tTemp").addEventListener("change",drawT);

/* ---------- 15.4 conditional Poisson (time-stratified case-crossover) ---------- */
function condPoisson(Xc){const strata={};D.forEach((d,i)=>{const k=d.year+"-"+d.date.slice(5,7)+"-"+d.dow;(strata[k]=strata[k]||[]).push(i);});const S=Object.values(strata),p=Xc[0].length;let b=new Array(p).fill(0),H=null;
  for(let it=0;it<30;it++){const g=new Array(p).fill(0);H=[];for(let a=0;a<p;a++)H.push(new Array(p).fill(0));
    S.forEach(s=>{const e=s.map(i=>Math.exp(Xc[i].reduce((q,v,k)=>q+v*b[k],0))),es=sum(e),Y=sum(s.map(i=>y[i])),pi=e.map(v=>v/es),xm=new Array(p).fill(0);
      s.forEach((i,j)=>{for(let a=0;a<p;a++){xm[a]+=pi[j]*Xc[i][a];g[a]+=y[i]*Xc[i][a];}});for(let a=0;a<p;a++)g[a]-=Y*xm[a];
      s.forEach((i,j)=>{for(let a=0;a<p;a++)for(let c=0;c<p;c++)H[a][c]+=Y*pi[j]*(Xc[i][a]-xm[a])*(Xc[i][c]-xm[c]);});});
    const st=matSolve(H,g);b=b.map((v,k)=>v+st[k]);if(Math.max.apply(null,st.map(Math.abs))<1e-9)break;}
  const V=matInv(H);let chi=0;S.forEach(s=>{const e=s.map(i=>Math.exp(Xc[i].reduce((q,v,k)=>q+v*b[k],0))),es=sum(e),Y=sum(s.map(i=>y[i]));s.forEach((i,j)=>{const m=Y*e[j]/es;chi+=(y[i]-m)*(y[i]-m)/m;});});
  const phi=chi/(ND-S.length-p);return {b:b[0],se:Math.sqrt(V[0][0]*Math.max(1,phi)),phi:phi,nS:S.length};}
let cc=null;
function drawCC(){if(!cc){const none=(function(){const X=D.map((d,i)=>[1,pm01[i]].concat(tempB[i],dowB[i])),f=glmFit(X,y,"poisson");return {b:f.beta[1],se:f.se[1]*Math.sqrt(f.phi)};})(),ts=fitTS(7,true),cp=condPoisson(D.map((d,i)=>[pm01[i]].concat(tempB[i])));cc={none:none,ts:ts,cp:cp};}
  const rows=[["no control for season or trend",cc.none,"--c-lik"],["time series, spline 7 df/year",cc.ts,"--p1"],["time-stratified case-crossover",cc.cp,"--p2"]],tr=Math.exp(10*TRUTH_A.pmPer1);
  const all=rows.flatMap(r=>[Math.exp(r[1].b-1.96*r[1].se),Math.exp(r[1].b+1.96*r[1].se)]),lo=Math.min(0.97,Math.min.apply(null,all)),hi=Math.max(1.08,Math.max.apply(null,all));
  const svg=clear($("ccPlot")),F=frame(svg,520,240,{l:200,r:16,t:16,b:40},[lo,hi],[0,4]);xAxis(F,niceTicks(lo,hi,5),"rate ratio per 10 µg/m³ PM2.5",v=>fmt(v,2));
  el("line",{x1:F.X(1),x2:F.X(1),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);el("line",{x1:F.X(tr),x2:F.X(tr),y1:F.m.t,y2:F.Y(0),stroke:css("--p4"),"stroke-width":2},svg);txt(svg,F.X(tr)+4,F.m.t+10,"truth",{style:"fill:"+css("--p4")});
  rows.forEach((r,k)=>{const yy=F.Y(3-k),a=Math.exp(r[1].b-1.96*r[1].se),b=Math.exp(r[1].b+1.96*r[1].se);txt(svg,F.m.l-8,yy+4,r[0],{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("line",{x1:F.X(a),x2:F.X(b),y1:yy,y2:yy,stroke:css(r[2]),"stroke-width":4},svg);el("circle",{cx:F.X(Math.exp(r[1].b)),cy:yy,r:6,fill:css(r[2])},svg);});
  $("ccStats").innerHTML=[["no time control",fmt(Math.exp(cc.none.b),3)],["time-series spline",fmt(Math.exp(cc.ts.b),3)],["case-crossover (conditional Poisson)",fmt(Math.exp(cc.cp.b),3)],["strata",String(cc.cp.nS)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("ccNow","The time-stratified design compares each day only with the other days of the same weekday in the same month: "+cc.cp.nS+" strata of 4 or 5 days. Season, trend and weekday can't confound a comparison within a stratum. Its estimate, <b>"+fmt(Math.exp(cc.cp.b),3)+"</b>, is close to the time-series model with a spline of time ("+fmt(Math.exp(cc.ts.b),3)+"): two routes to the same control of time. Without any control for time, the estimate is "+fmt(Math.exp(cc.none.b),3)+". The case-crossover interval is a little wider, because it uses only within-stratum variation.");
  $("ccReport").innerHTML="In a time-stratified case-crossover analysis (conditional quasi-Poisson regression, strata of year, month and weekday, adjusted for temperature), each 10 µg/m³ increase in PM2.5 was associated with a <b>"+fmt(100*(Math.exp(cc.cp.b)-1),1)+"% change in emergency visits (95% CI "+fmt(100*(Math.exp(cc.cp.b-1.96*cc.cp.se)-1),1)+" to "+fmt(100*(Math.exp(cc.cp.b+1.96*cc.cp.se)-1),1)+"%)</b>.";}
setTimeout(()=>{drawT();drawCC();},20);

buildQuiz("quizzes",[
 {t:"epi",q:"Why do time-series studies of daily pollution need to control for season?",o:[["Because pollution has no effect in summer","Effects can occur in any season.",0],["Because both pollution and visits vary with the seasons, so season confounds their day-to-day association","Seasonal confounding is the central threat in time-series studies.",1],["Because the Poisson model requires it","It's a confounding issue, not a modeling requirement.",0],["To increase the number of days","Adjustment doesn't change the number of days.",0]]},
 {t:"stat",q:"A time spline with too many degrees of freedom per year will tend to:",o:[["Remove all confounding and improve precision","It starts to remove short-term exposure variation too, reducing precision.",0],["Absorb some of the short-term variation that carries information about the exposure","Overly flexible time control competes with the exposure.",1],["Introduce seasonal confounding","Seasonal confounding is the risk of too few degrees of freedom.",0],["Make the residuals more autocorrelated","More flexible time control usually reduces residual autocorrelation.",0]]},
 {t:"stat",q:"Residual autocorrelation at lag 1 is 0.35 after fitting a model. The main concern is:",o:[["The coefficient estimates are biased","Autocorrelation mainly affects standard errors, though it may signal missing confounders.",0],["Standard errors are too small, and the model may be missing time-varying structure","Positively correlated residuals carry less independent information than assumed.",1],["The data are not counts","Autocorrelation is unrelated to the data type.",0],["The dispersion parameter is 0.35","Dispersion and autocorrelation are different diagnostics.",0]]},
 {t:"epi",q:"In a time-stratified case-crossover design, the control days for a case on Tuesday 14 March 2023 are:",o:[["The previous seven days","That design can be biased by time trends.",0],["The other Tuesdays in March 2023","Same weekday, same month and year: the time-stratified scheme.",1],["Random days from the whole study period","That would ignore season and trend.",0],["Days on which the person had no event","Controls come from the same person's other time, defined by the stratum.",0]]},
 {t:"stat",q:"Why does a time-stratified case-crossover analysis give similar results to a time-series model?",o:[["By coincidence","There's a mathematical equivalence.",0],["Because it is equivalent to a Poisson time-series model with an indicator for each stratum (a conditional Poisson model)","Both control time through the strata.",1],["Because both ignore day of week","The stratified design controls day of week exactly.",0],["Because case-crossover designs always use more data","They use the same data.",0]]},
 {t:"stat",q:"Holding everything else fixed, adding temperature to a time-series model of PM2.5 and visits matters because:",o:[["Temperature is a mediator","Temperature isn't on the path from PM2.5 to visits.",0],["Temperature affects visits and is related to pollution levels, so it is a time-varying confounder","Short-term confounders must be modeled explicitly, unlike slow ones.",1],["It improves the spline of time","It is a separate term.",0],["It removes overdispersion completely","It can reduce it, but not necessarily remove it.",0]]}]);
onTheme(()=>{drawD();drawT();drawCC();});
});
