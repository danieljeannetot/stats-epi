/* playground-specs-2.js — "Try it" playgrounds for Lessons 12–27 and the study design lesson. */
(function(){if(!window.PG)return;
const F=PG.fmt;let _A=null,_B=null;const DA=()=>_A||(_A=genA()),DB=()=>_B||(_B=genB());
const K=(key,label,min,max,step,value,unit,valid,ok,why,integer)=>({key:key,label:label,min:min,max:max,step:step,value:value,unit:unit,valid:valid,ok:ok,why:why,integer:integer});
const ex=v=>1/(1+Math.exp(-v)),pct=(v,d)=>F(100*v,d===undefined?1:d)+"%",sg=v=>(v<0?"− ":"+ ")+F(Math.abs(v));
const mm=a=>{let lo=Infinity,hi=-Infinity;for(const x of a){if(x<lo)lo=x;if(x>hi)hi=x;}return [lo,hi];};
const thin=(a,n)=>{const o=[],s=Math.max(1,Math.floor(a.length/n));for(let i=0;i<a.length;i+=s)o.push(a[i]);return o;};
const L=n=>({lesson:"Lesson "+n,href:"lesson-"+String(n).padStart(2,"0")+".html"});
const PWHY={red:"impossible: a probability must lie between 0 and 1",amber:"possible, but unusual for this setting",green:"plausible"};
const RRWHY={red:"impossible: ratios must be positive",amber:"a very large ratio, rare in environmental epidemiology",green:"plausible"};
const TWHY=r=>({red:"impossible on Earth: the records are about −89°C and 57°C",amber:"never observed in this city: extrapolation",green:"within the city's observed range"});
const dn=(x,m,s)=>Math.exp(-0.5*Math.pow((x-m)/s,2))/(s*Math.sqrt(2*Math.PI));
function betacf(x,a,b){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-300)d=1e-300;d=1/d;let h=d;for(let m=1;m<=300;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-14)break;}return h;}
const ibeta=(x,a,b)=>{if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgammaFn(a+b)-lgammaFn(a)-lgammaFn(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(x,a,b)/a:1-bt*betacf(1-x,b,a)/b;};
const qbeta=(p,a,b)=>{let lo=0,hi=1;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(ibeta(m,a,b)<p)lo=m;else hi=m;}return (lo+hi)/2;};
/* the cohort under the true model, for causal and burden playgrounds */
function cohort(){const k=DB().children,T=TRUTH_B,s=DB().schools,lp=k.map(c=>T.int+T.ses*c.ses+T.smoke*c.parent_smoke+T.green*(c.green-0.5)+T.boy*(c.sex==="boy"?1:0)+s[c.school-1].re);return {k:k,lp:lp,x:k.map(c=>c.no2_true),r:mm(k.map(c=>c.no2_true)),rug:thin(k.map(c=>c.no2_true),150)};}
const risk=(c,lb,x)=>{let s=0;for(let i=0;i<c.k.length;i++)s+=ex(c.lp[i]+lb*(x(i)-25)/10);return s/c.k.length;};
/* the true cumulative temperature curve used to simulate Example A (all ages, whole city) */
function tcurve(){const sH=sum(TRUTH_A.heatW),sC=sum(TRUTH_A.coldW),w=[0,1,2].map(g=>sum(DISTRICTS.map(d=>agePop(d,g)))*TRUTH_A.baseRate[g]),W=sum(w);
  const f=x=>Math.log(sum([0,1,2].map(g=>w[g]*Math.exp(heatLogRR(x,g)*sH+coldLogRR(x,g)*sC)))/W);let mt=0,mv=Infinity;for(let x=5;x<=30;x+=0.05){const y=f(x);if(y<mv){mv=y;mt=x;}}
  const T=DA().days.map(d=>d.temp_city);return {f:f,mmt:mt,tr:mm(T),rug:thin(T,150)};}

/* ---------- Lesson 12 · causal effects ---------- */
PG.add(Object.assign(L(12),{id:"L12.0",title:"an intervention on NO₂",intro:"g-computation over the 5,000 children with the true model: lower everyone's NO₂ by Δ and count the cases prevented.",
 setup:cohort,
 inputs:c=>[K("d","reduction Δ",-20,60,0.5,10,"µg/m³",[-1e9,c.r[0]],[0,Math.min(15,c.r[0])],{red:"impossible for everyone: some children's exposure would fall below zero",amber:"a negative Δ is an increase; large reductions may be unachievable",green:"an achievable policy target"})],
 params:()=>[K("b","log OR per 10 µg/m³",-0.5,1.5,0.005,Math.log(TRUTH_B.orPer10),"",null,[Math.log(0.9),Math.log(1.5)],{amber:"an effect far from what the literature supports",green:"plausible"})],
 compute(v,c){const r0=risk(c,v.b,i=>c.x[i]),r1=risk(c,v.b,i=>c.x[i]-v.d),neg=c.x.filter(x=>x-v.d<0).length;
  return {lines:["E[Y^(X−Δ)] = (1/n) Σᵢ P(Y = 1 | xᵢ − Δ, zᵢ) = "+pct(r1,2),"E[Y^X] = "+pct(r0,2),"RD = "+pct(r1,2)+" − "+pct(r0,2)+" = "+F(1000*(r1-r0),1)+" per 1,000"],
   out:[{label:"cases prevented per 1,000 children",value:F(1000*(r0-r1),1),z:neg>0?"red":"green",msg:neg>0?neg+" children would have negative NO₂: the intervention can't be applied to them as defined. A realistic version would cap exposure instead (Lesson 14).":""},{label:"causal risk ratio",value:F(r1/r0,3),z:neg>0?"red":"green"}]};},
 curve(c,v){const g=[];return {x0:0,x1:40,f:d=>1000*(risk(c,v.b,i=>c.x[i])-risk(c,v.b,i=>c.x[i]-d)),y0:0,valid:[-1e9,c.r[0]],at:v.d,xlab:"reduction Δ (µg/m³); red: some children would go below zero",ylab:"cases prevented per 1,000"};}}));
