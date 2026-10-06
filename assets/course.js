"use strict";
/* ---------- random numbers (identical in every lesson and in the CSV export) ---------- */
const COURSE_SEED = 20250101;
function makeRng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}
function gaussFrom(r){let u=r();if(u<1e-12)u=1e-12;return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
function poisFrom(r,l){if(l<=0)return 0;if(l<60){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=r();}while(p>L);return k-1;}return Math.max(0,Math.round(l+Math.sqrt(l)*gaussFrom(r)));}
function gammaFrom(r,shape){const d=shape-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=gaussFrom(r);v=1+c*x;}while(v<=0);v=v*v*v;const u=r();if(u<1-0.0331*x*x*x*x)return d*v;if(Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return d*v;}}
const expit=x=>1/(1+Math.exp(-x));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---------- the city ---------- */
const DISTRICTS=[
 {id:1, name:"Northgate",   col:0,row:0,pop:48000, p014:.17,p65:.16,dep:.35,green:.55,traffic:.35,uhi:.3},
 {id:2, name:"Hillcrest",   col:1,row:0,pop:36000, p014:.18,p65:.22,dep:.15,green:.70,traffic:.20,uhi:.1},
 {id:3, name:"Millbrook",   col:2,row:0,pop:52000, p014:.19,p65:.14,dep:.55,green:.40,traffic:.45,uhi:.5},
 {id:4, name:"Eastfield",   col:3,row:0,pop:29000, p014:.20,p65:.13,dep:.65,green:.35,traffic:.40,uhi:.4},
 {id:5, name:"Westbank",    col:0,row:1,pop:61000, p014:.16,p65:.19,dep:.30,green:.50,traffic:.50,uhi:.7},
 {id:6, name:"Old Town",    col:1,row:1,pop:142000,p014:.11,p65:.15,dep:.45,green:.15,traffic:.90,uhi:1.6},
 {id:7, name:"Station",     col:2,row:1,pop:88000, p014:.13,p65:.10,dep:.70,green:.20,traffic:.85,uhi:1.3},
 {id:8, name:"Riverside",   col:3,row:1,pop:44000, p014:.17,p65:.20,dep:.40,green:.60,traffic:.30,uhi:.4},
 {id:9, name:"Greenmeadow", col:0,row:2,pop:31000, p014:.21,p65:.17,dep:.10,green:.85,traffic:.10,uhi:0},
 {id:10,name:"Southport",   col:1,row:2,pop:67000, p014:.15,p65:.24,dep:.60,green:.30,traffic:.65,uhi:.9},
 {id:11,name:"Lakeside",    col:2,row:2,pop:26000, p014:.14,p65:.30,dep:.20,green:.75,traffic:.15,uhi:.1},
 {id:12,name:"Harbour",     col:3,row:2,pop:39000, p014:.16,p65:.18,dep:.80,green:.25,traffic:.70,uhi:.8}];
const AGE_GROUPS=["0-14","15-64","65+"];
function agePop(d,g){return Math.round(d.pop*(g===0?d.p014:g===2?d.p65:1-d.p014-d.p65));}
const NEIGHBORS=DISTRICTS.map(a=>DISTRICTS.filter(b=>b!==a&&Math.abs(a.col-b.col)<=1&&Math.abs(a.row-b.row)<=1).map(b=>b.id));
function mapPolygons(W,H){const r=makeRng(77),nc=5,nr=4,pts=[];for(let j=0;j<nr;j++){pts.push([]);for(let i=0;i<nc;i++){const edge=i===0||i===nc-1||j===0||j===nr-1;const jx=edge&&(i===0||i===nc-1)?0:(r()-0.5)*0.36,jy=edge&&(j===0||j===nr-1)?0:(r()-0.5)*0.36;pts[j].push([(i+jx)/(nc-1)*W,(j+jy)/(nr-1)*H]);}}
  return DISTRICTS.map(d=>{const c=d.col,w=d.row;return [pts[w][c],pts[w][c+1],pts[w+1][c+1],pts[w+1][c]];});}

