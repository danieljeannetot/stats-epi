document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const kids=genB().children,y=kids.map(c=>c.asthma),n=kids.length,TRUE_OR=TRUTH_B.orPer10;
const rz=makeRng(1313),Z=kids.map(()=>gaussFrom(rz));
const fitOR=xs=>{const f=glmFit(kids.map((c,i)=>[1,xs[i]/10,c.ses,c.green]),y,"binomial");return {or:Math.exp(f.beta[1]),b:f.beta[1],se:f.se[1]};};
const X=kids.map(c=>c.no2_true);
const resVar=(function(){const f=lmFit(kids.map(c=>[1,c.ses,c.green]),X);return f.sigma*f.sigma;})();
const lam=s=>resVar/(resVar+s*s);
const distMean={};DISTRICTS.forEach(d=>{const k=kids.filter(c=>c.district_id===d.id);distMean[d.id]=mean(k.map(c=>c.no2_true));});
const ORtrue=fitOR(X),ORmod=fitOR(kids.map(c=>c.no2_modeled));

/* ---------- 13.1 ---------- */
function drawME(){const t=$("meT").value,s=+$("meS").value;$("meSO").textContent=fmt(s,1);$("meRow").style.opacity=t==="cl"?1:0.4;$("meS").disabled=t!=="cl";
  let W,lab;if(t==="cl"){W=X.map((x,i)=>x+s*Z[i]);lab="true NO₂ + classical error (SD "+fmt(s,1)+")";}else if(t==="bk"){W=kids.map(c=>distMean[c.district_id]);lab="district average of true NO₂";}else{W=kids.map(c=>c.no2_modeled);lab="modeled NO₂";}
  const r=fitOR(W),svg=clear($("mePlot")),F=frame(svg,520,260,{l:44,r:12,t:16,b:40},[0,15],[0.95,1.25]);yGrid(F,[1,1.05,1.1,1.15,1.2,1.25],v=>fmt(v,2));xAxis(F,[0,3,6,9,12,15],"classical error SD (µg/m³)");txt(svg,F.m.l,10,"odds ratio per 10 µg/m³ (adjusted for SES and green space)",{});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(TRUE_OR),y2:F.Y(TRUE_OR),stroke:css("--p4"),"stroke-width":2,"stroke-dasharray":"5 4"},svg);
  const xs=[];for(let v=0;v<=15;v+=0.25)xs.push(v);poly(F,xs,xs.map(v=>Math.exp(lam(v)*ORtrue.b)),{stroke:css("--p1"),"stroke-width":2.4});
  const px=t==="cl"?s:t==="mod"?TRUTH_B.errSD:0;const lo=Math.exp(r.b-1.96*r.se),hi=Math.exp(r.b+1.96*r.se);
  el("line",{x1:F.X(px),x2:F.X(px),y1:F.Y(Math.max(0.95,lo)),y2:F.Y(Math.min(1.25,hi)),stroke:css("--p2"),"stroke-width":3},svg);el("circle",{cx:F.X(px),cy:F.Y(Math.max(0.95,Math.min(1.25,r.or))),r:6,fill:css("--p2")},svg);
  $("meStats").innerHTML=[["OR with this exposure",fmt(r.or,3)],["95% CI",fmt(lo,3)+" to "+fmt(hi,3)],["OR with true NO₂",fmt(ORtrue.or,3)],["attenuation factor λ",t==="cl"?fmt(lam(s),2):t==="mod"?fmt(lam(TRUTH_B.errSD),2):"≈ 1"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg;
  if(t==="cl")msg="Each child's exposure is their true NO₂ plus random noise with SD "+fmt(s,1)+" µg/m³. After accounting for SES and green space, true NO₂ varies with an SD of "+fmt(Math.sqrt(resVar),1)+", so the share of the measured variation that is signal is λ = "+fmt(lam(s),2)+". The log odds ratio shrinks by about that factor: from "+fmt(ORtrue.or,3)+" to <b>"+fmt(r.or,3)+"</b>. The blue curve shows the expected attenuation; the estimate scatters around it by chance. Note that the interval doesn't get much wider, it just moves toward 1: classical error makes estimates <i>precisely wrong</i>.";
  else if(t==="bk")msg="Each child is given their district's average NO₂, so the true values scatter around the assigned one: Berkson error. The OR is <b>"+fmt(r.or,3)+"</b>, close to the truth ("+fmt(ORtrue.or,3)+"), but the interval is much wider ("+fmt(lo,2)+" to "+fmt(hi,2)+") because only 12 distinct exposure values remain, and they are entangled with district-level confounding. Berkson error costs precision rather than causing bias, at least for linear and log-linear models.";
  else msg="The cohort's modeled NO₂ was simulated as true NO₂ plus classical error with SD "+TRUTH_B.errSD+" µg/m³, as from a land-use regression model with imperfect individual predictions. The adjusted OR is <b>"+fmt(r.or,3)+"</b>, against "+fmt(ORtrue.or,3)+" with the true exposure: most of the gap between the naive estimate and the truth comes from this error. The next two sections correct it.";
  setNow("meNow",msg);
  $("meReport").innerHTML="Using "+lab+", each 10 µg/m³ was associated with an <b>aOR of "+fmt(r.or,2)+" (95% CI "+fmt(lo,2)+" to "+fmt(hi,2)+")</b>. "+(t!=="bk"?"Exposure measurement error is expected to bias this estimate toward the null (estimated reliability λ = "+fmt(lam(t==="cl"?s:TRUTH_B.errSD),2)+").":"District-average exposure introduces Berkson-type error, which reduces precision.");}
$("meT").addEventListener("change",drawME);$("meS").addEventListener("input",drawME);drawME();

/* ---------- 13.2 ---------- */
const VAL=kids.map((c,i)=>i).filter(i=>kids[i].validation===1);let rcSeed=1;
function drawRC(){const m=+$("rcN").value;$("rcNO").textContent=m;const r=makeRng(300+rcSeed),sub=VAL.slice().sort(()=>r()-0.5).slice(0,m);
  const cal=lmFit(sub.map(i=>[1,kids[i].no2_modeled,kids[i].ses,kids[i].green]),sub.map(i=>kids[i].no2_personal));
  const xc=kids.map(c=>cal.beta[0]+cal.beta[1]*c.no2_modeled+cal.beta[2]*c.ses+cal.beta[3]*c.green),rc=fitOR(xc);
  const slope=cal.beta[1],seS=cal.se[1],seRC=rc.se,lo=Math.exp(rc.b-1.96*seRC),hi=Math.exp(rc.b+1.96*seRC);
  const svg=clear($("rcPlot")),F=frame(svg,520,280,{l:44,r:12,t:16,b:40},[0,70],[0,70]);yGrid(F,[0,20,40,60]);xAxis(F,[0,10,20,30,40,50,60,70],"modeled NO₂ (µg/m³)");txt(svg,F.m.l,10,"personal-monitor NO₂ (µg/m³), "+m+" children in the validation study",{});
  poly(F,[0,70],[0,70],{stroke:css("--c-muted"),"stroke-dasharray":"4 3"});
  sub.forEach(i=>el("circle",{cx:F.X(Math.min(70,kids[i].no2_modeled)),cy:F.Y(Math.min(70,kids[i].no2_personal)),r:3,fill:css("--c-lik"),"fill-opacity":0.7},svg));
  const sm=mean(sub.map(i=>kids[i].ses)),gm=mean(sub.map(i=>kids[i].green));poly(F,[0,70],[0,70].map(w=>cal.beta[0]+cal.beta[1]*w+cal.beta[2]*sm+cal.beta[3]*gm),{stroke:css("--p2"),"stroke-width":2.6});
  txt(svg,F.X(62),F.Y(66),"no error",{style:"fill:"+css("--c-muted")});
  $("rcStats").innerHTML=[["calibration slope",fmt(slope,2)+" (SE "+fmt(seS,2)+")"],["naive aOR",fmt(ORmod.or,3)],["calibrated aOR",fmt(rc.or,3)],["true aOR",fmt(ORtrue.or,3)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("rcNow","Among the "+m+" validation children, personal NO₂ rises by only <b>"+fmt(slope,2)+"</b> µg/m³ per µg/m³ of modeled NO₂ (orange line, flatter than the dashed line of perfect agreement). That slope is the estimated attenuation factor. Using each child's predicted true exposure instead of the modeled one raises the aOR from "+fmt(ORmod.or,3)+" to <b>"+fmt(rc.or,3)+"</b> (95% CI "+fmt(lo,2)+" to "+fmt(hi,2)+"), against a true "+fmt(ORtrue.or,3)+". "+(Math.abs(rc.or-ORtrue.or)<0.03?"The correction recovers the truth closely. ":"The correction divides the naive log odds ratio by the slope, as it should; the remaining gap is sampling error in this one cohort, and the corrected interval "+(lo<=ORtrue.or&&hi>=ORtrue.or?"includes":"narrowly misses")+" the true value. ")+(m<80?"With a small validation study, the calibration slope itself is uncertain (SE "+fmt(seS,2)+"), and that uncertainty must be carried into the final interval, by bootstrap or by a Bayesian model. Draw a few subsamples to see how much the corrected OR moves.":"The interval shown here ignores the calibration step's own uncertainty; a bootstrap over both datasets would widen it a little."));
  $("rcReport").innerHTML="After regression calibration using a validation study of "+m+" children with personal monitoring (calibration slope "+fmt(slope,2)+"), each 10 µg/m³ of NO₂ was associated with an <b>aOR of "+fmt(rc.or,2)+"</b> (uncorrected "+fmt(ORmod.or,2)+"); bootstrap 95% CI to be reported.";}
$("rcN").addEventListener("input",drawRC);$("rcNew").addEventListener("click",()=>{rcSeed++;drawRC();});drawRC();

/* ---------- 13.3 ---------- */
let sx=null;
function runSX(){/* antithetic pairs (+Z, -Z) cancel the chance correlation between added noise and outcome */
  const s=+$("sxS").value,lams=[0,0.5,1,1.5,2],B=10,r=makeRng(5151),Zs=[];for(let b=0;b<B;b++)Zs.push(kids.map(()=>gaussFrom(r)));const pts=[];
  lams.forEach(l=>{let acc=0,k=0;if(l===0){acc=fitOR(kids.map(c=>c.no2_modeled)).b;k=1;}else for(let b=0;b<B;b++)for(const sg of [1,-1]){acc+=fitOR(kids.map((c,i)=>c.no2_modeled+sg*Math.sqrt(l)*s*Zs[b][i])).b;k++;}pts.push([l,acc/k]);});
  const q=lmFit(pts.map(p=>[1,p[0],p[0]*p[0]]),pts.map(p=>p[1]));sx={s:s,pts:pts,q:q.beta,est:q.beta[0]-q.beta[1]+q.beta[2]};drawSX();}
function drawSX(){$("sxSO").textContent=fmt(+$("sxS").value,1);const svg=clear($("sxPlot")),F=frame(svg,520,280,{l:44,r:12,t:16,b:40},[-1.1,2.1],[0.98,1.22]);
  yGrid(F,[1,1.05,1.1,1.15,1.2],v=>fmt(v,2));xAxis(F,[-1,-0.5,0,0.5,1,1.5,2],"λ: added error variance, as a multiple of the original");txt(svg,F.m.l,10,"odds ratio per 10 µg/m³",{});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(TRUE_OR),y2:F.Y(TRUE_OR),stroke:css("--p4"),"stroke-dasharray":"5 4","stroke-width":2},svg);el("line",{x1:F.X(-1),x2:F.X(-1),y1:F.m.t,y2:F.Y(0.98),stroke:css("--c-muted"),"stroke-dasharray":"2 3"},svg);txt(svg,F.X(-1)+4,F.Y(0.99),"no error",{});
  if(!sx){$("sxStats").innerHTML="";setNow("sxNow","Press <b>Run SIMEX</b>. It refits the model with extra noise added to modeled NO₂ at four levels, twenty times each (in pairs of opposite sign, which cancels chance correlations), then extrapolates.");return;}
  const xs=[];for(let l=-1;l<=2.0001;l+=0.05)xs.push(l);poly(F,xs,xs.map(l=>Math.exp(sx.q[0]+sx.q[1]*l+sx.q[2]*l*l)),{stroke:css("--p1"),"stroke-width":2.2,"stroke-dasharray":"6 3"});
  sx.pts.forEach(p=>el("circle",{cx:F.X(p[0]),cy:F.Y(Math.exp(p[1])),r:6,fill:css("--p1")},svg));el("circle",{cx:F.X(-1),cy:F.Y(Math.exp(sx.est)),r:7,fill:css("--p2")},svg);
  $("sxStats").innerHTML=[["naive aOR (λ = 0)",fmt(Math.exp(sx.pts[0][1]),3)],["SIMEX aOR (λ = −1)",fmt(Math.exp(sx.est),3)],["true aOR",fmt(ORtrue.or,3)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("sxNow","At λ = 0 is the naive estimate, "+fmt(Math.exp(sx.pts[0][1]),3)+". Adding extra error of variance λ × "+fmt(sx.s,1)+"² makes the estimate fall further (blue points). A quadratic curve through them is extrapolated back to λ = −1, where the total error variance would be zero: <b>"+fmt(Math.exp(sx.est),3)+"</b>, against a true "+fmt(ORtrue.or,3)+". "+(Math.abs(sx.s-TRUTH_B.errSD)>1?"The assumed error SD ("+fmt(sx.s,1)+") differs from the actual "+TRUTH_B.errSD+": SIMEX corrects "+(sx.s<TRUTH_B.errSD?"too little":"too much")+". Its answer depends on knowing the error variance, typically from a validation or replicate study.":"With the correct error SD, SIMEX recovers much of the attenuation. The quadratic extrapolation usually corrects only partially, because the true curve bends more steeply near λ = −1."));}
$("sxRun").addEventListener("click",runSX);$("sxS").addEventListener("input",()=>{sx=null;drawSX();});drawSX();

/* ---------- 13.4 ---------- */
const hi=kids.map(c=>c.no2_true>=30?1:0),rm=makeRng(4141),Um=kids.map(()=>rm());
function drawMC(){const se0=+$("mcSe").value/100,se1=+$("mcSe1").value/100,sp=+$("mcSp").value/100;$("mcSeO").textContent=Math.round(100*se0)+"%";$("mcSe1O").textContent=Math.round(100*se1)+"%";$("mcSpO").textContent=Math.round(100*sp)+"%";
  const obs=kids.map((c,i)=>{const se=hi[i]?se1:se0;return c.asthma?(Um[i]<se?1:0):(Um[i]<1-sp?1:0);});
  const tab=(v)=>{let a=0,b=0,c=0,d=0;kids.forEach((k,i)=>{if(hi[i]){if(v[i])a++;else b++;}else{if(v[i])c++;else d++;}});return {a,b,c,d};};
  const T1=tab(y),T2=tab(obs),or=t=>(t.a*t.d)/(t.b*t.c),n1=T1.a+T1.b,n0=T1.c+T1.d;
  const cor=(pos,nn,se)=>(pos-(1-sp)*nn)/(se+sp-1),ca=cor(T2.a,n1,se1),cc=cor(T2.c,n0,se0),orC=(ca*(n0-cc))/((n1-ca)*cc);
  $("mcTab").innerHTML="<tr><th></th><th class='n'>high NO₂: cases / n</th><th class='n'>lower NO₂: cases / n</th><th class='n'>OR</th></tr>"+
    "<tr><td>true asthma</td><td class='n'>"+T1.a+" / "+n1+"</td><td class='n'>"+T1.c+" / "+n0+"</td><td class='n'>"+fmt(or(T1),2)+"</td></tr>"+
    "<tr><td>questionnaire positive</td><td class='n'>"+T2.a+" / "+n1+"</td><td class='n'>"+T2.c+" / "+n0+"</td><td class='n'>"+fmt(or(T2),2)+"</td></tr>"+
    "<tr><td>corrected (assumed Se, Sp)</td><td class='n'>"+fmt(ca,0)+" / "+n1+"</td><td class='n'>"+fmt(cc,0)+" / "+n0+"</td><td class='n'>"+(ca>0&&cc>0?fmt(orC,2):"—")+"</td></tr>";
  const diff=Math.abs(se1-se0)>0.005;
  $("mcStats").innerHTML=[["OR, true outcome",fmt(or(T1),2)],["OR, misclassified outcome",fmt(or(T2),2)],["OR, corrected",ca>0&&cc>0?fmt(orC,2):"—"],["type",diff?"differential":"non-differential"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const toward=Math.abs(Math.log(or(T2)))<Math.abs(Math.log(or(T1)));
  setNow("mcNow","Using the questionnaire as the outcome, the crude OR for high vs lower NO₂ is <b>"+fmt(or(T2),2)+"</b>, against "+fmt(or(T1),2)+" with true asthma status. "+(diff?"Misclassification is <b>differential</b>: the questionnaire picks up "+Math.round(100*se1)+"% of cases among highly exposed children but "+Math.round(100*se0)+"% among the others. The bias is "+(toward?"toward":"away from")+" 1 here; with differential error, it can go either way.":"Misclassification is <b>non-differential</b>, with the same sensitivity and specificity in both groups. False positives, from the many children without asthma, dilute the contrast: the OR is "+(toward?"biased toward 1, as expected.":"by chance not attenuated in this sample, which can happen.")+(sp<0.99?" Raise the specificity and see how much of the bias comes from false positives.":""))+" With sensitivity and specificity known or assumed, the corrected counts give an OR of "+(ca>0&&cc>0?fmt(orC,2):"(undefined: the assumed values are inconsistent with the data)")+". Probabilistic bias analysis repeats such corrections over a distribution of plausible values.");
  $("mcReport").innerHTML="Using the parent-reported wheeze questionnaire as the outcome gave an OR of "+fmt(or(T2),2)+" for NO₂ ≥ 30 µg/m³. <b>Correcting for an assumed sensitivity of "+Math.round(100*se0)+(diff?"–"+Math.round(100*se1):"")+"% and specificity of "+Math.round(100*sp)+"%, the OR was "+(ca>0&&cc>0?fmt(orC,2):"not estimable")+"</b>.";}
["mcSe","mcSe1","mcSp"].forEach(id=>$(id).addEventListener("input",drawMC));$("mcND").addEventListener("click",()=>{$("mcSe1").value=$("mcSe").value;drawMC();});drawMC();

buildQuiz("quizzes",[
 {t:"epi",q:"A land-use regression model predicts each child's NO₂ with random error. Compared with the true effect, the estimated odds ratio will tend to be:",o:[["Exaggerated","Classical error dilutes, it doesn't exaggerate (for a single error-prone exposure).",0],["Closer to 1 (attenuated)","Classical error causes regression dilution.",1],["Unbiased but less precise","That's typical of Berkson error.",0],["Unpredictable in direction","For a single continuous exposure with classical error, attenuation is the expected direction.",0]]},
 {t:"stat",q:"Each child is assigned the average NO₂ of their district. The error is:",o:[["Classical","With classical error, the measurement scatters around the truth.",0],["Berkson: the truth scatters around the assigned value","Group-average assignment produces Berkson error.",1],["Differential misclassification","Misclassification refers to categorical variables.",0],["Not an error, since averages are unbiased","Individuals still differ from their assigned value.",0]]},
 {t:"stat",q:"True exposure has variance 64 after accounting for covariates, and the error variance is 16. The attenuation factor λ is:",o:[["0.25","That's 16/64.",0],["0.8","λ = 64 / (64 + 16) = 0.8.",1],["1.25","λ can't exceed 1.",0],["0.2","That's 16/80, the error share.",0]]},
 {t:"epi",q:"Why does regression calibration need a validation study?",o:[["To increase the sample size","The validation study is usually small.",0],["To estimate the relation between true and measured exposure, which determines the correction","Without it, the size of the error is unknown.",1],["To remove confounding","It addresses measurement error, not confounding.",0],["Because it must use the same children as the main study","It can use an external validation study if transportable.",0]]},
 {t:"stat",q:"In SIMEX, extrapolating to λ = −1 corresponds to:",o:[["Doubling the error","That's λ = 1 of added error.",0],["Zero total measurement error","The original error plus −1 times its variance gives zero.",1],["Negative exposure values","λ refers to error variance, not exposure.",0],["The naive estimate","The naive estimate is at λ = 0.",0]]},
 {t:"epi",q:"Parents of children living near busy roads are more likely to report wheeze, regardless of asthma. This misclassification is:",o:[["Non-differential, and biases toward the null","It depends on exposure, so it's differential.",0],["Differential, and can bias in either direction (here likely away from the null)","Higher sensitivity or lower specificity among the exposed inflates the observed association.",1],["Irrelevant if the sample is large","Bias doesn't shrink with sample size.",0],["Correctable without any information about Se and Sp","Correction needs values for sensitivity and specificity, at least as assumptions.",0]]}]);
onTheme(()=>{drawME();drawRC();drawSX();drawMC();});
});