PG.add(Object.assign(L(12),{id:"L12.3",title:"E-values and unmeasured confounding",intro:"How strong would an unmeasured confounder need to be to explain the association away?",
 inputs:()=>[K("rr","observed risk ratio",-0.5,6,0.01,1.15,"",[0.000001,1e9],[0.5,3],RRWHY)],
 params:()=>[K("eu","confounder–exposure RR",-0.5,6,0.01,1.5,"",[1,1e9],[1,3],{red:"by convention ≥ 1 (an association in either direction)",amber:"a very strong confounder"}),K("ud","confounder–outcome RR",-0.5,6,0.01,1.5,"",[1,1e9],[1,3],{red:"by convention ≥ 1",amber:"a very strong confounder"})],
 compute(v){const r=v.rr<1?1/v.rr:v.rr,E=r+Math.sqrt(r*(r-1)),B=v.eu*v.ud/(v.eu+v.ud-1),adj=v.rr<1?v.rr*B:v.rr/B;
  return {lines:["E = RR + √(RR(RR − 1)) = "+F(r)+" + √("+F(r)+"×"+F(r-1)+") = "+F(E),"bias factor B = RR_EU·RR_UD/(RR_EU + RR_UD − 1) = "+F(B)],
   out:[{label:"E-value",value:F(E),z:v.rr<=0?"red":"green",msg:"A confounder associated with both exposure and outcome by RRs of "+F(E)+" each could explain the association away."},{label:"RR adjusted for this confounder",value:F(adj),z:"green",msg:B>=r?"This confounder is strong enough to explain the association away.":"Not strong enough to remove it."}]};},
 curve(c,v){return {x0:1,x1:5,f:r=>r+Math.sqrt(r*(r-1)),y0:1,at:Math.max(1,v.rr<1?1/v.rr:v.rr),xlab:"observed risk ratio",ylab:"E-value"};}}));

/* ---------- Lesson 13 · measurement error ---------- */
PG.add(Object.assign(L(13),{id:"L13.0",title:"attenuation by classical error",intro:"Error in the measured exposure dilutes the slope by the reliability ratio λ.",
 inputs:()=>[K("su","error SD of modeled NO₂ σ_U",-2,20,0.1,TRUTH_B.errSD,"µg/m³",[0,1e9],[0,8],{red:"impossible: an SD can't be negative",amber:"a very noisy exposure model"})],
 params:()=>[K("sx","SD of true NO₂ (given covariates) σ_X|Z",-1,20,0.1,6,"µg/m³",[0.000001,1e9],[2,15],{red:"impossible: must be positive"}),K("b","true OR per 10 µg/m³",0.5,3,0.01,TRUTH_B.orPer10,"",[0.000001,1e9],[0.8,1.6],RRWHY)],
 compute(v){const lam=v.sx*v.sx/(v.sx*v.sx+v.su*v.su),obs=Math.exp(lam*Math.log(v.b));return {lines:["λ = σ²_X|Z / (σ²_X|Z + σ²_U) = "+F(v.sx*v.sx)+" / ("+F(v.sx*v.sx)+" + "+F(v.su*v.su)+") = "+F(lam,3),"observed log OR ≈ λ × true log OR = "+F(lam,3)+" × "+F(Math.log(v.b),3)],
  out:[{label:"reliability ratio λ",value:F(lam,3),z:v.su<0?"red":"green"},{label:"OR you would observe",value:F(obs,3),z:"green",msg:"True OR "+F(v.b)+": classical error pulls estimates toward 1."}]};},
 curve(c,v){return {x0:0,x1:15,f:s=>v.sx*v.sx/(v.sx*v.sx+s*s),y0:0,y1:1,valid:[0,1e9],at:v.su,xlab:"error SD σ_U (µg/m³)",ylab:"reliability ratio λ"};}}));
PG.add(Object.assign(L(13),{id:"L13.2",title:"correcting misclassification",intro:"Back-calculate the true number of cases from an imperfect classification.",
 inputs:()=>[K("as","classified as cases a*",-10,600,1,120,"",[0,1e9],[0,600],{red:"impossible: a count can't be negative"},true),K("n","group size n",1,2000,1,1000,"",[1,1e9],[50,2000],{red:"impossible"},true)],
 params:()=>[K("se","sensitivity Se",-0.05,1.05,0.005,0.85,"",[0,1],[0.5,1],PWHY),K("sp","specificity Sp",-0.05,1.05,0.005,0.95,"",[0,1],[0.5,1],PWHY)],
 compute(v){const den=v.se+v.sp-1,a=(v.as-(1-v.sp)*v.n)/den,bad=den<=0||a<0||a>v.n||v.as>v.n;
  return {lines:["â = (a* − (1 − Sp)·n) / (Se + Sp − 1) = ("+v.as+" − "+F(1-v.sp,3)+"×"+v.n+") / "+F(den,3)+" = "+F(a,1)],
   out:[{label:"corrected number of cases",value:F(a,1),z:bad?"red":"green",msg:den<=0?"Se + Sp ≤ 1: the classification carries no information, so nothing can be corrected.":a<0?"A negative count: these Se and Sp are incompatible with the data. Fewer positives were seen than false positives alone would produce.":a>v.n?"More cases than people: incompatible with the data.":"Small changes in Sp move the answer a lot when the condition is rare."}]};},
 curve(c,v){return {x0:0.5,x1:1,f:sp=>(v.as-(1-sp)*v.n)/(v.se+sp-1),yValid:[0,v.n],y0:-v.n*0.1,y1:v.n*0.5,at:v.sp,xlab:"specificity",ylab:"corrected cases"};}}));

/* ---------- Lesson 14 · burden ---------- */
PG.add(Object.assign(L(14),{id:"L14.0",title:"Levin vs Miettinen PAF",intro:"With confounding, Levin's formula with a crude RR overstates the burden; Miettinen's with an adjusted RR doesn't.",
 inputs:()=>[K("pe","proportion of the population exposed",-0.05,1.05,0.005,0.3,"",[0,1],[0,1],PWHY)],
 params:()=>[K("rr","adjusted (causal) RR",-0.5,5,0.01,1.3,"",[0.000001,1e9],[0.5,3],RRWHY),K("bf","confounding: crude RR / adjusted RR",0.5,2.5,0.01,1.2,"",[0.000001,1e9],[0.7,1.6],{amber:"strong confounding"})],
 compute(v){const crude=v.rr*v.bf,lev=v.pe*(crude-1)/(1+v.pe*(crude-1)),pc=v.pe*v.rr/(1+v.pe*(v.rr-1)),mie=pc*(v.rr-1)/v.rr,truth=v.pe*(v.rr-1)/(1+v.pe*(v.rr-1));
  return {lines:["Levin, crude RR = "+F(crude)+": p_e(RR − 1)/(1 + p_e(RR − 1)) = "+pct(lev),"Miettinen, adjusted RR = "+F(v.rr)+": p_c(RR − 1)/RR = "+F(pc,3)+" × "+F((v.rr-1)/v.rr,3)+" = "+pct(mie)],
   out:v.pe<0||v.pe>1||v.rr<=0?[{label:"PAF",value:"—",z:"red",msg:"A proportion must lie between 0 and 1, and a risk ratio must be positive."}]:[{label:"Levin with the crude RR",value:pct(lev),z:Math.abs(lev-truth)>0.01?"amber":"green",msg:Math.abs(lev-truth)>0.01?"Biased by confounding.":""},{label:"Miettinen with the adjusted RR",value:pct(mie),z:"green",msg:"Equals the true PAF, "+pct(truth)+"."}]};},
 curve(c,v){return {x0:0,x1:1,f:p=>{const cr=v.rr*v.bf;return 100*p*(cr-1)/(1+p*(cr-1));},valid:[0,1],at:v.pe,xlab:"proportion exposed",ylab:"PAF by Levin with crude RR (%)",extra:[{f:p=>100*p*(v.rr-1)/(1+p*(v.rr-1))}]};}}));