/* ---------- Example A: heat and emergency visits ---------- */
const TRUTH_A={baseRate:[0.55,0.45,0.95],mmt:[21,21,19.5],heat:[0.004,0.006,0.012],heatPow:1.4,cold:[0.006,0.006,0.010],coldPow:1.2,
  heatW:[0.42,0.28,0.16,0.09,-0.02,-0.03,-0.03,-0.02],pmPer1:0.006,dow:[-0.08,0.12,0.04,0,0,0.02,-0.06],holiday:-0.05,seasonAmp:0.08,trendPerYear:0.015,dep:0.25,phi:40};
(function(){const w=[];let s=0;for(let l=0;l<=21;l++){const v=l===0?0:Math.exp(-(l-4)*(l-4)/40);w.push(v);s+=v;}TRUTH_A.coldW=w.map(v=>v/s);})();
function heatLogRR(T,g){return TRUTH_A.heat[g]*Math.pow(Math.max(0,T-TRUTH_A.mmt[g]),TRUTH_A.heatPow);}
function coldLogRR(T,g){return TRUTH_A.cold[g]*Math.pow(Math.max(0,TRUTH_A.mmt[g]-T),TRUTH_A.coldPow);}
const HOLIDAYS=["01-01","05-01","08-01","12-24","12-25","12-26","12-31"];
function genA(){const r=makeRng(COURSE_SEED),ND=1827,days=[];const t0=Date.UTC(2020,0,1);
  let e=0,a=0;const z=DISTRICTS.map(()=>gaussFrom(r));
  const uSp=DISTRICTS.map((d,k)=>{const nb=NEIGHBORS[k].map(id=>z[id-1]);return 0.08*(0.6*z[k]+0.4*nb.reduce((s,v)=>s+v,0)/nb.length);});
  for(let t=0;t<ND;t++){const dt=new Date(t0+t*864e5),iso=dt.toISOString().slice(0,10),y=dt.getUTCFullYear(),doy=Math.floor((dt-Date.UTC(y,0,1))/864e5)+1;
    e=0.75*e+2.8*Math.sqrt(1-0.5625)*gaussFrom(r);const T=12+10.5*Math.sin(2*Math.PI*(doy-110)/365.25)+0.05*t/365.25+e;
    a=0.6*a+0.3*Math.sqrt(1-0.36)*gaussFrom(r);const pm=Math.exp(Math.log(12)+0.30*Math.cos(2*Math.PI*(doy-15)/365.25)+0.015*Math.max(0,T-24)+a);
    days.push({t:t,date:iso,year:y,doy:doy,dow:dt.getUTCDay(),holiday:HOLIDAYS.indexOf(iso.slice(5))>=0?1:0,temp_city:T,pm25:pm});}
  const summer=dd=>Math.max(0,Math.sin(2*Math.PI*(dd.doy-110)/365.25));
  const tempD=DISTRICTS.map(d=>days.map(dd=>dd.temp_city+d.uhi*(0.6+0.4*summer(dd))+0.3*gaussFrom(r)));
  const rows=[];
  for(let k=0;k<DISTRICTS.length;k++){const d=DISTRICTS[k];for(let g=0;g<3;g++){const pop=agePop(d,g);
    for(let t=0;t<ND;t++){const dd=days[t];let lt=0;
      for(let l=0;l<TRUTH_A.heatW.length;l++)lt+=TRUTH_A.heatW[l]*heatLogRR(tempD[k][Math.max(0,t-l)],g);
      for(let l=1;l<TRUTH_A.coldW.length;l++)lt+=TRUTH_A.coldW[l]*coldLogRR(tempD[k][Math.max(0,t-l)],g);
      const pmLag=(dd.pm25+days[Math.max(0,t-1)].pm25)/2;
      const eta=Math.log(pop/1000*TRUTH_A.baseRate[g])+TRUTH_A.dow[dd.dow]+TRUTH_A.holiday*dd.holiday+TRUTH_A.seasonAmp*Math.cos(2*Math.PI*(dd.doy-15)/365.25)+TRUTH_A.trendPerYear*t/365.25+uSp[k]+TRUTH_A.dep*(d.dep-0.45)+lt+TRUTH_A.pmPer1*(pmLag-12);
      const mu=Math.exp(eta)*gammaFrom(r,TRUTH_A.phi)/TRUTH_A.phi;
      rows.push({date:dd.date,t:t,year:dd.year,doy:dd.doy,dow:dd.dow,holiday:dd.holiday,district:d.name,district_id:d.id,age_group:AGE_GROUPS[g],g:g,pop:pop,visits:poisFrom(r,mu),temp:tempD[k][t],temp_city:dd.temp_city,pm25:dd.pm25});}}}
  return {days:days,rows:rows,tempD:tempD,uSp:uSp};}

