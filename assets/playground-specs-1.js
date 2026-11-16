/* playground-specs-1.js — "Try it" playgrounds for Lessons 0–11. Data are loaded lazily, when a playground is opened. */
(function(){if(!window.PG)return;
const F=PG.fmt;let _A=null,_B=null;const DA=()=>_A||(_A=genA()),DB=()=>_B||(_B=genB());
const K=(key,label,min,max,step,value,unit,valid,ok,why,integer)=>({key:key,label:label,min:min,max:max,step:step,value:value,unit:unit,valid:valid,ok:ok,why:why,integer:integer});
const ex=v=>1/(1+Math.exp(-v)),lg=p=>Math.log(p/(1-p)),pct=(v,d)=>F(100*v,d===undefined?1:d)+"%";
const mm=a=>{let lo=Infinity,hi=-Infinity;for(const x of a){if(x<lo)lo=x;if(x>hi)hi=x;}return [lo,hi];};
const thin=(a,n)=>{const o=[],s=Math.max(1,Math.floor(a.length/n));for(let i=0;i<a.length;i+=s)o.push(a[i]);return o;};
const sg=v=>(v<0?"− ":"+ ")+F(Math.abs(v));
const L=(n,t)=>({lesson:"Lesson "+n,href:"lesson-"+String(n).padStart(2,"0")+".html"});
const NO2WHY={red:"impossible: a concentration can't be negative",amber:"possible in principle, but no child in the cohort is exposed at this level: the model is extrapolating",green:"within the range observed in the cohort"};
const PWHY={red:"impossible: a probability must lie between 0 and 1",amber:"possible, but unusual for this setting",green:"plausible"};
const lfact=k=>lgammaFn(k+1),pois=(k,m)=>k<0?0:Math.exp(k*Math.log(m)-m-lfact(k));

/* ---------- Lesson 0 · the model behind the asthma data ---------- */
PG.add(Object.assign(L(0),{id:"L00.0",title:"the model behind the asthma data",intro:"These are the true values used to simulate the cohort. Describe a child, or change the model, and see the predicted risk of asthma.",
 setup(){const k=DB().children,T=TRUTH_B;return {T:T,no2:mm(k.map(c=>c.no2_true)),ses:mm(k.map(c=>c.ses)),green:mm(k.map(c=>c.green)),rug:thin(k.map(c=>c.no2_true),160)};},
 inputs:c=>[K("no2","NO₂ exposure",-20,150,0.5,25,"µg/m³",[0,1000],c.no2,NO2WHY),K("ses","SES score",-5,5,0.1,0,"",null,c.ses,{amber:"beyond the SES scores in the cohort",green:"within the cohort's range"}),K("smoke","parental smoking (0/1)",0,1,1,0,"",[0,1],[0,1],{red:"impossible: smoking is coded 0 or 1"},true),
   K("green","green space share",-0.2,1.2,0.01,0.5,"",[0,1],c.green,{red:"impossible: a share lies between 0 and 1",amber:"beyond the cohort's range",green:"within the cohort's range"}),K("boy","boy (0/1)",0,1,1,1,"",[0,1],[0,1],{red:"impossible: coded 0 or 1"},true),K("u","school effect u",-1.5,1.5,0.05,0,"",null,[-2*c.T.schoolSD,2*c.T.schoolSD],{amber:"more than 2 SDs from the average school: rare",green:"a typical school"})],
 params:c=>[K("a","intercept α",-5,1,0.05,c.T.int,"",null,[lg(0.03),lg(0.4)],{amber:"implies a baseline risk outside 3–40%, unusual for childhood asthma",green:"a plausible baseline risk"}),K("b","NO₂ effect β (log OR per 10 µg/m³)",-1,2,0.01,Math.log(c.T.orPer10),"",null,[Math.log(0.8),Math.log(1.6)],{amber:"far from the size of effects reported for traffic pollution",green:"a plausible effect size"})],
 compute(v,c){const T=c.T,e=v.a+v.b*(v.no2-25)/10+T.ses*v.ses+T.smoke*v.smoke+T.green*(v.green-0.5)+T.boy*v.boy+v.u,p=ex(e);
  return {lines:["logit(π) = α + β·(NO₂ − 25)/10 + γ₁·SES + γ₂·smoke + γ₃·(green − 0.5) + γ₄·boy + u","= "+F(v.a)+" "+sg(v.b)+"·("+F(v.no2,1)+" − 25)/10 "+sg(T.ses)+"·"+F(v.ses)+" "+sg(T.smoke)+"·"+v.smoke+" "+sg(T.green)+"·("+F(v.green)+" − 0.5) "+sg(T.boy)+"·"+v.boy+" "+sg(v.u),"= "+F(e)+"  ⇒  π = "+pct(p)],
   out:[{label:"predicted risk of asthma",value:pct(p),z:"green",msg:"Logistic models always give risks between 0 and 100%, however extreme the inputs."},{label:"odds ratio compared with 25 µg/m³",value:F(Math.exp(v.b*(v.no2-25)/10)),z:v.no2<0||v.no2>c.no2[1]*1.5?"amber":"green",msg:v.no2<0?"Computed for an impossible exposure: the arithmetic works, the child doesn't exist.":""}]};},
 curve(c,v){const T=c.T,f=x=>ex(v.a+v.b*(x-25)/10+T.ses*v.ses+T.smoke*v.smoke+T.green*(v.green-0.5)+T.boy*v.boy+v.u);return {x0:-20,x1:150,f:f,y0:0,y1:Math.max(0.3,f(150)*1.05),valid:[0,1000],data:c.no2,rug:c.rug,at:v.no2,xlab:"NO₂ (µg/m³); ticks: children in the cohort",ylab:"risk of asthma",fy:t=>Math.round(100*t)+"%"};}}));

/* ---------- Lesson 1 · risk, odds and rate ---------- */
PG.add(Object.assign(L(1),{id:"L01.1",title:"risk, odds and rate",intro:"Three ways to summarize the same cases. The cohort has 5,000 children followed to age 8.",
 inputs:()=>[K("D","cases D",-10,5500,1,686,"",[0,1e9],[0,5000],{red:"impossible: counts can't be negative"},true),K("N","children at risk N",1,6000,1,5000,"",[1,1e9],[100,5000],{red:"impossible: needs at least one person"},true),K("PT","person-years PT",-100,50000,10,36000,"",[0.0001,1e9],[1000,40000],{red:"impossible: person-time must be positive"})],
 compute(v){const r=v.D/v.N,o=v.D/(v.N-v.D),rate=1000*v.D/v.PT,out=[];
  out.push({label:"risk D/N",value:pct(r),z:r>1||r<0?"red":"green",msg:r>1?"More cases than children at risk: impossible, so a risk above 100% signals a data error.":""});
  out.push({label:"odds D/(N − D)",value:v.D>=v.N?"∞":F(o),z:v.D>v.N?"red":v.D===v.N?"amber":"green",msg:r>0.1&&r<=1?"With a common outcome, odds and risk differ a lot: odds "+F(o)+" vs risk "+F(r)+".":"With a rare outcome, odds ≈ risk."});
  out.push({label:"rate per 1,000 person-years",value:F(rate),z:v.PT<=0?"red":v.PT>v.N*8?"red":"green",msg:v.PT>v.N*8?"More than 8 years per child: impossible if children are followed to age 8.":"Has a time unit; the risk doesn't."});
  return {lines:["risk = "+v.D+" / "+v.N+" = "+F(r,3),"odds = "+v.D+" / ("+v.N+" − "+v.D+") = "+(v.D>=v.N?"∞":F(o,3)),"rate = "+v.D+" / "+F(v.PT,0)+" person-years × 1,000 = "+F(rate)],out:out};},
 curve(c,v){return {x0:0,x1:1,f:r=>r>=1?NaN:r/(1-r),y0:0,y1:4,valid:[0,1],at:v.D/v.N,xlab:"risk",ylab:"odds",fx:t=>Math.round(100*t)+"%"};}}));
PG.add(Object.assign(L(1),{id:"L01.2",title:"risk difference, risk ratio and odds ratio",intro:"Set the risk in the exposed and unexposed groups. The curve keeps the risk ratio fixed and varies the baseline risk.",
 inputs:()=>[K("r1","risk in the exposed R₁",-0.1,1.1,0.005,0.16,"",[0,1],[0,1],PWHY),K("r0","risk in the unexposed R₀",-0.1,1.1,0.005,0.12,"",[0,1],[0,1],PWHY)],
 compute(v){const rd=v.r1-v.r0,rr=v.r1/v.r0,or=(v.r1/(1-v.r1))/(v.r0/(1-v.r0)),bad=v.r1<0||v.r1>1||v.r0<0||v.r0>1;
  return {lines:["RD = R₁ − R₀ = "+F(v.r1,3)+" − "+F(v.r0,3)+" = "+F(rd,3),"RR = R₁ / R₀ = "+F(rr),"OR = [R₁/(1 − R₁)] / [R₀/(1 − R₀)] = "+F(or)],
   out:[{label:"extra cases per 1,000 exposed",value:F(1000*rd,1),z:bad?"red":"green"},{label:"risk ratio",value:F(rr),z:bad?"red":"green"},{label:"odds ratio",value:F(or),z:bad?"red":"green",msg:Math.max(v.r1,v.r0)<0.1?"Rare outcome: OR ≈ RR.":"Common outcome: the OR is further from 1 than the RR ("+F(or)+" vs "+F(rr)+")."}]};},
 curve(c,v){const rr=v.r1/v.r0;return {x0:0,x1:1,f:r0=>{const r1=rr*r0;return r1>=1?NaN:(r1/(1-r1))/(r0/(1-r0));},y0:0,y1:Math.max(3,rr*2),valid:[0,Math.min(1,1/rr)],at:v.r0,xlab:"baseline risk R₀ (risk ratio held at "+F(rr)+"); red: R₁ would exceed 100%",ylab:"odds ratio",fx:t=>Math.round(100*t)+"%",extra:[{f:()=>rr}]};}}));

/* ---------- Lesson 2 · diagnostic tests ---------- */
PG.add(Object.assign(L(2),{id:"L02.1",title:"predictive values of a test",intro:"A screening test for asthma. Change its accuracy and the prevalence, and see how often a positive result is right.",
 inputs:()=>[K("p","prevalence",-0.05,1.05,0.005,0.137,"",[0,1],[0.01,0.4],PWHY)],
 params:()=>[K("se","sensitivity Se",-0.05,1.05,0.005,0.85,"",[0,1],[0.5,0.99],PWHY),K("sp","specificity Sp",-0.05,1.05,0.005,0.9,"",[0,1],[0.5,0.99],PWHY)],
 compute(v){const ppv=v.se*v.p/(v.se*v.p+(1-v.sp)*(1-v.p)),npv=v.sp*(1-v.p)/(v.sp*(1-v.p)+(1-v.se)*v.p),fp=1000*(1-v.sp)*(1-v.p),bad=[v.p,v.se,v.sp].some(x=>x<0||x>1);
  return {lines:["PPV = Se·p / [Se·p + (1 − Sp)(1 − p)]","= "+F(v.se)+"·"+F(v.p,3)+" / ["+F(v.se)+"·"+F(v.p,3)+" + "+F(1-v.sp)+"·"+F(1-v.p,3)+"] = "+F(ppv,3)],
   out:[{label:"positive predictive value",value:pct(ppv),z:bad?"red":"green",msg:ppv<0.5&&!bad?"Most positives are false: low prevalence defeats even a decent test.":""},{label:"negative predictive value",value:pct(npv),z:bad?"red":"green"},{label:"false positives per 1,000 tested",value:F(fp,0),z:bad?"red":"green"}]};},
 curve(c,v){return {x0:0,x1:1,f:p=>v.se*p/(v.se*p+(1-v.sp)*(1-p)),y0:0,y1:1,valid:[0,1],at:v.p,xlab:"prevalence",ylab:"PPV",fx:t=>Math.round(100*t)+"%",fy:t=>Math.round(100*t)+"%"};}}));
PG.add(Object.assign(L(2),{id:"L02.2",title:"likelihood ratios and post-test probability",intro:"Bayes' theorem as odds: pre-test odds × likelihood ratio = post-test odds.",
 inputs:()=>[K("pre","pre-test probability",-0.05,1.05,0.005,0.137,"",[0,1],[0.01,0.6],PWHY)],
 params:()=>[K("se","sensitivity",-0.05,1.05,0.005,0.85,"",[0,1],[0.5,0.99],PWHY),K("sp","specificity",-0.05,1.05,0.005,0.9,"",[0,1],[0.5,0.99],PWHY)],
 compute(v){const lrp=v.se/(1-v.sp),lrn=(1-v.se)/v.sp,po=v.pre/(1-v.pre)*lrp,post=po/(1+po),bad=[v.pre,v.se,v.sp].some(x=>x<0||x>1);
  return {lines:["LR⁺ = Se / (1 − Sp) = "+F(v.se)+" / "+F(1-v.sp)+" = "+F(lrp),"post-test odds = "+F(v.pre/(1-v.pre),3)+" × "+F(lrp)+" = "+F(po,3)],
   out:[{label:"LR⁺ / LR⁻",value:F(lrp)+" / "+F(lrn),z:bad?"red":v.se+v.sp<=1?"amber":"green",msg:v.se+v.sp<=1?"Se + Sp ≤ 1: the test is no better than a coin toss.":""},{label:"probability after a positive test",value:pct(post),z:bad?"red":"green"}]};},
 curve(c,v){const lrp=v.se/(1-v.sp);return {x0:0,x1:1,f:p=>{const o=p/(1-p)*lrp;return o/(1+o);},y0:0,y1:1,valid:[0,1],at:v.pre,xlab:"pre-test probability",ylab:"post-test probability",fx:t=>Math.round(100*t)+"%",fy:t=>Math.round(100*t)+"%",extra:[{f:p=>p}]};}}));

/* ---------- Lesson 3 · distributions ---------- */
function dist65(){const A=DA(),m={};A.rows.forEach(r=>{if(r.g===2){m[r.district_id]=(m[r.district_id]||0)+r.visits;}});const nd=A.days.length,means=Object.values(m).map(x=>x/nd);return mm(means);}
PG.add(Object.assign(L(3),{id:"L03.1",title:"the Poisson distribution of daily visits",intro:"Daily emergency visits by residents aged 65+ in one district. Set the expected count μ and ask about a particular day's count.",
 setup(){return {r:dist65()};},
 inputs:c=>[K("k","a day's count k",-3,60,1,10,"visits",[0,1e9],[0,60],{red:"impossible: a count can't be negative"},true)],
 params:c=>[K("mu","expected count μ",-2,60,0.1,(c.r[0]+c.r[1])/2,"per day",[0.000001,1e9],[c.r[0]*0.7,c.r[1]*1.3],{red:"impossible: a mean count must be positive",amber:"outside the district averages in the data",green:"like the districts' averages"})],
 compute(v){const p=pois(Math.round(v.k),v.mu),p0=Math.exp(-v.mu);
  return {lines:["P(Y = k) = μᵏ e^(−μ) / k!","= "+F(v.mu)+"^"+v.k+" · e^(−"+F(v.mu)+") / "+v.k+"! = "+F(p,4)],
   out:[{label:"P(Y = "+v.k+")",value:F(p,4),z:v.k<0||v.mu<=0?"red":"green"},{label:"P(no visits at all)",value:F(p0,4),z:"green",msg:"Zero is a possible count: here a zero-visit day has probability "+F(p0,4)+"."},{label:"variance",value:F(v.mu),z:"green",msg:"For a Poisson, the variance equals the mean; real counts often vary more (Lesson 3.4)."}]};},
 curve(c,v){const xm=Math.max(10,Math.ceil(v.mu*2.2),v.k+3);return {x0:0,x1:xm,f:x=>pois(Math.floor(x),Math.max(1e-9,v.mu)),y0:0,valid:[0,1e9],at:v.k,xlab:"count k",ylab:"P(Y = k)"};}}));
PG.add(Object.assign(L(3),{id:"L03.2",title:"the normal distribution of daily temperature",intro:"Daily mean temperature in the city, approximated by a normal distribution.",
 setup(){const T=DA().days.map(d=>d.temp_city),m=mean(T);return {m:m,s:sd(T),r:mm(T),rug:thin(T,150)};},
 inputs:c=>[K("x","a day's temperature x",-100,100,0.5,25,"°C",[-90,60],c.r,{red:"impossible on Earth: the records are about −89°C and 57°C",amber:"possible on Earth, but never observed in this city",green:"within the city's observed range"})],
 params:c=>[K("mu","mean μ",-10,30,0.1,c.m,"°C",null,[c.m-5,c.m+5]),K("s","SD σ",-1,20,0.1,c.s,"°C",[0.0001,1e9],[c.s*0.6,c.s*1.4],{red:"impossible: an SD must be positive"})],
 compute(v){const z=(v.x-v.mu)/v.s,d=Math.exp(-0.5*z*z)/(v.s*Math.sqrt(2*Math.PI)),P=pnormStd(z);
  return {lines:["f(x) = exp(−(x − μ)² / 2σ²) / (σ√2π)","z = ("+F(v.x,1)+" − "+F(v.mu)+") / "+F(v.s)+" = "+F(z)],
   out:[{label:"density f(x)",value:F(d,4),z:v.s<=0?"red":"green",msg:d>1?"A density above 1: fine, because it isn't a probability.":"A density is not a probability; areas under it are."},{label:"P(temperature ≤ x)",value:F(P,4),z:"green"},{label:"P(temperature > x)",value:F(1-P,4),z:v.x>60||v.x<-90?"red":"green",msg:v.x>60?"The normal model still gives a (tiny) probability to impossible temperatures: models don't know physics.":""}]};},
 curve(c,v){return {x0:-20,x1:45,f:x=>Math.exp(-0.5*Math.pow((x-v.mu)/v.s,2))/(v.s*Math.sqrt(2*Math.PI)),y0:0,valid:[-90,60],data:c.r,rug:c.rug,at:v.x,xlab:"daily mean temperature (°C)",ylab:"density"};}}));
PG.add(Object.assign(L(3),{id:"L03.3",title:"overdispersion: negative binomial vs Poisson",intro:"The same mean, more variation. The dashed line is the Poisson with the same mean.",
 setup(){return {r:dist65()};},
 inputs:()=>[K("k","a day's count k",-3,80,1,0,"visits",[0,1e9],[0,80],{red:"impossible: a count can't be negative"},true)],
 params:c=>[K("mu","mean μ",0.1,60,0.1,(c.r[0]+c.r[1])/2,"per day",[0.000001,1e9],[c.r[0]*0.7,c.r[1]*1.3]),K("phi","dispersion φ",-1,100,0.1,TRUTH_A.phi,"",[0.0001,1e9],[1,200],{red:"impossible: φ must be positive",amber:"very strong overdispersion",green:"plausible"})],
 compute(v){const nb=k=>Math.exp(lgammaFn(k+v.phi)-lgammaFn(v.phi)-lfact(k)+v.phi*Math.log(v.phi/(v.phi+v.mu))+k*Math.log(v.mu/(v.phi+v.mu)));
  return {lines:["Var(Y) = μ + μ²/φ = "+F(v.mu)+" + "+F(v.mu)+"²/"+F(v.phi)+" = "+F(v.mu+v.mu*v.mu/v.phi)],
   out:[{label:"variance / mean",value:F(1+v.mu/v.phi),z:"green",msg:"1 for a Poisson; above 1 means overdispersion."},{label:"P(Y = "+v.k+"): negative binomial vs Poisson",value:F(nb(Math.max(0,v.k)),4)+" vs "+F(pois(Math.max(0,v.k),v.mu),4),z:v.k<0?"red":"green"}]};},
 curve(c,v){const nb=k=>Math.exp(lgammaFn(k+v.phi)-lgammaFn(v.phi)-lfact(k)+v.phi*Math.log(v.phi/(v.phi+v.mu))+k*Math.log(v.mu/(v.phi+v.mu)));const xm=Math.max(12,Math.ceil(v.mu*2.5));return {x0:0,x1:xm,f:x=>nb(Math.floor(x)),y0:0,at:v.k,xlab:"count k",ylab:"P(Y = k)",extra:[{f:x=>pois(Math.floor(x),v.mu)}]};}}));

/* ---------- Lesson 4 · standard error ---------- */
PG.add(Object.assign(L(4),{id:"L04.0",title:"the standard error of a mean",intro:"How precisely a sample of n days estimates the mean number of daily visits.",
 setup(){const A=DA(),y=new Array(A.days.length).fill(0);A.rows.forEach(r=>y[r.t]+=r.visits);return {s:sd(y)};},
 inputs:()=>[K("n","days sampled n",-5,2000,1,100,"",[1,1e9],[5,1826],{red:"impossible: needs at least one observation",amber:"more days than the five years of data"},true)],
 params:c=>[K("s","SD of daily visits σ",-5,150,0.5,c.s,"visits",[0.000001,1e9],[c.s*0.5,c.s*1.5],{red:"impossible: an SD must be positive"})],
 compute(v){const se=v.s/Math.sqrt(v.n);return {lines:["SE = σ / √n = "+F(v.s)+" / √"+v.n+" = "+F(se)],out:[{label:"standard error",value:F(se)+" visits",z:v.n<1||v.s<=0?"red":"green"},{label:"95% CI half-width",value:"± "+F(1.96*se),z:"green",msg:"Four times the data halves the standard error."}]};},
 curve(c,v){return {x0:1,x1:1000,f:n=>v.s/Math.sqrt(n),y0:0,at:v.n,xlab:"days sampled n",ylab:"standard error"};}}));

/* ---------- Lesson 5 · likelihood ---------- */
PG.add(Object.assign(L(5),{id:"L05.0",title:"the likelihood of a risk",intro:"Children with asthma among those observed. The curve is the likelihood: how well each risk explains the data.",
 inputs:()=>[K("d","children with asthma d",-5,220,1,15,"",[0,1e9],[0,200],{red:"impossible: a count can't be negative"},true),K("n","children observed n",0,220,1,100,"",[1,1e9],[1,200],{red:"impossible"},true)],
 compute(v){const ph=v.d/v.n,bad=v.d>v.n||v.d<0;return {lines:["L(π) ∝ π^"+v.d+" (1 − π)^"+(v.n-v.d),"π̂ = d/n = "+v.d+"/"+v.n+" = "+F(ph,3)],
  out:[{label:"maximum likelihood estimate",value:bad?"—":pct(ph),z:bad?"red":"green",msg:bad?"More cases than children: no risk can explain these data.":""},{label:"likelihood at 50% vs at π̂",value:bad?"—":F(Math.exp(v.d*Math.log(0.5)+(v.n-v.d)*Math.log(0.5)-(v.d*Math.log(Math.max(ph,1e-12))+(v.n-v.d)*Math.log(Math.max(1-ph,1e-12)))),6),z:bad?"red":"green",msg:"Relative support: how much less a risk of 50% explains the data."}]};},
 curve(c,v){const ph=Math.min(1,Math.max(0,v.d/v.n)),lmax=v.d*Math.log(Math.max(ph,1e-12))+(v.n-v.d)*Math.log(Math.max(1-ph,1e-12));return {x0:0,x1:1,f:p=>v.d>v.n||v.d<0?NaN:Math.exp(v.d*Math.log(Math.max(p,1e-12))+(v.n-v.d)*Math.log(Math.max(1-p,1e-12))-lmax),y0:0,y1:1.05,valid:[0,1],at:ph,xlab:"risk π",ylab:"relative likelihood",fx:t=>Math.round(100*t)+"%"};}}));

/* ---------- Lesson 6 · intervals and tests ---------- */
PG.add(Object.assign(L(6),{id:"L06.0",title:"a confidence interval for a risk",intro:"The simple (Wald) interval can go below 0% with few cases; the Wilson interval can't.",
 inputs:()=>[K("d","cases d",-2,60,1,2,"",[0,1e9],[0,60],{red:"impossible"},true),K("n","children n",1,500,1,40,"",[1,1e9],[1,500],{red:"impossible"},true)],
 compute(v){const p=v.d/v.n,z=1.96,s=Math.sqrt(p*(1-p)/v.n),w=[p-z*s,p+z*s],den=1+z*z/v.n,cc=(p+z*z/(2*v.n))/den,h=z*Math.sqrt(p*(1-p)/v.n+z*z/(4*v.n*v.n))/den;
  return {lines:["Wald: π̂ ± 1.96·√(π̂(1 − π̂)/n) = "+F(p,3)+" ± "+F(z*s,3)],out:v.d>v.n||v.d<0?[{label:"Wald 95% CI",value:"—",z:"red",msg:"More cases than children (or fewer than none): no risk can produce these data."}]:[{label:"Wald 95% CI",value:pct(w[0])+" to "+pct(w[1]),z:w[0]<0||w[1]>1?"red":p===0?"amber":"green",msg:w[0]<0?"The interval includes negative risks: impossible values from a formula that ignores the 0–1 bounds.":p===0?"With zero cases, the Wald interval collapses to a single point: false certainty.":""},{label:"Wilson 95% CI",value:pct(cc-h)+" to "+pct(cc+h),z:"green"}]};},
 curve(c,v){const p=v.d/v.n;return {x0:5,x1:500,f:n=>p-1.96*Math.sqrt(p*(1-p)/n),y0:-0.15,y1:Math.max(0.3,p*1.6),yValid:[0,1],at:v.n,xlab:"sample size n (same observed risk)",ylab:"Wald lower limit",fy:t=>Math.round(100*t)+"%",extra:[{f:n=>p+1.96*Math.sqrt(p*(1-p)/n)}]};}}));
PG.add(Object.assign(L(6),{id:"L06.1",title:"comparing two risks: z test",intro:"Risks of asthma in children with high and low NO₂, and the p-value as the sample grows.",
 inputs:()=>[K("n","children per group",2,5000,1,500,"",[1,1e9],[20,2500],{red:"impossible"},true)],
 params:()=>[K("p1","risk with high NO₂",-0.05,1.05,0.005,0.16,"",[0,1],[0.02,0.5],PWHY),K("p0","risk with low NO₂",-0.05,1.05,0.005,0.12,"",[0,1],[0.02,0.5],PWHY)],
 compute(v){const pb=(v.p1+v.p0)/2,se=Math.sqrt(pb*(1-pb)*2/v.n),z=(v.p1-v.p0)/se,p=2*(1-pnormStd(Math.abs(z)));
  return {lines:["z = (π̂₁ − π̂₀) / √(π̄(1 − π̄)(2/n)) = ("+F(v.p1,3)+" − "+F(v.p0,3)+") / "+F(se,4)+" = "+F(z)],out:[{label:"p-value",value:p<0.0001?"< 0.0001":F(p,4),z:[v.p1,v.p0].some(x=>x<0||x>1)?"red":"green",msg:"The difference stays the same; only the sample size changes the p-value."}]};},
 curve(c,v){return {x0:10,x1:3000,f:n=>{const pb=(v.p1+v.p0)/2,z=(v.p1-v.p0)/Math.sqrt(pb*(1-pb)*2/n);return 2*(1-pnormStd(Math.abs(z)));},y0:0,y1:1,at:v.n,xlab:"children per group",ylab:"p-value",extra:[{f:()=>0.05}]};}}));
PG.add(Object.assign(L(6),{id:"L06.2",title:"many tests and false positives",intro:"Testing m independent hypotheses, all of them truly null.",
 inputs:()=>[K("m","number of tests m",0,100,1,20,"",[1,1e9],[1,100],{red:"impossible: at least one test"},true)],
 params:()=>[K("al","significance level α",-0.02,0.5,0.001,0.05,"",[0,1],[0.001,0.1],{red:"impossible",amber:"an unusually lenient threshold"})],
 compute(v){const f=1-Math.pow(1-v.al,v.m);return {lines:["P(at least one false positive) = 1 − (1 − α)^m = 1 − (1 − "+F(v.al,3)+")^"+v.m+" = "+F(f,3)],out:[{label:"family-wise error rate",value:pct(f),z:v.m<1?"red":f>0.5?"amber":"green"},{label:"Bonferroni threshold α/m",value:F(v.al/v.m,5),z:"green"}]};},
 curve(c,v){return {x0:1,x1:100,f:m=>1-Math.pow(1-v.al,m),y0:0,y1:1,at:v.m,xlab:"number of tests",ylab:"chance of ≥ 1 false positive",fy:t=>Math.round(100*t)+"%"};}}));

/* ---------- Lesson 7 · linear regression ---------- */
function lmNO2(){const k=DB().children,X=k.map(c=>[1,c.green]),f=lmFit(X,k.map(c=>c.no2_modeled)),X2=k.map(c=>[1,c.green,c.ses,DISTRICTS[c.district_id-1].traffic]),f2=lmFit(X2,k.map(c=>c.no2_modeled));
  return {f:f,f2:f2,green:mm(k.map(c=>c.green)),ses:mm(k.map(c=>c.ses)),tr:mm(DISTRICTS.map(d=>d.traffic)),rug:thin(k.map(c=>c.green),150),rugT:DISTRICTS.map(d=>d.traffic)};}
PG.add(Object.assign(L(7),{id:"L07.0",title:"a straight line for NO₂ and green space",intro:"Children's NO₂ exposure against the share of green space around their home.",
 setup:lmNO2,
 inputs:c=>[K("g","green space share",-0.5,1.5,0.01,0.5,"",[0,1],c.green,{red:"impossible: a share lies between 0 and 1",amber:"possible, but outside the cohort's range",green:"within the cohort's range"})],
 params:c=>[K("b0","intercept β₀",0,80,0.1,c.f.beta[0],"µg/m³",null,[c.f.beta[0]-4*c.f.se[0],c.f.beta[0]+4*c.f.se[0]],{amber:"far from the fitted value"}),K("b1","slope β₁",-80,40,0.1,c.f.beta[1],"µg/m³ per unit",null,[c.f.beta[1]-4*c.f.se[1],c.f.beta[1]+4*c.f.se[1]],{amber:"far from the fitted value"})],
 compute(v){const y=v.b0+v.b1*v.g;return {lines:["NO₂ = β₀ + β₁ · green","= "+F(v.b0)+" "+sg(v.b1)+" × "+F(v.g)+" = "+F(y)],out:[{label:"predicted NO₂",value:F(y)+" µg/m³",z:y<0?"red":"green",msg:y<0?"A negative concentration: straight lines don't know that NO₂ can't go below zero.":""}]};},
 curve(c,v){return {x0:-0.5,x1:1.5,f:g=>v.b0+v.b1*g,valid:[0,1],data:c.green,yValid:[0,1e9],rug:c.rug,at:v.g,xlab:"green space share",ylab:"predicted NO₂ (µg/m³)"};}}));
PG.add(Object.assign(L(7),{id:"L07.1",title:"NO₂ with several predictors",intro:"Each coefficient is the change in mean NO₂ per unit, holding the others fixed.",
 setup:lmNO2,
 inputs:c=>[K("tr","district traffic density index",-0.3,1.5,0.01,0.5,"",[0,1],c.tr,{red:"impossible: the index runs from 0 to 1",amber:"possible, but beyond any district in the city"}),K("g","green space share",-0.5,1.5,0.01,0.5,"",[0,1],c.green,{red:"impossible: a share lies between 0 and 1",amber:"outside the cohort's range"}),K("s","SES score",-5,5,0.1,0,"",null,c.ses,{amber:"beyond the cohort's range"})],
 params:c=>[K("b3","traffic coefficient β₃",-20,80,0.1,c.f2.beta[3],"µg/m³ per unit",null,[c.f2.beta[3]-4*c.f2.se[3],c.f2.beta[3]+4*c.f2.se[3]],{amber:"far from the fitted value"})],
 compute(v,c){const b=c.f2.beta,y=b[0]+b[1]*v.g+b[2]*v.s+v.b3*v.tr;return {lines:["NO₂ = β₀ + β₁·green + β₂·SES + β₃·traffic","= "+F(b[0])+" "+sg(b[1])+"·"+F(v.g)+" "+sg(b[2])+"·"+F(v.s)+" "+sg(v.b3)+"·"+F(v.tr)+" = "+F(y)],out:[{label:"predicted NO₂",value:F(y)+" µg/m³",z:y<0?"red":"green",msg:y<0?"Impossible: the linear model can predict negative concentrations.":""}]};},
 curve(c,v){const b=c.f2.beta;return {x0:-0.3,x1:1.5,f:t=>b[0]+b[1]*v.g+b[2]*v.s+v.b3*t,valid:[0,1],data:c.tr,yValid:[0,1e9],rug:c.rugT,at:v.tr,xlab:"district traffic density (ticks: the 12 districts)",ylab:"predicted NO₂"};}}));

/* ---------- Lesson 8 · GLMs ---------- */
PG.add(Object.assign(L(8),{id:"L08.1",title:"logistic regression for asthma",intro:"Fitted to the cohort, with modeled NO₂. Describe a child, or change the NO₂ effect.",
 setup(){const k=DB().children,X=k.map(c=>[1,c.no2_modeled/10,c.ses,c.green,c.parent_smoke,c.sex==="boy"?1:0]),f=glmFit(X,k.map(c=>c.asthma),"binomial");return {f:f,no2:mm(k.map(c=>c.no2_modeled)),rug:thin(k.map(c=>c.no2_modeled),160),ses:mm(k.map(c=>c.ses))};},
 inputs:c=>[K("no2","modeled NO₂",-20,150,0.5,30,"µg/m³",[0,1000],c.no2,NO2WHY),K("s","SES score",-5,5,0.1,0,"",null,c.ses,{amber:"beyond the cohort's range"}),K("sm","parental smoking (0/1)",0,1,1,0,"",[0,1],[0,1],{red:"impossible: coded 0 or 1"},true)],
 params:c=>[K("b","log OR per 10 µg/m³ β",-1,2,0.005,c.f.beta[1],"",null,[c.f.beta[1]-2*c.f.se[1],c.f.beta[1]+2*c.f.se[1]],{amber:"outside the 95% confidence interval: not supported by the data",green:"within the 95% confidence interval"})],
 compute(v,c){const b=c.f.beta,e=b[0]+v.b*v.no2/10+b[2]*v.s+b[3]*0.5+b[4]*v.sm+b[5]*0.5,p=ex(e);return {lines:["logit(π) = β₀ + β·NO₂/10 + γ·z","= "+F(b[0])+" "+sg(v.b)+"·"+F(v.no2/10)+" "+sg(b[2])+"·"+F(v.s)+" "+sg(b[4])+"·"+v.sm+" + … = "+F(e),"π = 1/(1 + e^("+F(-e)+")) = "+pct(p)],out:[{label:"predicted risk",value:pct(p),z:"green"},{label:"odds ratio per 10 µg/m³",value:F(Math.exp(v.b)),z:Math.abs(v.b-c.f.beta[1])>2*c.f.se[1]?"amber":"green"}]};},
 curve(c,v){const b=c.f.beta,f=x=>ex(b[0]+v.b*x/10+b[2]*v.s+b[3]*0.5+b[4]*v.sm+b[5]*0.5);return {x0:-20,x1:150,f:f,y0:0,y1:Math.max(0.3,f(150)*1.05),valid:[0,1000],data:c.no2,rug:c.rug,at:v.no2,xlab:"modeled NO₂ (µg/m³)",ylab:"risk of asthma",fy:t=>Math.round(100*t)+"%"};}}));
PG.add(Object.assign(L(8),{id:"L08.2",title:"Poisson regression with an offset",intro:"Emergency visits by district and age group, as rates per 1,000 person-years.",
 setup(){const A=DA(),yrs=A.days.length/365.25,D={},P={};A.rows.forEach(r=>{const k=r.district_id+"|"+r.g;D[k]=(D[k]||0)+r.visits;});const X=[],y=[],off=[];
   DISTRICTS.forEach(d=>[0,1,2].forEach(g=>{const k=d.id+"|"+g,pt=agePop(d,g)*yrs;X.push([1,g===1?1:0,g===2?1:0,d.dep]);y.push(D[k]);off.push(Math.log(pt));}));
   const f=glmFit(X,y,"poisson",{offset:off});return {f:f,dep:mm(DISTRICTS.map(d=>d.dep))};},
 inputs:c=>[K("g","age group (0 = 0–14, 1 = 15–64, 2 = 65+)",0,2,1,2,"",[0,2],[0,2],{red:"impossible: there are three age groups"},true),K("dep","deprivation score",-0.3,1.3,0.01,0.5,"",[0,1],c.dep,{red:"impossible: the score runs from 0 to 1",amber:"beyond any district in the city"}),K("pt","person-years PT",-1000,100000,100,20000,"",[0.0001,1e12],[1000,100000],{red:"impossible: person-time must be positive"})],
 params:c=>[K("b","log rate ratio per unit deprivation β",-2,3,0.01,c.f.beta[3],"",null,[c.f.beta[3]-2*c.f.se[3]*Math.sqrt(Math.max(1,c.f.phi)),c.f.beta[3]+2*c.f.se[3]*Math.sqrt(Math.max(1,c.f.phi))],{amber:"outside the 95% interval",green:"within the 95% interval"})],
 compute(v,c){const b=c.f.beta,e=b[0]+(v.g===1?b[1]:0)+(v.g===2?b[2]:0)+v.b*v.dep,rate=Math.exp(e),mu=rate*v.pt;return {lines:["log μ = log PT + β₀ + γₖ + β·dep","log μ = log("+F(v.pt,0)+") "+sg(b[0])+" "+sg(v.g===1?b[1]:v.g===2?b[2]:0)+" "+sg(v.b)+"·"+F(v.dep)+"  ⇒  μ = "+F(mu)],out:[{label:"rate per 1,000 person-years",value:F(1000*rate),z:v.pt<=0?"red":"green"},{label:"expected visits",value:F(mu),z:v.pt<=0?"red":"green",msg:"The offset makes the count proportional to person-time: double PT, double μ."},{label:"rate ratio per unit deprivation",value:F(Math.exp(v.b)),z:"green"}]};},
 curve(c,v){const b=c.f.beta;return {x0:-0.3,x1:1.3,f:x=>1000*Math.exp(b[0]+(v.g===1?b[1]:0)+(v.g===2?b[2]:0)+v.b*x),y0:0,valid:[0,1],data:c.dep,rug:DISTRICTS.map(d=>d.dep),at:v.dep,xlab:"deprivation (ticks: the 12 districts)",ylab:"rate per 1,000 PY"};}}));
PG.add(Object.assign(L(8),{id:"L08.3",title:"overdispersion and quasi-Poisson",intro:"Quasi-Poisson keeps the Poisson's estimates but inflates the variance by φ.",
 inputs:()=>[K("mu","expected daily visits μ",-10,600,1,440,"",[0.000001,1e9],[5,600],{red:"impossible: a mean count must be positive"})],
 params:()=>[K("phi","dispersion φ",-1,20,0.05,2,"",[0.0001,1e9],[1,6],{red:"impossible",amber:"unusual: φ below 1 means less variation than Poisson, above 6 is extreme for daily visits"})],
 compute(v){return {lines:["Var(Y) = φ·μ = "+F(v.phi)+" × "+F(v.mu)+" = "+F(v.phi*v.mu)],out:[{label:"SD: Poisson vs quasi-Poisson",value:F(Math.sqrt(v.mu))+" vs "+F(Math.sqrt(v.phi*v.mu)),z:v.mu<=0||v.phi<=0?"red":"green"},{label:"standard errors multiplied by √φ",value:F(Math.sqrt(v.phi)),z:"green",msg:"Ignoring φ would make intervals too narrow by this factor."}]};},
 curve(c,v){return {x0:0,x1:600,f:m=>v.phi*m,y0:0,at:v.mu,xlab:"mean μ",ylab:"variance",extra:[{f:m=>m}]};}}));

/* ---------- Lesson 9 · effect modification and interaction ---------- */
PG.add(Object.assign(L(9),{id:"L09.1",title:"heat effects by age group",intro:"Summer heat effects fitted separately for each age group. The dashed lines show the other groups.",
 setup(){const A=DA(),summer=r=>[6,7,8].indexOf(+r.date.slice(5,7))>=0,eff=[0,1,2].map(g=>{const rows=A.rows.filter(r=>r.g===g&&summer(r));const X=rows.map(r=>[1,r.temp-22].concat([1,2,3,4,5,6].map(j=>r.dow===j?1:0)).concat(DISTRICTS.slice(1).map(d=>r.district_id===d.id?1:0)));const f=glmFit(X,rows.map(r=>r.visits),"poisson");return {b:f.beta[1],se:f.se[1]*Math.sqrt(Math.max(1,f.phi))};});
   const T=A.rows.filter(r=>summer(r)&&r.g===2).map(r=>r.temp);return {eff:eff,tr:mm(T)};},
 inputs:c=>[K("T","day's temperature",-100,100,0.5,28,"°C",[-90,60],c.tr,{red:"impossible on Earth",amber:"never observed in summer in this city: extrapolation",green:"within the summer range"}),K("g","age group (0 = 0–14, 1 = 15–64, 2 = 65+)",0,2,1,2,"",[0,2],[0,2],{red:"impossible: three groups"},true)],
 params:c=>c.eff.map((e,g)=>K("b"+g,"heat effect, "+["0–14","15–64","65+"][g]+" (log RR per °C)",-0.05,0.08,0.0005,e.b,"",null,[e.b-2*e.se,e.b+2*e.se],{amber:"outside the 95% interval",green:"within the 95% interval"})),
 compute(v){const b=v["b"+v.g],rr=Math.exp(b*(v.T-22));return {lines:["log RR = βₖ·(T − 22)","= "+F(b,4)+" × ("+F(v.T,1)+" − 22) = "+F(b*(v.T-22),3)],out:[{label:"RR vs a 22°C day, "+["age 0–14","age 15–64","age 65+"][v.g],value:F(rr),z:v.T>60||v.T<-90?"red":"green"},{label:"ratio of the 65+ and 0–14 effects (per °C)",value:F(Math.exp(v.b2-v.b0),3),z:"green",msg:"Effect modification: the same heat, different effects by age."}]};},
 curve(c,v){const others=[0,1,2].filter(g=>g!==v.g);return {x0:5,x1:40,f:T=>Math.exp(v["b"+v.g]*(T-22)),valid:[-90,60],data:c.tr,at:v.T,xlab:"temperature (°C)",ylab:"RR vs 22°C",extra:others.map(g=>({f:T=>Math.exp(v["b"+g]*(T-22))}))};}}));
PG.add(Object.assign(L(9),{id:"L09.2",title:"interaction on the additive scale (RERI)",intro:"NO₂ and parental smoking, alone and together.",
 inputs:()=>[K("r11","RR with both",-0.5,10,0.01,2.2,"",[0.000001,1e9],[0.2,8]),K("r10","RR with NO₂ alone",-0.5,10,0.01,1.3,"",[0.000001,1e9],[0.2,8]),K("r01","RR with smoking alone",-0.5,10,0.01,1.5,"",[0.000001,1e9],[0.2,8])],
 compute(v){const reri=v.r11-v.r10-v.r01+1,mult=v.r11/(v.r10*v.r01),bad=[v.r11,v.r10,v.r01].some(x=>x<=0);return {lines:["RERI = RR₁₁ − RR₁₀ − RR₀₁ + 1 = "+F(v.r11)+" − "+F(v.r10)+" − "+F(v.r01)+" + 1 = "+F(reri)],out:[{label:"RERI (additive interaction)",value:F(reri),z:bad?"red":"green",msg:reri>0?"More than additive: the joint effect exceeds the sum of the separate effects.":reri<0?"Less than additive.":"Exactly additive."},{label:"multiplicative interaction RR₁₁/(RR₁₀·RR₀₁)",value:F(mult),z:bad?"red":"green",msg:"The two scales can disagree: check RERI > 0 with this ratio below 1."}]};},
 curve(c,v){return {x0:0,x1:6,f:r=>r-v.r10-v.r01+1,valid:[0.000001,1e9],at:v.r11,xlab:"RR with both exposures",ylab:"RERI",extra:[{f:()=>0}]};}}));

/* ---------- Lesson 11 · splines ---------- */
PG.add(Object.assign(L(11),{id:"L11.0",title:"a spline for temperature",intro:"City-wide daily visits against temperature, with a natural spline. More knots, more flexibility; beyond the data, the curve continues as a straight line.",
 setup(){const A=DA(),y=new Array(A.days.length).fill(0);A.rows.forEach(r=>y[r.t]+=r.visits);const T=A.days.map(d=>d.temp_city),cache={};
   const fit=K=>{if(cache[K])return cache[K];const kn=rcsKnots(T,K),X=T.map((t,i)=>[1].concat(rcsRow(t,kn).map((q,j)=>j===0?(q-15)/10:q/10),[1,2,3,4,5,6].map(j=>A.days[i].dow===j?1:0))),f=glmFit(X,y,"poisson");return cache[K]={f:f,kn:kn};};
   return {fit:fit,tr:mm(T),rug:thin(T,150)};},
 inputs:c=>[K("T","temperature",-100,100,0.5,24,"°C",[-90,60],c.tr,{red:"impossible on Earth",amber:"beyond the city's observed range: the spline is extrapolating linearly",green:"within the data"})],
 params:()=>[K("K","number of knots",2,12,1,5,"",[3,1e9],[3,7],{red:"impossible: a natural spline needs at least 3 knots",amber:"many knots: the curve may follow noise"},true)],
 compute(v,c){if(v.K<3)return {lines:["(at least 3 knots needed)"],out:[]};const q=c.fit(Math.round(v.K)),b=q.f.beta,eta=t=>b[0]+rcsRow(t,q.kn).map((z,j)=>j===0?(z-15)/10:z/10).reduce((s,z,j)=>s+z*b[1+j],0),mu=Math.exp(eta(v.T)),rr=Math.exp(eta(v.T)-eta(20));
  return {lines:["log μ = β₀ + Σₖ βₖ·Bₖ(T) + weekday","Knots at "+q.kn.map(x=>F(x,1)+"°").join(", ")],out:[{label:"expected visits (a Monday)",value:F(mu,0),z:v.T>60||v.T<-90?"red":(v.T<c.tr[0]||v.T>c.tr[1])?"amber":"green",msg:v.T<c.tr[0]||v.T>c.tr[1]?"Beyond the data, the curve's shape is an assumption, not an estimate.":""},{label:"RR vs 20°C",value:F(rr),z:"green"}]};},
 curve(c,v){if(v.K<3)return {x0:-20,x1:45,f:()=>NaN};const q=c.fit(Math.round(v.K)),b=q.f.beta,eta=t=>b[0]+rcsRow(t,q.kn).map((z,j)=>j===0?(z-15)/10:z/10).reduce((s,z,j)=>s+z*b[1+j],0);return {x0:-20,x1:45,f:t=>Math.exp(eta(t)),valid:[-90,60],data:c.tr,rug:c.rug,at:v.T,xlab:"temperature (°C)",ylab:"expected visits"};}}));
})();