PG.add(Object.assign(L(14),{id:"L14.1",title:"burden under a counterfactual exposure",intro:"Cap every child's NO₂ at x* and count the cases prevented, with the true model.",
 setup:cohort,
 inputs:c=>[K("xs","counterfactual exposure x*",-10,70,0.5,10,"µg/m³",[0,1e9],[5,c.r[1]],{red:"impossible: a concentration can't be negative",amber:"below what any part of the city experiences: a theoretical minimum, not a policy",green:"an attainable level"})],
 params:()=>[K("b","log OR per 10 µg/m³",-0.5,1.5,0.005,Math.log(TRUTH_B.orPer10),"",null,[Math.log(0.9),Math.log(1.5)])],
 compute(v,c){const r0=risk(c,v.b,i=>c.x[i]),r1=risk(c,v.b,i=>Math.min(c.x[i],Math.max(0,v.xs))),paf=1-r1/r0,D=sum(c.k.map(k=>k.asthma));
  return {lines:["PAF = 1 − E[P(Y | min(xᵢ, x*), zᵢ)] / E[P(Y | xᵢ, zᵢ)] = 1 − "+pct(r1,2)+" / "+pct(r0,2),"AN = PAF × D = "+pct(paf)+" × "+D],out:[{label:"population attributable fraction",value:pct(paf),z:v.xs<0?"red":"green"},{label:"attributable cases",value:F(paf*D,0),z:v.xs<0?"red":"green",msg:"The burden depends on the counterfactual you choose: always state it."}]};},
 curve(c,v){return {x0:0,x1:60,f:x=>100*(1-risk(c,v.b,i=>Math.min(c.x[i],x))/risk(c,v.b,i=>c.x[i])),y0:0,valid:[0,1e9],data:[5,c.r[1]],rug:c.rug,at:v.xs,xlab:"counterfactual x* (µg/m³)",ylab:"PAF (%)"};}}));
PG.add(Object.assign(L(14),{id:"L14.2",title:"DALYs",intro:"Years of life lost plus years lived with disability, for an illustrative condition.",
 inputs:()=>[K("D","deaths",-5,200,1,10,"",[0,1e9],[0,200],{red:"impossible: a count can't be negative"},true),K("La","remaining life expectancy at death",-5,100,0.5,30,"years",[0,90],[0,85],{red:"impossible: no one has more than about 90 years ahead of them",amber:"unusually long"}),K("I","new cases",-10,5000,1,700,"",[0,1e9],[0,5000],{red:"impossible"},true),K("Ld","average duration",-1,90,0.5,5,"years",[0,90],[0,80],{red:"impossible"})],
 params:()=>[K("dw","disability weight",-0.1,1.1,0.005,0.13,"",[0,1],[0,0.8],{red:"impossible: 0 is full health, 1 is death",amber:"a very severe condition"})],
 compute(v){const yll=v.D*v.La,yld=v.I*v.dw*v.Ld;return {lines:["YLL = D × L = "+v.D+" × "+F(v.La,1)+" = "+F(yll,0),"YLD = I × DW × L_dur = "+v.I+" × "+F(v.dw,3)+" × "+F(v.Ld,1)+" = "+F(yld,0)],out:[{label:"DALYs",value:F(yll+yld,0),z:[v.D,v.La,v.I,v.Ld].some(x=>x<0)||v.dw<0||v.dw>1?"red":"green",msg:"Share from disability: "+pct(yld/(yll+yld||1))+"."}]};},
 curve(c,v){return {x0:0,x1:1,f:w=>v.D*v.La+v.I*w*v.Ld,y0:0,valid:[0,1],at:v.dw,xlab:"disability weight",ylab:"DALYs"};}}));

/* ---------- Lesson 15 · time series ---------- */
PG.add(Object.assign(L(15),{id:"L15.0",title:"the PM₂.₅ time-series model",intro:"Fitted to the city's daily visits, with temperature, season and weekday. Describe a day.",
 setup(){const A=DA(),D=A.days,y=new Array(D.length).fill(0);A.rows.forEach(r=>y[r.t]+=r.visits);const T=D.map(d=>d.temp_city),PM=D.map(d=>d.pm25),tk=rcsKnots(T,4),idx=[];for(let t=1;t<D.length;t++)idx.push(t);
   const row=(pm,t,doy,dow)=>[1,pm/10].concat(rcsRow(t,tk).map((q,j)=>j===0?(q-15)/10:q/10),[Math.sin(2*Math.PI*doy/365.25),Math.cos(2*Math.PI*doy/365.25),Math.sin(4*Math.PI*doy/365.25),Math.cos(4*Math.PI*doy/365.25)],[1,2,3,4,5,6].map(j=>dow===j?1:0));
   const f=glmFit(idx.map(t=>row((PM[t]+PM[t-1])/2,(T[t]+T[t-1])/2,D[t].doy,D[t].dow)),idx.map(t=>y[t]),"poisson");return {f:f,row:row,pm:mm(PM),tr:mm(T),rug:thin(PM,150),se:f.se[1]*Math.sqrt(Math.max(1,f.phi))};},
 inputs:c=>[K("pm","PM₂.₅ (2-day mean)",-10,200,0.5,25,"µg/m³",[0,1000],c.pm,{red:"impossible: a concentration can't be negative",amber:"never observed in this city",green:"within the city's range"}),K("T","temperature",-100,100,0.5,15,"°C",[-90,60],c.tr,TWHY()),K("doy","day of the year",-10,380,1,180,"",[1,366],[1,366],{red:"impossible: a year has 365 or 366 days"},true),K("dow","weekday (0 = Sunday … 6 = Saturday)",0,6,1,1,"",[0,6],[0,6],{red:"impossible"},true)],
 params:c=>[K("b","log RR per 10 µg/m³ β",-0.2,0.4,0.001,c.f.beta[1],"",null,[c.f.beta[1]-2*c.se,c.f.beta[1]+2*c.se],{amber:"outside the 95% interval",green:"within the 95% interval"})],
 compute(v,c){const r=c.row(v.pm,v.T,v.doy,v.dow),b=c.f.beta.slice();b[1]=v.b;const e=r.reduce((s,q,j)=>s+q*b[j],0),mu=Math.exp(e);
  return {lines:["log μ = α + β·PM/10 + f(T) + season + weekday","β·PM/10 = "+F(v.b,4)+" × "+F(v.pm/10)+" = "+F(v.b*v.pm/10,3)+"  ⇒  μ = "+F(mu,0)+" visits"],out:[{label:"expected visits that day",value:F(mu,0),z:v.pm<0||v.T>60||v.T<-90?"red":"green"},{label:"RR vs a day with 10 µg/m³",value:F(Math.exp(v.b*(v.pm-10)/10),3),z:"green"}]};},
 curve(c,v){const b=c.f.beta.slice();b[1]=v.b;return {x0:-10,x1:120,f:pm=>Math.exp(c.row(pm,v.T,v.doy,v.dow).reduce((s,q,j)=>s+q*b[j],0)),valid:[0,1000],data:c.pm,rug:c.rug,at:v.pm,xlab:"PM₂.₅ (µg/m³)",ylab:"expected visits"};}}));