/* ---------- Example B: NO2 and childhood asthma ---------- */
var B_SEED=1;
const TRUTH_B={n:5000,orPer10:1.15,int:-2.25,ses:-0.25,smoke:0.45,green:-0.4,boy:0.25,schoolSD:0.25,errSD:5,persSD:2,sens:0.85,spec:0.90};
function genB(seedOffset){const r=makeRng(COURSE_SEED+(seedOffset===undefined?B_SEED:seedOffset));const kids=DISTRICTS.map(d=>agePop(d,0)),tot=kids.reduce((s,v)=>s+v,0);
  let ns=kids.map(k=>Math.max(2,Math.round(40*k/tot)));while(ns.reduce((s,v)=>s+v,0)>40){const i=ns.indexOf(Math.max.apply(null,ns));ns[i]--;}while(ns.reduce((s,v)=>s+v,0)<40){const i=ns.indexOf(Math.max.apply(null,ns));ns[i]++;}
  const schools=[];DISTRICTS.forEach((d,k)=>{const first=schools.length;for(let s=0;s<ns[k];s++)schools.push({id:schools.length+1,district_id:d.id,re:TRUTH_B.schoolSD*gaussFrom(r)});
    /* school effects are centered within each district, so they don't confound district-level exposures */
    const grp=schools.slice(first),m=grp.reduce((a,b)=>a+b.re,0)/grp.length;grp.forEach(sc=>{sc.re-=m;});});
  const cum=[];let c=0;kids.forEach(v=>{c+=v/tot;cum.push(c);});
  const out=[];
  for(let i=0;i<TRUTH_B.n;i++){const u=r();let k=0;while(k<11&&u>cum[k])k++;const d=DISTRICTS[k];
    const sch=schools.filter(s=>s.district_id===d.id);const school=sch[Math.floor(r()*sch.length)];
    const boy=r()<0.51?1:0;const ses=-1.2*(d.dep-0.45)+0.9*gaussFrom(r);const smoke=r()<expit(-1.3-0.6*ses)?1:0;
    const green=clamp(d.green+0.12*gaussFrom(r),0,1);
    const no2=Math.max(6,14+26*d.traffic-10*(green-0.5)-1.2*ses+4*gaussFrom(r));
    const no2m=Math.max(4,no2+TRUTH_B.errSD*gaussFrom(r));
    const val=r()<0.06?1:0;const pers=val?Math.max(3,no2+TRUTH_B.persSD*gaussFrom(r)):null;
    const lp=TRUTH_B.int+Math.log(TRUTH_B.orPer10)*(no2-25)/10+TRUTH_B.ses*ses+TRUTH_B.smoke*smoke+TRUTH_B.green*(green-0.5)+TRUTH_B.boy*boy+school.re;
    const asthma=r()<expit(lp)?1:0;const wheeze=asthma?(r()<TRUTH_B.sens?1:0):(r()<1-TRUTH_B.spec?1:0);
    out.push({child_id:i+1,district:d.name,district_id:d.id,school:school.id,sex:boy?"boy":"girl",ses:ses,parent_smoke:smoke,green:green,no2_true:no2,no2_modeled:no2m,validation:val,no2_personal:pers,wheeze_q:wheeze,asthma:asthma});}
  return {children:out,schools:schools};}

