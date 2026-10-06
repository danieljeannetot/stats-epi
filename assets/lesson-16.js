document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),D=A.days,ND=D.length,LMAX=21;
const yAll=new Array(ND).fill(0);A.rows.forEach(r=>yAll[r.t]+=r.visits);
const TT=D.map(d=>d.temp_city),IDX=[];for(let t=LMAX;t<ND;t++)IDX.push(t);const y=IDX.map(t=>yAll[t]);
function bsBasis(x,lo,hi,df){const nint=Math.max(0,df-3+1),h=(hi-lo)/(nint+1),kn=[];for(let i=-3;i<=nint+4;i++)kn.push(lo+i*h);
  return x.map(v=>{const nb=kn.length-4,B=new Array(nb).fill(0);let j=Math.min(nb-1+3,Math.max(3,Math.floor((v-lo)/h)+3));let N=[1];
    for(let d=1;d<=3;d++){const M=new Array(d+1).fill(0);for(let r=0;r<d;r++){const left=kn[j-d+1+r],right=kn[j+1+r],w=(right-left)>0?(v-left)/(right-left):0;M[r]+=(1-w)*N[r];M[r+1]+=w*N[r];}N=M;}
    for(let r=0;r<=3;r++){const ix=j-3+r;if(ix>=0&&ix<nb)B[ix]=N[r];}return B.slice(1);});}
const timeB=bsBasis(IDX.map(t=>t),LMAX-0.5,ND-0.5,36),dowB=IDX.map(t=>[1,2,3,4,5,6].map(j=>D[t].dow===j?1:0));
function chol(M){const n=M.length,L=M.map(()=>new Array(n).fill(0));for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=M[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(s,1e-14)):s/L[j][j];}return L;}
const quad=(g,V)=>{let s=0;for(let a=0;a<g.length;a++)for(let b=0;b<g.length;b++)s+=g[a]*V[a][b]*g[b];return s;};
const p01=quantile(TT,0.01),p99=quantile(TT,0.99),p025=quantile(TT,0.025),p975=quantile(TT,0.975);