/* ---------- Lesson 16 · the temperature curve ---------- */
PG.add(Object.assign(L(16),{id:"L16.2",title:"relative risk and the reference temperature",intro:"The true cumulative temperature curve that generated the data. RRs depend on the reference you choose.",
 setup:tcurve,
 inputs:c=>[K("x","temperature",-100,100,0.5,28,"°C",[-90,60],c.tr,TWHY())],
 params:c=>[K("ref","reference temperature",-10,40,0.5,Math.round(c.mmt*2)/2,"°C",[-90,60],[c.mmt-1,c.mmt+1],{red:"impossible on Earth",amber:"not the minimum: RRs below 1 will appear, and heat and cold are split differently",green:"at or near the MMT"})],
 compute(v,c){const rr=Math.exp(c.f(v.x)-c.f(v.ref));return {lines:["log RR(x) = f(x) − f(x_ref) = "+F(c.f(v.x),3)+" − "+F(c.f(v.ref),3)+" = "+F(c.f(v.x)-c.f(v.ref),3),"MMT (true curve) = "+F(c.mmt,1)+"°C"],
  out:[{label:"RR at "+F(v.x,1)+"°C vs "+F(v.ref,1)+"°C",value:F(rr,3),z:v.x>60||v.x<-90?"red":v.x<c.tr[0]||v.x>c.tr[1]?"amber":"green",msg:rr<1?"An RR below 1 means the reference isn't the minimum: some temperatures are safer than the reference.":v.x<c.tr[0]||v.x>c.tr[1]?"Beyond the observed temperatures, this is the simulation's assumption, not something data could show.":""}]};},
 curve(c,v){return {x0:-10,x1:40,f:x=>Math.exp(c.f(x)-c.f(v.ref)),valid:[-90,60],data:c.tr,rug:c.rug,at:v.x,xlab:"temperature (°C)",ylab:"RR vs reference",extra:[{f:()=>1}]};}}));
PG.add(Object.assign(L(16),{id:"L16.3",title:"attributable visits on one day",intro:"How many of a day's visits are attributable to its temperature?",
 setup:tcurve,
 inputs:c=>[K("T","the day's temperature",-100,100,0.5,-2,"°C",[-90,60],c.tr,TWHY()),K("y","visits that day",-20,900,1,450,"",[0,1e9],[200,800],{red:"impossible: a count can't be negative",amber:"far from the city's usual daily visits"},true)],
 params:c=>[K("mmt","minimum morbidity temperature",-10,40,0.5,Math.round(c.mmt*2)/2,"°C",[-90,60],[c.mmt-1.5,c.mmt+1.5],{amber:"far from the true MMT: heat and cold burden will be misallocated"})],
 compute(v,c){const lr=c.f(v.T)-c.f(v.mmt),af=1-Math.exp(-lr),an=v.y*af;return {lines:["AF = 1 − exp(−log RR) = 1 − exp(−"+F(lr,3)+") = "+F(af,3),"AN = y × AF = "+v.y+" × "+F(af,3)+" = "+F(an,1)],
  out:[{label:"attributable fraction",value:pct(af),z:af<0?"amber":v.T>60||v.T<-90?"red":"green",msg:af<0?"Negative: this day is safer than the reference, so the reference isn't the minimum.":v.T>v.mmt?"Counted as heat.":"Counted as cold."},{label:"attributable visits",value:F(an,1),z:v.y<0?"red":"green"}]};},
 curve(c,v){return {x0:-10,x1:35,f:x=>100*(1-Math.exp(-(c.f(x)-c.f(v.mmt)))),valid:[-90,60],data:c.tr,rug:c.rug,at:v.T,xlab:"temperature (°C)",ylab:"attributable fraction (%)",extra:[{f:()=>0}]};}}));

/* ---------- Lesson 17 · small areas ---------- */
PG.add(Object.assign(L(17),{id:"L17.0",title:"an SMR and its uncertainty",intro:"Observed over expected cases in a district. Small expected counts make SMRs noisy.",
 inputs:()=>[K("O","observed cases O",-5,200,1,14,"",[0,1e9],[0,200],{red:"impossible: a count can't be negative"},true),K("E","expected cases E",-5,150,0.5,10,"",[0.000001,1e9],[1,150],{red:"impossible: expected counts are positive",amber:"very small: the SMR will be very unstable"})],
 compute(v){const smr=v.O/v.E,se=Math.sqrt(v.O)/v.E,lo=v.O===0?0:Math.pow(1-1/(9*v.O)-1.96/(3*Math.sqrt(v.O)),3)*v.O/v.E,hi=Math.pow(1-1/(9*(v.O+1))+1.96/(3*Math.sqrt(v.O+1)),3)*(v.O+1)/v.E;
  return {lines:["SMR = O / E = "+v.O+" / "+F(v.E)+" = "+F(smr),"SE ≈ √O / E = "+F(se)],out:[{label:"SMR (95% CI)",value:F(smr)+" ("+F(lo)+"–"+F(hi)+")",z:v.O<0||v.E<=0?"red":v.E<5?"amber":"green",msg:v.E<5?"With so few expected cases, a district can look twice as bad, or half as bad, by chance.":""}]};},
 curve(c,v){return {x0:0.5,x1:150,f:E=>1+1.96/Math.sqrt(E),y0:0,y1:3,at:v.E,xlab:"expected cases E (upper 95% limit if SMR = 1; dashed: lower)",ylab:"SMR",extra:[{f:E=>Math.max(0,1-1.96/Math.sqrt(E))},{f:()=>v.O/v.E}]};}}));
PG.add(Object.assign(L(17),{id:"L17.2",title:"empirical Bayes shrinkage of an SMR",intro:"Small districts are pulled toward the city mean; large ones keep their own SMR.",
 inputs:()=>[K("O","observed cases O",-5,200,1,14,"",[0,1e9],[0,200],{red:"impossible"},true),K("E","expected cases E",-5,150,0.5,6,"",[0.000001,1e9],[1,150],{red:"impossible"})],
 params:()=>[K("mu","citywide mean RR μ",0.2,2,0.01,1,"",[0.000001,1e9],[0.8,1.2]),K("s2","between-district variance σ²_θ",-0.05,0.5,0.001,0.02,"",[0,1e9],[0,0.2],{red:"impossible: a variance can't be negative",amber:"very large differences between districts"})],
 compute(v){const w=v.s2/(v.s2+v.mu/v.E),eb=w*(v.O/v.E)+(1-w)*v.mu;return {lines:["w = σ²_θ / (σ²_θ + μ/E) = "+F(v.s2,3)+" / ("+F(v.s2,3)+" + "+F(v.mu/v.E,3)+") = "+F(w,3),"θ̂ = w·SMR + (1 − w)·μ = "+F(w,3)+"×"+F(v.O/v.E)+" + "+F(1-w,3)+"×"+F(v.mu)],out:[{label:"raw SMR → shrunk estimate",value:F(v.O/v.E)+" → "+F(eb),z:v.E<=0||v.s2<0?"red":"green",msg:"Weight on the district's own data: "+pct(w,0)+"."}]};},
 curve(c,v){return {x0:0.5,x1:150,f:E=>100*v.s2/(v.s2+v.mu/E),y0:0,y1:100,at:v.E,xlab:"expected cases E",ylab:"weight on own SMR (%)"};}}));