/* ---------- small statistics helpers ---------- */
const sum=a=>a.reduce((s,v)=>s+v,0), mean=a=>sum(a)/a.length;
function sd(a){const m=mean(a);return Math.sqrt(sum(a.map(v=>(v-m)*(v-m)))/(a.length-1));}
function quantile(a,p){const s=a.slice().sort((x,y)=>x-y),i=(s.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return s[lo]+(s[hi]-s[lo])*(i-lo);}
const fmt=(v,d)=>Number(v).toFixed(d===undefined?1:d);
const fmtInt=v=>Math.round(v).toLocaleString("en-US");


/* ---------- modeling engine: linear algebra, lm, glm, splines, distributions ---------- */
function matSolve(A,b){const n=A.length,M=A.map((r,i)=>r.slice().concat([b[i]]));
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;const t=M[c];M[c]=M[p];M[p]=t;
    const d=M[c][c];if(Math.abs(d)<1e-14)throw new Error("singular matrix");for(let j=c;j<=n;j++)M[c][j]/=d;
    for(let r=0;r<n;r++)if(r!==c){const f=M[r][c];if(f!==0)for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j];}}
  return M.map(r=>r[n]);}
function matInv(A){const n=A.length;const out=[];for(let j=0;j<n;j++){const e=new Array(n).fill(0);e[j]=1;out.push(matSolve(A,e));}return A.map((_,i)=>out.map(col=>col[i]));}
function crossprod(X,w){const p=X[0].length,M=[];for(let a=0;a<p;a++)M.push(new Array(p).fill(0));
  for(let i=0;i<X.length;i++){const xi=X[i],wi=w?w[i]:1;for(let a=0;a<p;a++){const v=xi[a]*wi;if(v===0)continue;for(let b=a;b<p;b++)M[a][b]+=v*xi[b];}}
  for(let a=0;a<p;a++)for(let b=0;b<a;b++)M[a][b]=M[b][a];return M;}
function lmFit(X,y,penalty){const n=X.length,p=X[0].length,XtX=crossprod(X);if(penalty)for(let a=0;a<p;a++)for(let b=0;b<p;b++)XtX[a][b]+=penalty[a][b];
  const Xty=new Array(p).fill(0);for(let i=0;i<n;i++)for(let a=0;a<p;a++)Xty[a]+=X[i][a]*y[i];
  const beta=matSolve(XtX,Xty),fit=X.map(r=>r.reduce((s,v,a)=>s+v*beta[a],0)),res=y.map((v,i)=>v-fit[i]);
  const rss=res.reduce((s,v)=>s+v*v,0),sigma2=rss/(n-p),inv=matInv(XtX),vcov=inv.map(r=>r.map(v=>v*sigma2));
  const ybar=mean(y),tss=y.reduce((s,v)=>s+(v-ybar)*(v-ybar),0);
  return {beta:beta,se:vcov.map((r,a)=>Math.sqrt(r[a])),vcov:vcov,fitted:fit,resid:res,rss:rss,sigma:Math.sqrt(sigma2),r2:1-rss/tss,n:n,p:p,inv:inv};}