/* ---------- 16.1 distributed lag model for heat ---------- */
const H=TT.map(T=>Math.max(0,T-20));let lMode="u";
function lagBasisSimple(L){const k=[0,Math.max(1,Math.round(L/3)),L];return l=>[1].concat(rcsRow(l,k).map((v,i)=>i===0?v/L:v/L));}
function drawL(){const L=+$("lL").value;$("lLO").textContent=L+" days";$("lU").setAttribute("aria-pressed",String(lMode==="u"));$("lC").setAttribute("aria-pressed",String(lMode==="c"));
  let lagX,nL,cb=null;if(lMode==="u"){lagX=IDX.map(t=>{const o=[];for(let l=0;l<=L;l++)o.push(H[t-l]);return o;});nL=L+1;}
  else{cb=lagBasisSimple(L);const C=[];for(let l=0;l<=L;l++)C.push(cb(l));nL=C[0].length;lagX=IDX.map(t=>{const o=new Array(nL).fill(0);for(let l=0;l<=L;l++)for(let k=0;k<nL;k++)o[k]+=H[t-l]*C[l][k];return o;});}
  const X=IDX.map((t,i)=>[1].concat(lagX[i],timeB[i],dowB[i])),f=glmFit(X,y,"poisson"),phi=Math.max(1,f.phi),V=f.vcov.slice(1,1+nL).map(r=>r.slice(1,1+nL).map(v=>v*phi)),th=f.beta.slice(1,1+nL);
  const est=[];for(let l=0;l<=L;l++){const g=lMode==="u"?th.map((_,k)=>k===l?1:0):cb(l);est.push({b:g.reduce((s,v,k)=>s+v*th[k],0),se:Math.sqrt(quad(g,V))});}
  const gc=lMode==="u"?th.map(()=>1):(function(){const s=new Array(nL).fill(0);for(let l=0;l<=L;l++)cb(l).forEach((v,k)=>s[k]+=v);return s;})(),cum=gc.reduce((s,v,k)=>s+v*th[k],0),cse=Math.sqrt(quad(gc,V));
  const pc=b=>100*(Math.exp(b)-1),all=est.flatMap(e=>[pc(e.b-1.96*e.se),pc(e.b+1.96*e.se)]),lo=Math.min(-1,Math.min.apply(null,all)),hi=Math.max(2,Math.max.apply(null,all));
  const svg=clear($("lPlot")),F=frame(svg,520,280,{l:44,r:12,t:16,b:40},[-0.5,L+0.5],[lo,hi]);yGrid(F,niceTicks(lo,hi,5),v=>fmt(v,1));xAxis(F,Array.from({length:L+1},(_,i)=>i).filter(i=>L<=10||i%3===0),"lag (days after the hot day)");txt(svg,F.m.l,10,"% change in visits per °C above 20°C, at each lag",{});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  if(lMode==="c"){const ls=[];for(let l=0;l<=L;l+=0.25)ls.push(l);const cv=ls.map(l=>{const g=cb(l);return {b:g.reduce((s,v,k)=>s+v*th[k],0),se:Math.sqrt(quad(g,V))};});
    el("polygon",{points:ls.map((l,i)=>F.X(l)+","+F.Y(pc(cv[i].b+1.96*cv[i].se))).concat(ls.slice().reverse().map((l,i)=>F.X(l)+","+F.Y(pc(cv[ls.length-1-i].b-1.96*cv[ls.length-1-i].se)))).join(" "),fill:css("--p1"),"fill-opacity":0.15},svg);
    poly(F,ls,cv.map(c=>pc(c.b)),{stroke:css("--p1"),"stroke-width":2.4});}
  else est.forEach((e,l)=>{el("line",{x1:F.X(l),x2:F.X(l),y1:F.Y(pc(e.b-1.96*e.se)),y2:F.Y(pc(e.b+1.96*e.se)),stroke:css("--c-lik"),"stroke-width":2},svg);el("circle",{cx:F.X(l),cy:F.Y(pc(e.b)),r:4.5,fill:css(e.b<0?"--p1":"--p2")},svg);});
  const neg=est.filter((e,l)=>l>=3&&e.b<0).length,ws=mean(est.map(e=>e.se));
  $("lStats").innerHTML=[["lag 0 effect",fmt(pc(est[0].b),2)+"% per °C"],["cumulative effect, lags 0–"+L,fmt(pc(cum),2)+"% ("+fmt(pc(cum-1.96*cse),2)+" to "+fmt(pc(cum+1.96*cse),2)+")"],["parameters for the lag structure",String(nL)],["average SE of a lag estimate",fmt(100*ws,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("lNow",(lMode==="u"?"With one coefficient for each of "+(L+1)+" lags, the estimates zigzag: neighboring days have similar temperatures, so the model can't tell their effects apart, and each estimate is imprecise (average SE "+fmt(100*ws,2)+" points).":"With the lag curve constrained to a smooth spline ("+nL+" parameters instead of "+(L+1)+"), the noise is gone and the shape is clear.")+" The effect is largest on the same day and the next, then fades"+(neg>0?"; at lags 3 and beyond some estimates are negative, a sign of <b>harvesting</b>: some visits on hot days were brought forward from the following days, which then see fewer.":".")+" The cumulative effect over lags 0–"+L+" is "+fmt(pc(cum),2)+"% per °C above 20°C; "+(L<5?"extend the maximum lag to capture the displacement, which reduces the cumulative effect.":"it is smaller than the same-day effect alone would suggest, because of the displacement.")+" Notice that the cumulative estimate is much more stable than the individual lags, constrained or not.");}
$("lL").addEventListener("input",drawL);$("lU").addEventListener("click",()=>{lMode="u";drawL();});$("lC").addEventListener("click",()=>{lMode="c";drawL();});

/* ---------- the DLNM ---------- */
const xk=rcsKnots(TT,4),bx=x=>rcsRow(x,xk).map((v,i)=>i===0?(v-15)/10:v/10),nX=bx(10).length;
const lk=[0,2,7,21],cl=l=>[1].concat(rcsRow(l,lk).map(v=>v/21)),nC=cl(0).length;
const CL=[];for(let l=0;l<=LMAX;l++)CL.push(cl(l));
const W=IDX.map(t=>{const o=new Array(nX*nC).fill(0);for(let l=0;l<=LMAX;l++){const b=bx(TT[t-l]),c=CL[l];for(let j=0;j<nX;j++)for(let k=0;k<nC;k++)o[j*nC+k]+=b[j]*c[k];}return o;});
const FIT=glmFit(IDX.map((t,i)=>[1].concat(W[i],timeB[i],dowB[i])),y,"poisson"),PHI=Math.max(1,FIT.phi),NP=nX*nC;
const ETA=FIT.beta.slice(1,1+NP),VC=FIT.vcov.slice(1,1+NP).map(r=>r.slice(1,1+NP).map(v=>v*PHI));
const gradLag=(x,ref,l)=>{const b=bx(x),r=bx(ref),c=CL[l],g=new Array(NP).fill(0);for(let j=0;j<nX;j++)for(let k=0;k<nC;k++)g[j*nC+k]=(b[j]-r[j])*c[k];return g;};
const gradCum=(x,ref)=>{const g=new Array(NP).fill(0);for(let l=0;l<=LMAX;l++)gradLag(x,ref,l).forEach((v,i)=>g[i]+=v);return g;};
const dot=(g,e)=>g.reduce((s,v,i)=>s+v*e[i],0);
const XG=[];for(let x=-8;x<=30.0001;x+=0.25)XG.push(+x.toFixed(2));const inR=x=>x>=p01&&x<=p99;
const GX=XG.map(x=>gradCum(x,15));   /* precomputed once: curve for any coefficient vector = GX · eta */
function mmtOf(e){let m=null,mv=0;XG.forEach((x,i)=>{if(!inR(x))return;const v=dot(GX[i],e);if(m===null||v<mv){m=i;mv=v;}});return XG[m];}
const idxOf=x=>Math.max(0,Math.min(XG.length-1,Math.round((x+8)/0.25)));
const MMT=mmtOf(ETA);
/* approximate true cumulative curve for the city (simulation truth, using city-wide temperature) */
const wG=[0,1,2].map(g=>sum(DISTRICTS.map(d=>agePop(d,g)))*TRUTH_A.baseRate[g]),sH=sum(TRUTH_A.heatW),sC=sum(TRUTH_A.coldW);
const trueF=x=>Math.log(sum([0,1,2].map(g=>wG[g]*Math.exp(heatLogRR(x,g)*sH+coldLogRR(x,g)*sC)))/sum(wG));
const trueMin=(function(){let m=null;XG.forEach(x=>{if(inR(x)&&(m===null||trueF(x)<trueF(m)))m=x;});return m;})();

/* ---------- 16.2 surface and slices ---------- */
function drawS(){const ts=+$("sT").value,lg=+$("sLg").value;$("sTO").textContent=fmt(ts,1)+"°C";$("sLgO").textContent=lg;
  let svg=clear($("sMap")),F=frame(svg,520,300,{l:44,r:12,t:16,b:40},[-8,30],[-0.5,21.5]);xAxis(F,[-5,0,5,10,15,20,25,30],"temperature (°C)");
  [0,7,14,21].forEach(v=>txt(svg,F.m.l-6,F.Y(v)+4,String(v),{"text-anchor":"end"}));txt(svg,F.m.l,10,"lag (days), colored by relative risk vs the MMT ("+fmt(MMT,1)+"°C)",{});
  const cells=[],xs=[];for(let x=-8;x<=30;x+=1)xs.push(x);let mx=0;xs.forEach(x=>{for(let l=0;l<=LMAX;l++){const v=dot(gradLag(x,MMT,l),ETA);cells.push([x,l,v]);mx=Math.max(mx,Math.abs(v));}});
  cells.forEach(c=>{const a=Math.min(1,Math.abs(c[2])/mx);el("rect",{x:F.X(c[0]-0.5),y:F.Y(c[1]+0.5),width:F.X(1)-F.X(0)+0.5,height:F.Y(0)-F.Y(1)+0.5,fill:css(c[2]>=0?"--p2":"--p1"),"fill-opacity":(0.04+0.9*a).toFixed(2)},svg);});
  el("line",{x1:F.X(ts),x2:F.X(ts),y1:F.m.t,y2:F.Y(-0.5),stroke:css("--c-ink"),"stroke-width":1.6},svg);el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(lg),y2:F.Y(lg),stroke:css("--c-ink"),"stroke-width":1.6},svg);
  const pc=v=>100*(Math.exp(v)-1);
  const ls=[];for(let l=0;l<=LMAX;l++)ls.push(l);const lv=ls.map(l=>{const g=gradLag(ts,MMT,l);return {b:dot(g,ETA),se:Math.sqrt(quad(g,VC))};});
  let all=lv.flatMap(v=>[pc(v.b-1.96*v.se),pc(v.b+1.96*v.se)]),lo=Math.min(-2,Math.min.apply(null,all)),hi=Math.max(2,Math.max.apply(null,all));
  svg=clear($("sLag"));F=frame(svg,520,200,{l:44,r:12,t:16,b:36},[0,21],[lo,hi]);yGrid(F,niceTicks(lo,hi,4),v=>fmt(v,1));xAxis(F,[0,3,7,14,21],"lag (days)");txt(svg,F.m.l,10,"lag–response at "+fmt(ts,1)+"°C: % change in visits vs the MMT",{});
  el("polygon",{points:ls.map((l,i)=>F.X(l)+","+F.Y(pc(lv[i].b+1.96*lv[i].se))).concat(ls.slice().reverse().map(l=>F.X(l)+","+F.Y(pc(lv[l].b-1.96*lv[l].se)))).join(" "),fill:css("--p2"),"fill-opacity":0.15},svg);
  poly(F,ls,lv.map(v=>pc(v.b)),{stroke:css("--p2"),"stroke-width":2.4});el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  const ev=XG.map(x=>{const g=gradLag(x,MMT,lg);return {b:dot(g,ETA),se:Math.sqrt(quad(g,VC))};});all=ev.flatMap(v=>[pc(v.b-1.96*v.se),pc(v.b+1.96*v.se)]);lo=Math.min(-2,Math.min.apply(null,all));hi=Math.max(2,Math.max.apply(null,all));
  svg=clear($("sExp"));F=frame(svg,520,200,{l:44,r:12,t:16,b:36},[-8,30],[lo,hi]);yGrid(F,niceTicks(lo,hi,4),v=>fmt(v,1));xAxis(F,[-5,0,5,10,15,20,25,30],"temperature (°C)");txt(svg,F.m.l,10,"exposure–response at lag "+lg+": % change vs the MMT",{});
  el("polygon",{points:XG.map((x,i)=>F.X(x)+","+F.Y(pc(ev[i].b+1.96*ev[i].se))).concat(XG.slice().reverse().map((x,i)=>F.X(x)+","+F.Y(pc(ev[XG.length-1-i].b-1.96*ev[XG.length-1-i].se)))).join(" "),fill:css("--p1"),"fill-opacity":0.15},svg);
  poly(F,XG,ev.map(v=>pc(v.b)),{stroke:css("--p1"),"stroke-width":2.4});el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  const peak=lv.reduce((b,v,i)=>Math.abs(v.b)>Math.abs(lv[b].b)?i:b,0),hot=ts>MMT;
  setNow("sNow","The surface shows, for each temperature (across) and lag (up), the relative risk compared with a day at the MMT, "+fmt(MMT,1)+"°C. At <b>"+fmt(ts,1)+"°C</b> the effect "+(Math.abs(lv[peak].b)<0.003?"is negligible at every lag.":"peaks at lag "+peak+" ("+fmt(pc(lv[peak].b),1)+"%) and "+(hot?"fades within a few days, with a dip below zero afterwards (harvesting).":"is spread over one to two weeks: cold acts slowly."))+" At lag "+lg+", the exposure–response "+(lg<=2?"is dominated by heat.":lg>=4?"is dominated by cold; heat contributes little or even negatively.":"shows both heat and cold.")+" Move the sliders to compare a hot and a cold day.");}
["sT","sLg"].forEach(id=>$(id).addEventListener("input",drawS));

/* ---------- 16.3 cumulative curve and MMT ---------- */
let sims=null;
function drawC(){const showT=$("cTr").checked,pc=v=>Math.exp(v);
  const cv=XG.map(x=>{const g=gradCum(x,MMT);return {b:dot(g,ETA),se:Math.sqrt(quad(g,VC))};}),tm=trueF(trueMin);
  const svg=clear($("cPlot")),F=frame(svg,520,300,{l:44,r:12,t:16,b:40},[-8,30],[0.85,1.8]);yGrid(F,[0.9,1,1.2,1.4,1.6,1.8],v=>fmt(v,1));xAxis(F,[-5,0,5,10,15,20,25,30],"temperature (°C)");txt(svg,F.m.l,10,"cumulative relative risk over lags 0–21, vs the MMT",{});
  [[-8,p01],[p99,30]].forEach(r=>el("rect",{x:F.X(r[0]),y:F.m.t,width:F.X(r[1])-F.X(r[0]),height:F.Y(0.85)-F.m.t,fill:css("--c-soft")},svg));
  el("polygon",{points:XG.map((x,i)=>F.X(x)+","+F.Y(Math.min(1.8,pc(cv[i].b+1.96*cv[i].se)))).concat(XG.slice().reverse().map((x,i)=>F.X(x)+","+F.Y(Math.max(0.85,pc(cv[XG.length-1-i].b-1.96*cv[XG.length-1-i].se))))).join(" "),fill:css("--p1"),"fill-opacity":0.15},svg);
  poly(F,XG,cv.map(v=>pc(v.b)),{stroke:css("--p1"),"stroke-width":2.6});if(showT)poly(F,XG,XG.map(x=>Math.exp(trueF(x)-tm)),{stroke:css("--p4"),"stroke-width":2,"stroke-dasharray":"6 4"});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(1),y2:F.Y(1),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  el("line",{x1:F.X(MMT),x2:F.X(MMT),y1:F.Y(1),y2:F.Y(0.85),stroke:css("--p2"),"stroke-width":2},svg);txt(svg,F.X(MMT)+4,F.Y(0.87),"MMT "+fmt(MMT,1)+"°C",{style:"fill:"+css("--p2")});
  if(sims){el("rect",{x:F.X(sims.mlo),y:F.Y(0.86)-4,width:F.X(sims.mhi)-F.X(sims.mlo),height:6,fill:css("--p2"),"fill-opacity":0.5},svg);}
  const at=x=>{const g=gradCum(x,MMT);return {b:dot(g,ETA),se:Math.sqrt(quad(g,VC))};},h=at(p99),c=at(p01);
  const st=[["MMT",fmt(MMT,1)+"°C"+(sims?" ("+fmt(sims.mlo,1)+"–"+fmt(sims.mhi,1)+")":"")],["RR at 99th percentile ("+fmt(p99,1)+"°C)",fmt(pc(h.b),2)+" ("+fmt(pc(h.b-1.96*h.se),2)+"–"+fmt(pc(h.b+1.96*h.se),2)+")"],["RR at 1st percentile ("+fmt(p01,1)+"°C)",fmt(pc(c.b),2)+" ("+fmt(pc(c.b-1.96*c.se),2)+"–"+fmt(pc(c.b+1.96*c.se),2)+")"],["true MMT (simulation, approx.)",fmt(trueMin,1)+"°C"]];
  if(sims)st.push(["RR at P99 allowing for MMT uncertainty",fmt(sims.hmed,2)+" ("+fmt(sims.hlo,2)+"–"+fmt(sims.hhi,2)+")"]);
  $("cStats").innerHTML=st.map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const hs=clear($("cHist"));if(sims){const nb=30,lo=Math.min.apply(null,sims.m),hi=Math.max.apply(null,sims.m)+0.25,w=(hi-lo)/nb,cn=new Array(nb).fill(0);sims.m.forEach(v=>cn[Math.min(nb-1,Math.floor((v-lo)/w))]++);const cm=Math.max.apply(null,cn)*1.1,G=frame(hs,520,140,{l:44,r:12,t:16,b:30},[-8,30],[0,cm]);
    xAxis(G,[-5,0,5,10,15,20,25,30],null);txt(hs,G.m.l,10,"MMT in 500 simulations from the fitted coefficients",{});cn.forEach((k,i)=>el("rect",{x:G.X(lo+i*w),y:G.Y(k),width:Math.max(1,G.X(lo+w)-G.X(lo)-1),height:G.Y(0)-G.Y(k),fill:css("--p2"),"fill-opacity":0.7},hs));}
  else txt(hs,44,20,"Press Simulate to see the MMT's uncertainty.",{});
  setNow("cNow","Summed over three weeks of lags, the curve is J-shaped: the lowest risk is at <b>"+fmt(MMT,1)+"°C</b>. On a day at the 99th percentile ("+fmt(p99,1)+"°C) visits are "+fmt(100*(pc(h.b)-1),0)+"% higher than at the MMT, and on a day at the 1st percentile ("+fmt(p01,1)+"°C) "+fmt(100*(pc(c.b)-1),0)+"% higher. "+(showT?"The dashed green curve is the approximate truth from the simulation. ":"")+(sims?"In 500 simulations from the coefficients' sampling distribution, the MMT ranged from "+fmt(sims.mlo,1)+" to "+fmt(sims.mhi,1)+"°C (95%): much more uncertain than the narrow band at the reference suggests. Re-centering each simulation on its own MMT widens the interval for the heat RR from "+fmt(pc(h.b-1.96*h.se),2)+"–"+fmt(pc(h.b+1.96*h.se),2)+" to "+fmt(sims.hlo,2)+"–"+fmt(sims.hhi,2)+".":"Notice the band shrinks to nothing at the MMT: as if the MMT were known exactly. Press Simulate to see how uncertain it really is."));
  $("cReport").innerHTML="The minimum morbidity temperature was <b>"+fmt(MMT,1)+"°C"+(sims?" (95% simulation interval "+fmt(sims.mlo,1)+" to "+fmt(sims.mhi,1)+")":"")+"</b>. Relative to the MMT, the cumulative RR over lags 0–21 was "+fmt(pc(h.b),2)+" (95% CI "+fmt(pc(h.b-1.96*h.se),2)+" to "+fmt(pc(h.b+1.96*h.se),2)+") at the 99th temperature percentile and "+fmt(pc(c.b),2)+" ("+fmt(pc(c.b-1.96*c.se),2)+" to "+fmt(pc(c.b+1.96*c.se),2)+") at the 1st.";}
function draws(N,seed){const L=chol(VC),r=makeRng(seed),out=[];for(let s=0;s<N;s++){const z=ETA.map(()=>gaussFrom(r));out.push(ETA.map((e,i)=>e+L[i].reduce((q,v,k)=>q+v*z[k],0)));}return out;}
function simMMT(){const ds=draws(500,1616),m=[],h=[];const g99=gradCum(p99,15);ds.forEach(e=>{const mm=mmtOf(e);m.push(mm);h.push(Math.exp(dot(g99,e)-dot(GX[idxOf(mm)],e)));});m.sort((a,b)=>a-b);h.sort((a,b)=>a-b);
  sims={m:m,mlo:quantile(m,0.025),mhi:quantile(m,0.975),hmed:quantile(h,0.5),hlo:quantile(h,0.025),hhi:quantile(h,0.975)};drawC();}
$("cTr").addEventListener("change",drawC);$("cSim").addEventListener("click",simMMT);

/* ---------- 16.4 attributable fractions ---------- */
let af=null;
function runAF(){const temps=IDX.map(t=>TT[t]),G=temps.map(x=>gradCum(x,MMT)),tot=sum(y);
  const calc=e=>{let hh=0,cc=0,ex=0;temps.forEach((x,i)=>{const lr=Math.max(0,dot(G[i],e)),a=y[i]*(1-Math.exp(-lr));if(x>MMT){hh+=a;if(x>p975)ex+=a;}else cc+=a;});return {h:hh/tot,c:cc/tot,x:ex/tot};};
  const pt=calc(ETA),ds=draws(500,1717).map(calc),q=(k,p)=>quantile(ds.map(d=>d[k]),p);
  af={pt:pt,hl:q("h",0.025),hh:q("h",0.975),cl:q("c",0.025),ch:q("c",0.975),xl:q("x",0.025),xh:q("x",0.975),tot:tot,years:IDX.length/365.25};drawAF();}
function drawAF(){const svg=clear($("aPlot"));if(!af){txt(svg,20,20,"Press Compute.",{});$("aStats").innerHTML="";setNow("aNow","For each day, the share of visits attributable to its temperature is 1 − 1/RR, with the RR taken from the cumulative curve relative to the MMT.");return;}
  const rows=[["cold (below the MMT)",af.pt.c,af.cl,af.ch,"--p1"],["heat (above the MMT)",af.pt.h,af.hl,af.hh,"--p2"],["extreme heat (above 97.5th percentile)",af.pt.x,af.xl,af.xh,"--p5"]];
  const mx=Math.max.apply(null,rows.map(r=>r[3]))*1.15,F=frame(svg,520,220,{l:210,r:20,t:16,b:40},[0,mx],[0,4]);xAxis(F,niceTicks(0,mx,5),"attributable fraction of all visits",v=>fmt(100*v,1)+"%");
  rows.forEach((r,k)=>{const yy=F.Y(3-k);txt(svg,F.m.l-8,yy+4,r[0],{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("rect",{x:F.X(0),y:yy-10,width:F.X(r[1])-F.X(0),height:20,fill:css(r[4]),"fill-opacity":0.7},svg);el("line",{x1:F.X(r[2]),x2:F.X(r[3]),y1:yy,y2:yy,stroke:css("--c-ink"),"stroke-width":1.6},svg);});
  const perYear=v=>fmtInt(v*af.tot/af.years);
  $("aStats").innerHTML=[["cold-attributable",fmt(100*af.pt.c,2)+"% ("+fmt(100*af.cl,2)+"–"+fmt(100*af.ch,2)+")"],["heat-attributable",fmt(100*af.pt.h,2)+"% ("+fmt(100*af.hl,2)+"–"+fmt(100*af.hh,2)+")"],["visits per year due to cold / heat",perYear(af.pt.c)+" / "+perYear(af.pt.h)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("aNow","Relative to the MMT, <b>"+fmt(100*af.pt.c,1)+"%</b> of all emergency visits are attributable to cold and <b>"+fmt(100*af.pt.h,1)+"%</b> to heat: about "+perYear(af.pt.c)+" and "+perYear(af.pt.h)+" visits a year in this city. "+(af.pt.c>af.pt.h?"Cold accounts for more, even though heat's relative risks are steeper, because there are many more days below the MMT than far above it. ":"")+"Extreme heat days alone contribute "+fmt(100*af.pt.x,2)+"%. The intervals come from 500 simulations of the coefficients. As always, these fractions are causal claims: they assume the DLNM has captured the confounding by season and trend.");
  $("aReport").innerHTML="Relative to the minimum morbidity temperature, <b>"+fmt(100*af.pt.c,1)+"% (95% eCI "+fmt(100*af.cl,1)+" to "+fmt(100*af.ch,1)+") of emergency visits were attributable to cold and "+fmt(100*af.pt.h,1)+"% ("+fmt(100*af.hl,1)+" to "+fmt(100*af.hh,1)+") to heat</b>, over 2020–2024.";}
$("aRun").addEventListener("click",runAF);

setTimeout(()=>{drawL();drawS();drawC();drawAF();},10);
buildQuiz("quizzes",[
 {t:"epi",q:"In a distributed lag model for heat, coefficients at lags 3–6 are negative. The most likely explanation is:",o:[["Heat is protective a few days later","Not in a biological sense.",0],["Harvesting: some visits on hot days were brought forward from the following days","The deficit afterwards offsets part of the initial excess.",1],["The model is wrong","Negative later coefficients are a common, interpretable pattern.",0],["Day-of-week confounding","Day of week is adjusted for and doesn't explain a lag pattern.",0]]},
 {t:"stat",q:"Why are unconstrained lag coefficients so imprecise?",o:[["Because there are too few days","There are many days; the problem is correlation.",0],["Because temperatures on neighboring days are highly correlated, so their separate effects are hard to distinguish","The same collinearity problem as correlated exposures in Lesson 7.",1],["Because the outcome is overdispersed","Overdispersion widens all intervals, but isn't the main cause here.",0],["Because lags are nonlinear","Unconstrained DLMs are linear in each lag.",0]]},
 {t:"stat",q:"A cross-basis in a DLNM is:",o:[["A spline of time","That's the seasonal control.",0],["The combination of a basis for the exposure and a basis for the lag, giving variables that describe both dimensions at once","Its coefficients define the whole exposure–lag–response surface.",1],["A list of lagged temperatures","That's an unconstrained DLM.",0],["The confidence band around the curve","It's a design matrix, not a band.",0]]},
 {t:"epi",q:"A paper reports \"RR 1.35 (95% CI 1.20 to 1.52) at the 99th percentile relative to the MMT of 19°C\", but gives no interval for the MMT. What's missing?",o:[["Nothing; the MMT is a fixed reference","The MMT is estimated from the data.",0],["The uncertainty of the MMT, which the RR's interval ignores","Report the MMT with an interval from simulation or bootstrap.",1],["The p-value","An interval is more informative than a p-value here.",0],["The number of knots","Useful, but not what makes the interval misleading.",0]]},
 {t:"epi",q:"Cold has smaller relative risks per degree than heat, yet more visits are attributable to cold. Why?",o:[["Because cold relative risks are wrong","They may be correct.",0],["Because many more days are below the MMT than far above it, and cold's effect is spread over many lags","Attributable burden depends on how often the exposure occurs, not only on the RR.",1],["Because heat effects are harvested completely","Harvesting reduces heat's burden, but doesn't explain the comparison alone.",0],["Because cold is measured with less error","Measurement error isn't the explanation here.",0]]},
 {t:"stat",q:"The cumulative effect over lags 0–21 is more stable than any single lag's estimate because:",o:[["It uses fewer days","It uses the same days.",0],["Errors in neighboring lag estimates are negatively correlated and largely cancel in the sum","Collinear lags trade off against each other, but their total is well estimated.",1],["It ignores harvesting","It includes harvesting, which is part of why it is smaller.",0],["It is computed on the log scale","The scale isn't the reason.",0]]}]);
onTheme(()=>{drawL();drawS();drawC();drawAF();});
});