/* ---------- Lesson 18 · clustering and pooling ---------- */
PG.add(Object.assign(L(18),{id:"L18.0",title:"ICC and design effect",intro:"How much clustering within schools costs in information.",
 inputs:()=>[K("m","average school size m",-5,600,1,125,"children",[1,1e9],[10,500],{red:"impossible"},true)],
 params:()=>[K("tau","between-school SD τ (log-odds)",-0.2,2,0.01,TRUTH_B.schoolSD,"",[0,1e9],[0,1],{red:"impossible: an SD can't be negative",amber:"very large differences between schools"})],
 compute(v){const icc=v.tau*v.tau/(v.tau*v.tau+Math.PI*Math.PI/3),de=1+(v.m-1)*icc;return {lines:["ICC = τ² / (τ² + π²/3) = "+F(v.tau*v.tau,4)+" / ("+F(v.tau*v.tau,4)+" + 3.29) = "+F(icc,4),"design effect = 1 + (m − 1)·ICC = "+F(de)],out:[{label:"design effect",value:F(de),z:v.tau<0||v.m<1?"red":"green"},{label:"5,000 children are worth",value:F(5000/de,0)+" independent children",z:"green",msg:"A tiny ICC still matters when clusters are large."}]};},
 curve(c,v){const icc=v.tau*v.tau/(v.tau*v.tau+Math.PI*Math.PI/3);return {x0:1,x1:500,f:m=>1+(m-1)*icc,y0:1,at:v.m,xlab:"school size m",ylab:"design effect"};}}));
PG.add(Object.assign(L(18),{id:"L18.1",title:"partial pooling of one school",intro:"A school's own estimate is pulled toward the overall mean, more when it is noisy.",
 inputs:()=>[K("r","school's own asthma risk",-0.05,1.05,0.005,0.25,"",[0,1],[0.03,0.35],PWHY),K("n","children in the school",-5,500,1,40,"",[1,1e9],[10,500],{red:"impossible"},true)],
 params:()=>[K("mu","overall risk",0.01,0.5,0.005,0.137,"",[0,1],[0.05,0.3],PWHY),K("tau","between-school SD τ (log-odds)",-0.2,2,0.01,TRUTH_B.schoolSD,"",[0,1e9],[0,1],{red:"impossible"})],
 compute(v){const lg=p=>Math.log(p/(1-p)),th=lg(Math.min(0.999,Math.max(0.001,v.r))),s2=1/(v.n*v.r*(1-v.r)),w=v.tau*v.tau/(v.tau*v.tau+s2),pp=ex(w*th+(1-w)*lg(v.mu));
  return {lines:["w = τ² / (τ² + s²) = "+F(v.tau*v.tau,3)+" / ("+F(v.tau*v.tau,3)+" + "+F(s2,3)+") = "+F(w,3),"pooled log-odds = w·θ̂ + (1 − w)·μ"],out:[{label:"own risk → partially pooled",value:pct(v.r)+" → "+pct(pp),z:v.r<0||v.r>1||v.n<1?"red":"green",msg:"Weight on the school's own data: "+pct(w,0)+". More children, more weight."}]};},
 curve(c,v){return {x0:5,x1:500,f:n=>100*v.tau*v.tau/(v.tau*v.tau+1/(n*v.r*(1-v.r))),y0:0,y1:100,at:v.n,xlab:"children in the school",ylab:"weight on own data (%)"};}}));

/* ---------- Lessons 19–20 · Bayesian updating and priors ---------- */
PG.add(Object.assign(L(19),{id:"L19.0",title:"updating a beta prior",intro:"A beta prior for the asthma risk, updated with observed cases.",
 inputs:()=>[K("d","children with asthma d",-5,220,1,15,"",[0,1e9],[0,200],{red:"impossible"},true),K("n","children observed n",1,220,1,100,"",[1,1e9],[1,200],{red:"impossible"},true)],
 params:()=>[K("a","prior a (like cases seen before)",-1,60,0.5,2,"",[0.000001,1e9],[0.5,40],{red:"impossible: a and b must be positive",amber:"a strong prior, worth many children"}),K("b","prior b (like non-cases seen before)",-1,200,0.5,12,"",[0.000001,1e9],[0.5,200],{red:"impossible"})],
 compute(v){const bad=v.d>v.n||v.a<=0||v.b<=0;if(bad)return {lines:["(impossible inputs)"],out:[{label:"posterior",value:"—",z:"red",msg:v.d>v.n?"More cases than children.":"Prior parameters must be positive."}]};const A=v.a+v.d,B=v.b+v.n-v.d;
  return {lines:["posterior = Beta(a + d, b + n − d) = Beta("+F(A,1)+", "+F(B,1)+")","prior mean "+pct(v.a/(v.a+v.b))+", data "+pct(v.d/v.n)+" → posterior mean "+pct(A/(A+B))],out:[{label:"posterior mean (95% CrI)",value:pct(A/(A+B))+" ("+pct(qbeta(0.025,A,B))+"–"+pct(qbeta(0.975,A,B))+")",z:"green"},{label:"the prior is worth",value:F(v.a+v.b,1)+" children",z:v.a+v.b>v.n?"amber":"green",msg:v.a+v.b>v.n?"The prior outweighs the data.":""}]};},
 curve(c,v){const ok=!(v.d>v.n||v.a<=0||v.b<=0),A=v.a+v.d,B=v.b+v.n-v.d,lb=(a,b)=>lgammaFn(a)+lgammaFn(b)-lgammaFn(a+b),db=(x,a,b)=>Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-lb(a,b));return {x0:0.001,x1:0.6,f:x=>ok?db(x,A,B):NaN,y0:0,at:ok?A/(A+B):undefined,xlab:"risk (dashed: prior)",ylab:"density",fx:t=>Math.round(100*t)+"%",extra:[{f:x=>v.a>0&&v.b>0?db(x,v.a,v.b):NaN}]};}}));