/* GLM by iteratively reweighted least squares. family: "poisson" (log link) or "binomial" (logit link) */
function glmFit(X,y,family,opt){opt=opt||{};const n=X.length,p=X[0].length,off=opt.offset||null,pen=opt.penalty||null;
  let beta=opt.start||new Array(p).fill(0);
  if(!opt.start){const yb=mean(y);beta[0]=family==="poisson"?Math.log(Math.max(1e-8,yb))-(off?mean(off):0):Math.log(Math.max(1e-6,yb)/(1-Math.min(1-1e-6,yb)));}
  let dev=Infinity,it=0,conv=false,mu=null,eta=null;
  for(it=1;it<=(opt.maxit||50);it++){eta=X.map((r,i)=>r.reduce((s,v,a)=>s+v*beta[a],0)+(off?off[i]:0));
    mu=eta.map(e=>family==="poisson"?Math.exp(Math.min(e,30)):1/(1+Math.exp(-e)));
    const w=mu.map(m=>family==="poisson"?m:Math.max(1e-10,m*(1-m))),z=eta.map((e,i)=>e-(off?off[i]:0)+(y[i]-mu[i])/w[i]);
    const XtWX=crossprod(X,w);if(pen)for(let a=0;a<p;a++)for(let b=0;b<p;b++)XtWX[a][b]+=pen[a][b];
    const XtWz=new Array(p).fill(0);for(let i=0;i<n;i++){const wz=w[i]*z[i];for(let a=0;a<p;a++)XtWz[a]+=X[i][a]*wz;}
    let nb;try{nb=matSolve(XtWX,XtWz);}catch(e){return {failed:true,message:e.message,iterations:it};}
    beta=nb;eta=X.map((r,i)=>r.reduce((s,v,a)=>s+v*beta[a],0)+(off?off[i]:0));mu=eta.map(e=>family==="poisson"?Math.exp(Math.min(e,30)):1/(1+Math.exp(-e)));
    const nd=glmDeviance(y,mu,family);if(Math.abs(nd-dev)/(Math.abs(nd)+0.1)<1e-9){dev=nd;conv=true;break;}dev=nd;}
  const w=mu.map(m=>family==="poisson"?m:Math.max(1e-10,m*(1-m))),info=crossprod(X,w);if(pen)for(let a=0;a<p;a++)for(let b=0;b<p;b++)info[a][b]+=pen[a][b];
  const vcov=matInv(info),pear=y.map((v,i)=>(v-mu[i])/Math.sqrt(w[i])),phi=pear.reduce((s,v)=>s+v*v,0)/(n-p);
  let ll=0;for(let i=0;i<n;i++)ll+=family==="poisson"?(y[i]*Math.log(Math.max(mu[i],1e-300))-mu[i]-lfact(y[i])):(y[i]?Math.log(Math.max(mu[i],1e-300)):Math.log(Math.max(1-mu[i],1e-300)));
  let edf=p;if(pen){const unpen=matInv(info),A=crossprod(X,w);edf=0;for(let a=0;a<p;a++)for(let b=0;b<p;b++)edf+=unpen[a][b]*A[b][a];}
  return {beta:beta,vcov:vcov,se:vcov.map((r,a)=>Math.sqrt(r[a])),mu:mu,eta:eta,deviance:dev,loglik:ll,aic:-2*ll+2*edf,edf:edf,phi:phi,pearson:pear,iterations:it,converged:conv,n:n,p:p};}
function glmDeviance(y,mu,family){let d=0;for(let i=0;i<y.length;i++){if(family==="poisson")d+=2*((y[i]>0?y[i]*Math.log(y[i]/mu[i]):0)-(y[i]-mu[i]));else d+=-2*(y[i]?Math.log(Math.max(mu[i],1e-300)):Math.log(Math.max(1-mu[i],1e-300)));}return d;}
var LFACT=[0];function lfact(k){while(LFACT.length<=k)LFACT.push(LFACT[LFACT.length-1]+Math.log(LFACT.length));return LFACT[k];}
/* restricted (natural) cubic spline basis, Harrell's parameterization: columns x, then K-2 nonlinear terms */
function rcsKnots(x,K){const P={3:[.1,.5,.9],4:[.05,.35,.65,.95],5:[.05,.275,.5,.725,.95],6:[.05,.23,.41,.59,.77,.95],7:[.025,.1833,.3417,.5,.6583,.8167,.975]};
  const pr=P[K]||Array.from({length:K},(_,i)=>0.05+0.9*i/(K-1));const s=x.slice().sort((a,b)=>a-b);return pr.map(p=>s[Math.floor(p*(s.length-1))]);}