PG.add(Object.assign(L(19),{id:"L19.2",title:"prior × likelihood: the heat effect",intro:"A normal prior for the heat effect, combined with an estimate from the data.",
 inputs:()=>[K("bh","estimate from the data",-5,10,0.05,1.1,"% per °C",[-100,1e9],[-1,4],{red:"impossible: visits can't fall by more than 100%",amber:"an implausibly large heat effect"}),K("se","its standard error",-0.5,5,0.05,0.6,"% per °C",[0.000001,1e9],[0.1,3],{red:"impossible: must be positive"})],
 params:()=>[K("m","prior mean",-5,10,0.05,1,"% per °C",[-100,1e9],[-1,4]),K("s","prior SD",-0.5,10,0.05,0.5,"% per °C",[0.000001,1e9],[0.2,5],{red:"impossible: must be positive",amber:"a very vague or very confident prior"})],
 compute(v){const pr=1/(v.s*v.s)+1/(v.se*v.se),pm=(v.m/(v.s*v.s)+v.bh/(v.se*v.se))/pr,ps=Math.sqrt(1/pr);return {lines:["posterior precision = 1/s² + 1/SE² = "+F(1/(v.s*v.s),3)+" + "+F(1/(v.se*v.se),3),"posterior mean = (m/s² + β̂/SE²) / precision = "+F(pm,3)],out:[{label:"posterior (95% CrI)",value:F(pm)+"% ("+F(pm-1.96*ps)+" to "+F(pm+1.96*ps)+")",z:v.s<=0||v.se<=0?"red":"green",msg:"The posterior is a precision-weighted average: the prior carries "+pct((1/(v.s*v.s))/pr,0)+" of the weight."}]};},
 curve(c,v){const pr=1/(v.s*v.s)+1/(v.se*v.se),pm=(v.m/(v.s*v.s)+v.bh/(v.se*v.se))/pr,ps=Math.sqrt(1/pr);return {x0:-3,x1:6,f:x=>dn(x,pm,ps),y0:0,at:pm,xlab:"% change per °C (dashed: prior and likelihood)",ylab:"density",extra:[{f:x=>dn(x,v.m,v.s)},{f:x=>dn(x,v.bh,v.se)}]};}}));
PG.add(Object.assign(L(20),{id:"L20.0",title:"prior predictive check",intro:"What daily visits do your priors imply for one district? α ~ Normal(log 8, s_α²), β ~ Normal(0, s_β²), log μ = α + β(T − 20).",
 inputs:()=>[K("T","temperature",-100,100,0.5,35,"°C",[-90,60],[-10,35],TWHY())],
 params:()=>[K("sa","prior SD of α",-0.5,5,0.05,1,"",[0.000001,1e9],[0.2,1.5],{red:"impossible: must be positive",amber:"very vague"}),K("sb","prior SD of β (log RR per °C)",-0.05,1.5,0.005,0.05,"",[0.000001,1e9],[0.005,0.1],{red:"impossible: must be positive",amber:"allows absurd temperature effects"})],
 compute(v){const s=Math.sqrt(v.sa*v.sa+v.sb*v.sb*Math.pow(v.T-20,2)),hi=Math.exp(Math.log(8)+1.96*s),md=8,lo=Math.exp(Math.log(8)-1.96*s);
  return {lines:["log μ ~ Normal(log 8, s_α² + s_β²(T − 20)²) = Normal("+F(Math.log(8))+", "+F(s*s)+")","95% of prior draws: "+F(lo,1)+" to "+F(hi,0)+" visits per day"],out:[{label:"upper 2.5% of implied daily visits",value:F(hi,0),z:hi>5000?"red":hi>200?"amber":"green",msg:hi>5000?"More visits in a day than the district has residents aged 65+: your prior allows the impossible.":hi>200?"Many times the usual count: a prior that permits absurd days.":"Implied counts look sensible."}]};},
 curve(c,v){return {x0:-10,x1:45,f:T=>Math.log10(Math.exp(Math.log(8)+1.96*Math.sqrt(v.sa*v.sa+v.sb*v.sb*Math.pow(T-20,2)))),valid:[-90,60],yValid:[-1e9,Math.log10(5000)],at:v.T,xlab:"temperature (°C)",ylab:"upper 2.5% of visits (log₁₀)",fy:t=>"10^"+t};}}));
PG.add(Object.assign(L(20),{id:"L20.1",title:"a prior from expert judgment",intro:"Experts give a plausible range for the heat effect; the prior is a normal on the log scale covering it with 95% probability.",
 inputs:()=>[K("lo","lower end L",-20,20,0.1,0,"% per °C",[-99.99,1e9],[-2,3],{red:"impossible: visits can't fall by 100% or more"}),K("hi","upper end U",-20,20,0.1,4,"% per °C",[-99.99,1e9],[0,8],{red:"impossible"})],
 compute(v){if(v.hi<=v.lo)return {lines:["(U must be above L)"],out:[{label:"prior",value:"—",z:"red",msg:"The upper end must exceed the lower end."}]};const a=Math.log(1+v.lo/100),b=Math.log(1+v.hi/100),m=(a+b)/2,s=(b-a)/(2*1.96);
  return {lines:["m = (log(1 + L) + log(1 + U)) / 2 = "+F(m,4),"s = (log(1 + U) − log(1 + L)) / (2 × 1.96) = "+F(s,4)],out:[{label:"prior: Normal(m, s²) on the log scale",value:"m = "+F(m,4)+", s = "+F(s,4),z:v.lo<=-100?"red":"green"},{label:"prior probability of harm (β > 0)",value:pct(pnormStd(m/s)),z:"green"}]};},
 curve(c,v){const a=Math.log(1+v.lo/100),b=Math.log(1+v.hi/100),m=(a+b)/2,s=Math.max(1e-6,(b-a)/(2*1.96));return {x0:-10,x1:15,f:x=>dn(Math.log(1+x/100),m,s)/(1+x/100)/100,y0:0,valid:[-99.99,1e9],at:(v.lo+v.hi)/2,xlab:"% change per °C",ylab:"prior density"};}}));
PG.add(Object.assign(L(22),{id:"L22.0",title:"what a coefficient prior implies",intro:"A Normal(0, s²) prior on the log odds ratio per 10 µg/m³, translated into odds ratios.",
 params:()=>[K("s","prior SD of the log OR",-0.1,5,0.01,0.5,"",[0.000001,1e9],[0.1,1],{red:"impossible: must be positive",amber:"so vague it allows absurd odds ratios"})],
 compute(v){const lo=Math.exp(-1.96*v.s),hi=Math.exp(1.96*v.s),p2=2*(1-pnormStd(Math.log(2)/v.s));return {lines:["β ~ Normal(0, "+F(v.s)+"²)  ⇒  95% of ORs between e^(−1.96s) and e^(1.96s)"],out:[{label:"95% prior range of the OR per 10 µg/m³",value:F(lo,3)+" to "+F(hi,1),z:v.s<=0?"red":hi>20?"amber":"green",msg:hi>20?"This prior considers ORs above "+F(hi,0)+" plausible for 10 µg/m³: not weakly informative but implausibly vague.":""},{label:"prior probability that OR > 2 or < 0.5",value:pct(p2),z:"green"}]};},
 curve(c,v){return {x0:-4,x1:4,f:x=>dn(x,0,Math.max(1e-6,v.s)),y0:0,xlab:"log OR (OR: e^x)",ylab:"prior density",fx:t=>"OR "+F(Math.exp(t),t<0?2:0)};}}));