function rcsRow(x,k){const K=k.length,sc=Math.pow(k[K-1]-k[0],2),cube=v=>v>0?v*v*v:0,out=[x];
  for(let j=0;j<K-2;j++)out.push((cube(x-k[j])-cube(x-k[K-2])*(k[K-1]-k[j])/(k[K-1]-k[K-2])+cube(x-k[K-1])*(k[K-2]-k[j])/(k[K-1]-k[K-2]))/sc);return out;}
/* distributions */
function erfc_(x){const t=1/(1+0.5*Math.abs(x)),y=t*Math.exp(-x*x-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?y:2-y;}
function pnormStd(z){return 0.5*erfc_(-z/Math.SQRT2);}
function qnormStd(p){let lo=-12,hi=12;for(let i=0;i<90;i++){const m=(lo+hi)/2;if(pnormStd(m)<p)lo=m;else hi=m;}return (lo+hi)/2;}
function lgammaFn(x){const c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lgammaFn(1-x);x-=1;let a=c[0];const t=x+7.5;for(let i=1;i<9;i++)a+=c[i]/(x+i);return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);}
/* upper tail of chi-square with df degrees of freedom (regularized incomplete gamma) */
function pchisqUpper(x,df){if(x<=0)return 1;const a=df/2,z=x/2;
  if(z<a+1){let s=1/a,t=1/a;for(let n=1;n<500;n++){t*=z/(a+n);s+=t;if(t<s*1e-15)break;}return Math.max(0,1-s*Math.exp(-z+a*Math.log(z)-lgammaFn(a)));}
  let b=z+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<500;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-15)break;}
  return Math.exp(-z+a*Math.log(z)-lgammaFn(a))*h;}
function pFmt(p){return p<0.001?"<0.001":p<0.01?fmt(p,3):fmt(p,2);}

if(typeof module!=="undefined"){module.exports={genBseed:o=>genB(o),matSolve,matInv,lmFit,glmFit,rcsKnots,rcsRow,pchisqUpper,pnormStd,qnormStd,COURSE_SEED,makeRng,gaussFrom,poisFrom,gammaFrom,DISTRICTS,AGE_GROUPS,agePop,NEIGHBORS,genA,genB,TRUTH_A,TRUTH_B,mean,sd,quantile};}

/* ---------- browser-only: plotting helpers and lesson components ---------- */
if(typeof document!=="undefined"){
var NS="http://www.w3.org/2000/svg";
var el=function(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;};
var txt=function(p,x,y,s,a){const t=el("text",Object.assign({x:x,y:y},a||{}),p);t.textContent=s;return t;};
var clear=function(s){while(s.firstChild)s.removeChild(s.firstChild);return s;};
/* colors follow Quarto's light/dark toggle, which sets a class on <body> */
var css=function(n){return getComputedStyle(document.body).getPropertyValue(n).trim();};
var frame=function(svg,w,h,m,xr,yr){return{X:v=>m.l+(v-xr[0])/(xr[1]-xr[0])*(w-m.l-m.r),Y:v=>h-m.b-(v-yr[0])/(yr[1]-yr[0])*(h-m.t-m.b),w:w,h:h,m:m,xr:xr,yr:yr,svg:svg};};
var xAxis=function(F,ticks,label,f){const y=F.h-F.m.b;el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:y,y2:y,class:"axis"},F.svg);ticks.forEach(t=>{el("line",{x1:F.X(t),x2:F.X(t),y1:y,y2:y+4,class:"axis"},F.svg);txt(F.svg,F.X(t),y+16,f?f(t):String(t),{"text-anchor":"middle"});});if(label)txt(F.svg,(F.m.l+F.w-F.m.r)/2,y+31,label,{"text-anchor":"middle"});};
var yGrid=function(F,ticks,f){ticks.forEach(t=>{el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(t),y2:F.Y(t),class:"grid"},F.svg);txt(F.svg,F.m.l-6,F.Y(t)+4,f?f(t):String(t),{"text-anchor":"end"});});};
var poly=function(F,xs,ys,a){const p=[];for(let i=0;i<xs.length;i++){const y=Math.max(F.yr[0],Math.min(F.yr[1],ys[i]));p.push(F.X(xs[i]).toFixed(1)+","+F.Y(y).toFixed(1));}return el("polyline",Object.assign({points:p.join(" "),fill:"none"},a),F.svg);};
var niceTicks=function(lo,hi,n){const span=hi-lo,step0=span/(n||5),mag=Math.pow(10,Math.floor(Math.log10(step0))),f=step0/mag,step=(f<1.5?1:f<3?2:f<7?5:10)*mag;const out=[];for(let v=Math.ceil(lo/step)*step;v<=hi+1e-9;v+=step)out.push(+v.toFixed(10));return out;};
var setNow=function(id,h){const e=document.getElementById(id);if(e)e.innerHTML='<span class="hdr">What\'s happening</span>'+h;};

/* redraw charts when the reader switches between light and dark mode */
var onTheme=function(cb){let last=document.body.className;new MutationObserver(()=>{if(document.body.className!==last){last=document.body.className;setTimeout(cb,30);}}).observe(document.body,{attributes:true,attributeFilter:["class"]});};

/* quizzes: labels carry data-ok="1" on the right answer and data-fb on every option */
var buildQuiz=function(containerId,Q){const qz=document.getElementById(containerId);if(!qz)return;
  Q.forEach((x,i)=>{const d=document.createElement("div");d.className="quiz";
    d.innerHTML="<div class='qn'>Question "+(i+1)+"<span class='tagq'>"+(x.t==="epi"?"epidemiology":"statistics")+"</span></div><p class='qtext'>"+x.q+"</p>"+
      x.o.map((o,j)=>"<label data-ok='"+o[2]+"' data-fb='"+o[1].replace(/'/g,"&#39;")+"'><input type='radio' name='"+containerId+"-q"+i+"' value='"+j+"'><span>"+o[0]+"</span></label>").join("")+
      "<button type='button' class='qcheck'>Check answer</button><p class='qerr' role='alert'></p><div class='qfb' aria-live='polite'></div>";qz.appendChild(d);});
  initQuizzes();};
var initQuizzes=function(){document.querySelectorAll(".quiz").forEach(q=>{if(q.dataset.ready)return;q.dataset.ready="1";const btn=q.querySelector(".qcheck"),err=q.querySelector(".qerr"),fb=q.querySelector(".qfb");
  q.querySelectorAll("input").forEach(i=>i.addEventListener("change",()=>{err.textContent="";}));
  btn.addEventListener("click",()=>{const sel=q.querySelector("input:checked");if(!sel){err.textContent="Choose an answer first.";fb.className="qfb";return;}
    const lab=sel.closest("label"),ok=lab.dataset.ok==="1";const right=q.querySelector('label[data-ok="1"]');
    fb.className="qfb "+(ok?"ok":"no");fb.innerHTML=(ok?"<b>Correct.</b> ":"<b>Not quite.</b> ")+(lab.dataset.fb||"")+(ok||!right?"":" <br><span class='small'>The best answer: "+right.textContent.trim()+"</span>");});});};

/* progress, kept in this browser only */
var PROGRESS_KEY="stats-epi-course-progress";
var getProgress=function(){try{return JSON.parse(localStorage.getItem(PROGRESS_KEY)||"{}");}catch(e){return {};}};
var setDone=function(id,v){try{const p=getProgress();if(v)p[id]=Date.now();else delete p[id];localStorage.setItem(PROGRESS_KEY,JSON.stringify(p));}catch(e){}};
var initDone=function(){document.querySelectorAll(".done").forEach(box=>{if(box.dataset.ready)return;box.dataset.ready="1";const id=box.dataset.lesson,b=box.querySelector("button"),s=box.querySelector("span");
  const paint=()=>{const on=!!getProgress()[id];box.classList.toggle("ok",on);b.textContent=on?"Mark as not complete":"Mark this lesson as complete";s.textContent=on?"Completed. Your progress shows on the course home page (stored in this browser only).":"Finished? Mark the lesson as complete to track your progress.";};
  b.addEventListener("click",()=>{setDone(id,!getProgress()[id]);paint();});paint();});};

/* the course map: update AVAILABLE as batches are published */
var COURSE_LESSONS=[[0,"Welcome: the city, the data and how to use the course","I"],[1,"Describing data and epidemiological measures","I"],[2,"Probability and conditional probability","I"],[3,"Random variables and probability distributions","I"],[4,"Sampling, sampling distributions and the central limit theorem","I"],[5,"Likelihood and estimation","I"],[6,"Confidence intervals and hypothesis tests","I"],
 [7,"Linear regression","II"],[8,"Generalized linear models: logistic and Poisson regression","II"],[9,"Confounding, effect modification and interaction","II"],[10,"Model checking, comparison and selection","II"],[11,"Nonlinear effects: categories, polynomials, splines and GAMs","II"],
 [12,"Causal inference: from association to effect","III"],[13,"Measurement error and misclassification","III"],[14,"Measuring disease burden","III"],
 [15,"Time-series regression for health data","IV"],[16,"Distributed lag and distributed lag non-linear models","IV"],[17,"Spatial data and spatial autocorrelation","IV"],[18,"Clustered data and mixed-effects models","IV"],
 [19,"Bayesian thinking: from Bayes' rule to a model equation","V"],[20,"Priors: choosing, eliciting and checking them","V"],[21,"Computing the posterior: MCMC and its diagnostics","V"],[22,"Bayesian regression and GLMs","V"],[23,"Bayesian hypothesis testing and model comparison","V"],[24,"Bayesian hierarchical models","V"],[25,"Capstone: Bayesian spatio-temporal hierarchical models","V"]];
var COURSE_PARTS={I:["Foundations: data, probability and inference","--p1"],II:["Frequentist regression","--p2"],III:["Causal inference, measurement and disease burden","--p5"],IV:["Time, space and clustering","--p3"],V:["Bayesian modeling","--p4"]};
var COURSE_AVAILABLE=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
var lessonHref=function(n){return "lesson-"+String(n).padStart(2,"0")+".html";};
var buildHome=function(){const g=document.getElementById("lessonGrid");if(!g)return;const p=getProgress();let html="",done=0;
  Object.keys(COURSE_PARTS).forEach(k=>{const part=COURSE_PARTS[k];html+="<section class='lpart' style='--pc:var("+part[1]+")'><div class='plab'>Part "+k+"</div><h3>"+part[0]+"</h3><div class='lgrid'>";
    COURSE_LESSONS.filter(l=>l[2]===k).forEach(l=>{const on=COURSE_AVAILABLE.indexOf(l[0])>=0,id="lesson-"+String(l[0]).padStart(2,"0"),c=on&&p[id];if(c)done++;
      html+=on?"<a class='lcard on"+(c?" complete":"")+"' href='"+lessonHref(l[0])+"'><span class='ln'>"+l[0]+"</span><span class='lt'>"+l[1]+"</span><span class='ls'>"+(c?"Completed":"Available")+"</span></a>":"<div class='lcard'><span class='ln'>"+l[0]+"</span><span class='lt'>"+l[1]+"</span><span class='ls'>Coming soon</span></div>";});
    html+="</div></section>";});
  g.innerHTML=html;const t=COURSE_LESSONS.length;const bar=document.getElementById("pbar"),tx=document.getElementById("ptxt");if(bar)bar.style.width=(100*done/t)+"%";if(tx)tx.textContent=done+" of "+t+" lessons completed";};

document.addEventListener("DOMContentLoaded",function(){initQuizzes();initDone();buildHome();});
}