/* ---------- Lesson 23 · decisions and Bayes factors ---------- */
PG.add(Object.assign(L(23),{id:"L23.0",title:"decisions with a ROPE",intro:"Is the effect negligible, meaningful or undecided?",
 inputs:()=>[K("m","posterior median",-2,3,0.01,1.09,"% per °C",[-100,1e9],[-1,3]),K("s","posterior SD",-0.1,2,0.01,0.16,"% per °C",[0.000001,1e9],[0.02,1.5],{red:"impossible: must be positive"})],
 params:()=>[K("r","ROPE half-width",-0.1,2,0.01,0.3,"% per °C",[0,1e9],[0.05,1],{red:"impossible",amber:"a very wide or very narrow ROPE: justify it"})],
 compute(v){const lo=v.m-1.96*v.s,hi=v.m+1.96*v.s,pin=pnormStd((v.r-v.m)/v.s)-pnormStd((-v.r-v.m)/v.s),dec=lo>-v.r&&hi<v.r?"practically equivalent to zero":(lo>v.r||hi<-v.r)?"meaningful":"undecided";
  return {lines:["95% CrI = "+F(lo)+" to "+F(hi)+";  ROPE = ±"+F(v.r)],out:[{label:"decision",value:dec,z:v.s<=0?"red":"green"},{label:"P(in ROPE)",value:F(pin,3),z:"green"}]};},
 curve(c,v){return {x0:-2,x1:3,f:x=>dn(x,v.m,Math.max(1e-6,v.s)),y0:0,data:[-v.r,v.r],xlab:"effect (% per °C); white band: the ROPE",ylab:"posterior density",at:v.m};}}));
PG.add(Object.assign(L(23),{id:"L23.1",title:"a Bayes factor and the prior's width",intro:"The same data compared with H₀ under different priors for H₁.",
 inputs:()=>[K("b","estimate β̂",-2,3,0.01,0.23,"% per °C",[-100,1e9],[-1,3]),K("se","standard error",-0.1,2,0.01,0.13,"% per °C",[0.000001,1e9],[0.02,1.5],{red:"impossible"})],
 params:()=>[K("tau","prior SD under H₁ τ",-0.1,50,0.05,1,"% per °C",[0.000001,1e9],[0.2,5],{red:"impossible: must be positive",amber:"so wide it predicts absurd effects, which penalizes H₁ (Lindley)"})],
 compute(v){const bf=dn(v.b,0,Math.sqrt(v.se*v.se+v.tau*v.tau))/dn(v.b,0,v.se),p=2*(1-pnormStd(Math.abs(v.b/v.se)));return {lines:["BF₁₀ = N(β̂; 0, s² + τ²) / N(β̂; 0, s²) = "+F(bf,3)],out:[{label:"BF₁₀",value:F(bf,3),z:v.tau<=0?"red":v.tau>5?"amber":"green",msg:bf>3?"Evidence for an effect.":bf<1/3?"Evidence for no effect.":"Inconclusive."},{label:"p-value, for comparison",value:p<0.0001?"< 0.0001":F(p,4),z:"green"}]};},
 curve(c,v){return {x0:-1.5,x1:1.7,f:lt=>Math.log10(dn(v.b,0,Math.sqrt(v.se*v.se+Math.pow(Math.pow(10,lt),2)))/dn(v.b,0,v.se)),at:Math.log10(Math.max(1e-6,v.tau)),xlab:"prior SD τ (log₁₀ scale)",ylab:"log₁₀ BF₁₀",fx:t=>F(Math.pow(10,t),2),extra:[{f:()=>0}]};}}));

/* ---------- Lesson 26 · the BART prior ---------- */
PG.add(Object.assign(L(26),{id:"L26.2",title:"how the BART prior keeps trees small",intro:"The probability that a node at depth d splits, and the size of leaf values.",
 inputs:()=>[K("d","node depth d",-1,8,1,1,"",[0,1e9],[0,4],{red:"impossible: depth starts at 0"},true)],
 params:()=>[K("g","γ",-0.1,1.1,0.01,0.95,"",[0,1],[0.5,0.99],{red:"impossible: a probability"}),K("bt","β",-1,5,0.05,2,"",[0,1e9],[0.5,4],{red:"impossible: must be non-negative"}),K("k","k",-0.5,6,0.05,2,"",[0.000001,1e9],[1,3],{red:"impossible"}),K("m","number of trees m",-5,300,1,50,"",[1,1e9],[10,200],{red:"impossible"},true)],
 compute(v){const p=v.g*Math.pow(1+v.d,-v.bt),sm=0.5/(v.k*Math.sqrt(v.m));return {lines:["P(split at depth "+v.d+") = γ(1 + d)^(−β) = "+F(v.g)+" × "+(1+v.d)+"^(−"+F(v.bt)+") = "+F(p,3),"σ_μ = 0.5 / (k√m) = "+F(sm,4)],out:[{label:"probability of a split",value:pct(p),z:[v.g<0,v.g>1,v.bt<0,v.d<0].some(x=>x)?"red":"green"},{label:"leaf SD σ_μ",value:F(sm,4),z:"green",msg:"More trees, smaller leaves: each tree explains only a little."}]};},
 curve(c,v){return {x0:0,x1:8,f:d=>v.g*Math.pow(1+Math.floor(d),-v.bt),y0:0,y1:1,at:v.d,xlab:"depth",ylab:"P(split)",fy:t=>Math.round(100*t)+"%"};}}));

/* ---------- Lesson 27 · econometric tools ---------- */
PG.add(Object.assign(L(27),{id:"L27.0",title:"from intention-to-treat to the complier effect",intro:"The Wald estimator divides the ITT by the first stage. Watch it explode when the first stage is weak.",
 inputs:()=>[K("itt","ITT: change in asthma cases per 1,000",-60,30,0.5,-15,"",[-1000,1000],[-40,10]),K("fs","first stage: extra share using a purifier",-0.2,1.2,0.005,0.7,"",[0.000001,1],[0.2,1],{red:"impossible or useless: the first stage must be between 0 and 1",amber:"a weak first stage: the complier effect will be imprecise and fragile"})],
 compute(v){const late=v.itt/v.fs;return {lines:["LATE = ITT / first stage = "+F(v.itt,1)+" / "+F(v.fs,3)+" = "+F(late,1)+" per 1,000"],out:[{label:"effect among compliers",value:F(late,1)+" per 1,000",z:v.fs<=0||v.fs>1||Math.abs(late)>1000?"red":v.fs<0.2?"amber":"green",msg:Math.abs(late)>1000?"More than 1,000 per 1,000: an impossible risk difference, produced by dividing by a near-zero first stage.":v.fs<0.2?"Small first stages magnify any noise in the ITT.":""}]};},
 curve(c,v){return {x0:0.01,x1:1,f:s=>v.itt/s,yValid:[-1000,1000],y0:Math.min(-200,v.itt*3),y1:Math.max(50,-v.itt*0.5),at:v.fs,xlab:"first stage",ylab:"LATE per 1,000"};}}));
PG.add(Object.assign(L(27),{id:"L27.1",title:"the omitted-variables-bias formula",intro:"Short = long + effect of the omitted variable × its association with the exposure.",
 params:()=>[K("rho","long-regression coefficient ρ",-3,5,0.01,1.71,"points per 10 µg/m³",null,[-1,4]),K("g","effect of the omitted variable on asthma γ",-10,10,0.05,-2.5,"points per unit",null,[-6,6]),K("dl","association of the omitted variable with NO₂ δ",-1,1,0.005,-0.2,"units per 10 µg/m³",null,[-0.6,0.6])],
 compute(v){const rs=v.rho+v.g*v.dl;return {lines:["ρˢ = ρ + γ·δ = "+F(v.rho)+" "+sg(v.g)+" × "+F(v.dl,3)+" = "+F(rs)],out:[{label:"short-regression coefficient",value:F(rs)+" points per 10 µg/m³",z:"green",msg:Math.sign(v.g)===Math.sign(v.dl)?"Same signs: omitting the variable inflates the estimate.":"Opposite signs: omitting it shrinks the estimate, or flips it."}]};},
 curve(c,v){return {x0:-8,x1:8,f:g=>v.rho+g*v.dl,at:v.g,xlab:"γ (dashed: the long coefficient)",ylab:"short coefficient",extra:[{f:()=>v.rho}]};}}));
PG.add(Object.assign(L(27),{id:"L27.2",title:"the IV estimate as a ratio",intro:"Reduced form divided by first stage.",
 inputs:()=>[K("rf","reduced form: asthma change per unit of traffic",-10,20,0.05,4.4,"points",null,[-5,15]),K("fs","first stage: NO₂ change per unit of traffic",-5,40,0.1,25.9,"µg/m³",null,[5,40],{amber:"a weak instrument: IV becomes unstable"})],
 compute(v){const lam=v.rf/(v.fs/10);return {lines:["λ = reduced form / first stage = "+F(v.rf)+" / ("+F(v.fs)+"/10) = "+F(lam)+" points per 10 µg/m³"],out:[{label:"IV estimate",value:F(lam)+" points per 10 µg/m³",z:Math.abs(lam)>100?"red":Math.abs(v.fs)<5?"amber":"green",msg:Math.abs(lam)>100?"More than 100 percentage points: impossible, from a near-zero first stage.":""}]};},
 curve(c,v){return {x0:0.5,x1:40,f:fs=>v.rf/(fs/10),yValid:[-100,100],y0:-5,y1:Math.max(20,Math.abs(v.rf)*4),at:v.fs,xlab:"first stage (µg/m³ per unit traffic)",ylab:"IV estimate"};}}));
PG.add(Object.assign(L(27),{id:"L27.4",title:"differences-in-differences from four means",intro:"Log monthly visits before and after the low-emission zone, inside and outside it.",
 inputs:()=>[K("tp","zone, before",6,9,0.005,7.80,"log visits",null,[6,9]),K("ta","zone, after",6,9,0.005,7.83,"log visits",null,[6,9]),K("cp","others, before",6,9,0.005,7.50,"log visits",null,[6,9]),K("ca","others, after",6,9,0.005,7.59,"log visits",null,[6,9])],
 params:()=>[K("pt","zone's pre-existing trend difference (per period)",-0.15,0.15,0.005,0,"log units",null,[-0.02,0.02],{amber:"parallel trends violated: DiD will be biased"})],
 compute(v){const did=(v.ta-v.tp)-(v.ca-v.cp),corr=did-v.pt;return {lines:["DiD = (zone after − before) − (others after − before)","= ("+F(v.ta,3)+" − "+F(v.tp,3)+") − ("+F(v.ca,3)+" − "+F(v.cp,3)+") = "+F(did,3)],out:[{label:"DiD estimate",value:pct(Math.exp(did)-1),z:"green"},{label:"after removing the pre-trend difference",value:pct(Math.exp(corr)-1),z:Math.abs(v.pt)>0.02?"amber":"green",msg:Math.abs(v.pt)>0.02?"If the zone was already diverging, DiD credits that divergence to the policy.":""}]};},
 curve(c,v){return {x0:-0.1,x1:0.1,f:p=>100*(Math.exp((v.ta-v.tp)-(v.ca-v.cp)-p)-1),at:v.pt,xlab:"assumed pre-trend difference",ylab:"corrected estimate (%)",extra:[{f:()=>100*(Math.exp((v.ta-v.tp)-(v.ca-v.cp))-1)}]};}}));

/* ---------- Study design · case-control sampling ---------- */
PG.add({id:"Ldesign.0",lesson:"Study design",href:"design.html",title:"case-control sampling",intro:"Sampling on the outcome changes the intercept and the share of cases, but not the odds ratio.",
 inputs:()=>[K("r0","true risk in the unexposed",-0.05,0.6,0.005,0.12,"",[0,1],[0.01,0.4],PWHY)],
 params:()=>[K("s1","sampling fraction of cases s₁",-0.1,1.1,0.01,1,"",[0.000001,1],[0.1,1],{red:"impossible: a fraction between 0 and 1"}),K("s0","sampling fraction of controls s₀",-0.05,1.1,0.005,0.3,"",[0.000001,1],[0.01,1],{red:"impossible"}),K("or","true odds ratio",0.2,5,0.01,1.5,"",[0.000001,1e9],[0.5,3],RRWHY)],
 compute(v){const a=Math.log(v.r0/(1-v.r0)),as=a+Math.log(v.s1/v.s0),r0s=ex(as),r1s=ex(as+Math.log(v.or));return {lines:["α* = α + log(s₁/s₀) = "+F(a)+" + log("+F(v.s1)+"/"+F(v.s0,3)+") = "+F(as),"OR in the sample = e^β = "+F(v.or)+" (unchanged)"],out:v.r0<=0||v.r0>=1?[{label:"apparent risk",value:"—",z:"red",msg:"A risk must lie between 0 and 1."}]:[{label:"apparent 'risk' in sampled unexposed",value:pct(r0s),z:v.s1<=0||v.s0<=0||v.s1>1||v.s0>1?"red":"green",msg:"The true risk is "+pct(v.r0)+": in a case-control sample, risks are set by the sampling, not by nature."},{label:"odds ratio in the sample",value:F((r1s/(1-r1s))/(r0s/(1-r0s))),z:"green"}]};},
 curve(c,v){const a=Math.log(v.r0/(1-v.r0));return {x0:0.01,x1:1,f:s0=>100*ex(a+Math.log(v.s1/s0)),y0:0,y1:100,valid:[0.000001,1],at:v.s0,xlab:"sampling fraction of controls",ylab:"apparent risk in sample (%)"};}});
})();
