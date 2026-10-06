document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children;
const ci=(b,se,s)=>[Math.exp(s*(b-1.96*se)),Math.exp(s*(b+1.96*se))];

/* ---------- 8.1 ---------- */
function drawK(){const a=+$("kA").value,b=+$("kB").value;$("kAO").textContent=fmt(a,1);$("kBO").textContent=fmt(b,2);
  const svg=clear($("links")),F=frame(svg,520,300,{l:44,r:14,t:16,b:40},[-4,4],[-1.5,4]);yGrid(F,[-1,0,1,2,3,4]);xAxis(F,[-4,-2,0,2,4],"predictor x");txt(svg,F.m.l,10,"mean of the outcome",{});
  const xs=[];for(let x=-4;x<=4.0001;x+=0.05)xs.push(x);const eta=xs.map(x=>a+b*x);
  el("rect",{x:F.m.l,y:F.Y(0),width:F.w-F.m.l-F.m.r,height:F.Y(-1.5)-F.Y(0),fill:css("--p2"),"fill-opacity":0.06},svg);txt(svg,F.w-F.m.r-4,F.Y(-1.2),"impossible for counts and probabilities",{"text-anchor":"end"});
  poly(F,xs,eta,{stroke:css("--c-lik"),"stroke-width":2.2});poly(F,xs,eta.map(e=>Math.exp(e)),{stroke:css("--p1"),"stroke-width":2.4});poly(F,xs,eta.map(e=>1/(1+Math.exp(-e))),{stroke:css("--p2"),"stroke-width":2.4});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(1),y2:F.Y(1),stroke:css("--p2"),"stroke-dasharray":"3 3","stroke-opacity":0.6},svg);
  const negAt=b!==0?-a/b:null;
  setNow("kNow","The linear predictor η = "+fmt(a,1)+" + "+fmt(b,2)+"x is the same in all three curves. With the <b>identity link</b> (gray), the mean is η itself"+(negAt!==null&&negAt>-4&&negAt<4?", and it turns negative "+(b>0?"below":"above")+" x = "+fmt(negAt,1)+": nonsense for a count or a probability":"")+". The <b>log link</b> (blue) turns η into e<sup>η</sup>, always positive; each unit of x multiplies the mean by e<sup>β</sup> = "+fmt(Math.exp(b),2)+", which is the rate ratio. The <b>logit link</b> (orange) squeezes η into a probability between 0 and 1; each unit of x multiplies the odds by e<sup>β</sup> = "+fmt(Math.exp(b),2)+", the odds ratio. When the probability is small, the orange and blue curves almost coincide: that is why ORs approximate RRs for rare outcomes.");}
["kA","kB"].forEach(id=>$(id).addEventListener("input",drawK));drawK();

/* ---------- 8.2 ---------- */
const y=kids.map(c=>c.asthma);
function robustRR(X,yv){const f=glmFit(X,yv,"poisson"),p=X[0].length,B=[];for(let a=0;a<p;a++)B.push(new Array(p).fill(0));
  X.forEach((x,i)=>{const r=yv[i]-f.mu[i];for(let a=0;a<p;a++)for(let b=0;b<p;b++)B[a][b]+=x[a]*x[b]*r*r;});
  const V=f.vcov,S=V.map(r=>B[0].map((_,b)=>r.reduce((s,v,k)=>s+v*B[k][b],0))),R=S.map(r=>V[0].map((_,b)=>r.reduce((s,v,k)=>s+v*V[k][b],0)));return {b:f.beta[1],se:Math.sqrt(R[1][1])};}
function drawG(){const xv=c=>$("gX").value==="true"?c.no2_true:c.no2_modeled,adj=$("gAdj").checked,xs=kids.map(xv);
  const iqr=quantile(xs,0.75)-quantile(xs,0.25),unit=$("gU").value==="iqr"?iqr:+$("gU").value;
  const X=kids.map(c=>[1,xv(c)/10].concat(adj?[c.ses,c.parent_smoke,c.green,c.sex==="boy"?1:0]:[]));
  const f=glmFit(X,y,"binomial"),b=f.beta[1]/10,se=f.se[1]/10,or=Math.exp(b*unit),lim=ci(b,se,unit),rr=robustRR(X,y),rrU=Math.exp(rr.b/10*unit),rrL=ci(rr.b/10,rr.se/10,unit);
  const ord=kids.map((c,i)=>[xs[i],c.asthma]).sort((p,q)=>p[0]-q[0]),dec=[];for(let k=0;k<10;k++){const s=ord.slice(Math.floor(k*ord.length/10),Math.floor((k+1)*ord.length/10));dec.push([mean(s.map(q=>q[0])),mean(s.map(q=>q[1])),s.length]);}
  const svg=clear($("gPlot")),F=frame(svg,520,280,{l:44,r:14,t:16,b:40},[0,70],[0,0.3]);yGrid(F,[0,0.1,0.2,0.3],v=>Math.round(100*v)+"%");xAxis(F,[0,10,20,30,40,50,60,70],"NO₂ (µg/m³)");txt(svg,F.m.l,10,"risk of asthma by age 8",{});
  dec.forEach(d=>{const s=Math.sqrt(d[1]*(1-d[1])/d[2]);el("line",{x1:F.X(d[0]),x2:F.X(d[0]),y1:F.Y(Math.max(0,d[1]-1.96*s)),y2:F.Y(Math.min(0.3,d[1]+1.96*s)),stroke:css("--c-ink"),"stroke-opacity":0.5},svg);el("circle",{cx:F.X(d[0]),cy:F.Y(d[1]),r:4.5,fill:css("--c-ink")},svg);});
  const mz=adj?[mean(kids.map(c=>c.ses)),mean(kids.map(c=>c.parent_smoke)),mean(kids.map(c=>c.green)),mean(kids.map(c=>c.sex==="boy"?1:0))]:[];
  const g=[];for(let v=0;v<=70;v+=1)g.push(v);poly(F,g,g.map(v=>{const e=f.beta[0]+f.beta[1]*v/10+mz.reduce((s,m,k)=>s+m*f.beta[2+k],0);return 1/(1+Math.exp(-e));}),{stroke:css("--p2"),"stroke-width":2.6});
  const uL=$("gU").value==="iqr"?"IQR ("+fmt(iqr,1)+" µg/m³)":unit+" µg/m³";
  $("gStats").innerHTML=[["OR per "+uL,fmt(or,3)],["95% CI",fmt(lim[0],3)+" to "+fmt(lim[1],3)],["RR per "+uL+" (modified Poisson)",fmt(rrU,3)],["true OR per 10 (simulation)",fmt(TRUTH_B.orPer10,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const names=["intercept","NO₂ per 10 µg/m³"].concat(adj?["SES score","parent smokes","green space","boy"]:[]);
  $("gTab").innerHTML="<tr><th>Term</th><th class='n'>OR</th><th class='n'>95% CI</th></tr>"+names.slice(1).map((nm,k)=>{const i=k+1,l=ci(f.beta[i],f.se[i],1);return "<tr><td>"+nm+"</td><td class='n'>"+fmt(Math.exp(f.beta[i]),2)+"</td><td class='n'>"+fmt(l[0],2)+" to "+fmt(l[1],2)+"</td></tr>";}).join("");
  const crude=glmFit(kids.map(c=>[1,xv(c)/10]),y,"binomial"),orC=Math.exp(crude.beta[1]/10*unit);
  let msg="The dots are the observed asthma risk in each tenth of the NO₂ distribution; the curve is the fitted logistic model"+(adj?", drawn at average values of the adjustment variables":"")+". Per "+uL+", the <b>"+(adj?"adjusted ":"crude ")+"OR is "+fmt(or,3)+"</b>"+(adj?" (crude: "+fmt(orC,3)+")":"")+". ";
  if(adj)msg+="Adjustment pulled the OR "+(or<orC?"down":"up")+": children in high-NO₂ districts also have lower SES, which independently raises asthma risk (Lesson 9). ";else msg+="Tick \"adjust\" to account for SES and the other variables. ";
  msg+=$("gX").value==="mod"?"With modeled NO₂, even the adjusted OR sits below the true "+fmt(TRUTH_B.orPer10,2)+": modeled exposure contains measurement error, which dilutes the association (Lesson 13). Switch to the true exposure to see.":"With the true exposure, the adjusted OR is close to the "+fmt(TRUTH_B.orPer10,2)+" used to simulate the data.";
  msg+=" Because asthma affects about 14% of children, the risk ratio ("+fmt(rrU,3)+") is a little closer to 1 than the OR.";
  setNow("gNow",msg);
  $("gReport").innerHTML="Each "+uL+" increase in "+($("gX").value==="mod"?"modeled":"true")+" residential NO₂ was associated with "+(or>=1?"higher":"lower")+" odds of asthma by age 8 (<b>"+(adj?"aOR":"OR")+" "+fmt(or,2)+", 95% CI "+fmt(lim[0],2)+" to "+fmt(lim[1],2)+"</b>"+(adj?"; adjusted for SES, parental smoking, green space and sex":"; unadjusted")+"). Risk ratio: "+fmt(rrU,2)+" ("+fmt(rrL[0],2)+" to "+fmt(rrL[1],2)+").";}
["gU","gX"].forEach(id=>$(id).addEventListener("change",drawG));$("gAdj").addEventListener("change",drawG);drawG();

/* ---------- 8.3 ---------- */
const agg=[];DISTRICTS.forEach(d=>[0,1,2].forEach(g=>{const rows=A.rows.filter(r=>r.district_id===d.id&&r.g===g);agg.push({d:d,g:g,D:sum(rows.map(r=>r.visits)),PT:agePop(d,g)*A.days.length/365.25});}));
function drawO(){const off=$("oOff").checked,dep=$("oDep").checked;
  const X=agg.map(a=>[1,a.g===1?1:0,a.g===2?1:0].concat(dep?[a.d.dep]:[])),yy=agg.map(a=>a.D),o=off?agg.map(a=>Math.log(a.PT)):null;
  const f=glmFit(X,yy,"poisson",{offset:o}),nm=["15–64 vs 0–14","65+ vs 0–14"].concat(dep?["deprivation, 0 → 1"]:[]);
  $("oTab").innerHTML="<tr><th>Term</th><th class='n'>"+(off?"rate ratio":"ratio of counts")+"</th><th class='n'>95% CI</th></tr>"+nm.map((n,k)=>{const i=k+1,l=ci(f.beta[i],f.se[i],1);return "<tr><td>"+n+"</td><td class='n'>"+fmt(Math.exp(f.beta[i]),2)+"</td><td class='n'>"+fmt(l[0],2)+" to "+fmt(l[1],2)+"</td></tr>";}).join("")+
    "<tr><td>baseline</td><td class='n' colspan='2'>"+(off?fmt(1000*Math.exp(f.beta[0]),0)+" visits per 1,000 person-years, age 0–14"+(dep?", deprivation 0":""):fmtInt(Math.exp(f.beta[0]))+" visits, age 0–14")+"</td></tr>";
  const f2=glmFit(agg.map(a=>[1,a.g===1?1:0,a.g===2?1:0,a.d.dep]),yy,"poisson",{offset:agg.map(a=>Math.log(a.PT))});
  let msg;
  if(off)msg="With the offset, each coefficient is a <b>rate ratio</b>: residents aged 65+ have "+fmt(Math.exp(f.beta[2]),2)+" times the visit rate of children, in the same district."+(dep?" Each unit of the deprivation index (from least to most deprived) multiplies the rate by "+fmt(Math.exp(f.beta[3]),2)+".":" Add deprivation to see its rate ratio.");
  else msg="Without the offset, the model describes raw <b>counts</b>. The 15–64 group now looks "+fmt(Math.exp(f.beta[1]),1)+" times higher than children, simply because there are far more working-age adults; and the large districts dominate. The true rate ratio for 15–64 vs 0–14 is about "+fmt(Math.exp(f2.beta[1]),2)+". The offset turns counts into rates.";
  msg+=" Dispersion: φ = "+fmt(f.phi,1)+(f.phi>3?". With 36 aggregated rows, variation between districts not captured by age and deprivation shows up as overdispersion; quasi-Poisson standard errors would be "+fmt(Math.sqrt(f.phi),1)+" times wider.":".");
  setNow("oNow",msg);
  $("oReport").innerHTML="Adjusted for age group, each unit increase in district deprivation was associated with a <b>"+fmt(100*(Math.exp(f2.beta[3])-1),0)+"% higher emergency visit rate</b> (rate ratio "+fmt(Math.exp(f2.beta[3]),2)+", 95% CI "+fmt(ci(f2.beta[3],f2.se[3],1)[0],2)+" to "+fmt(ci(f2.beta[3],f2.se[3],1)[1],2)+"; Poisson regression with log person-years as offset).";}
["oOff","oDep"].forEach(id=>$(id).addEventListener("change",drawO));drawO();

/* ---------- 8.4 ---------- */
function series(k){if(k==="city"){const v=new Array(A.days.length).fill(0);A.rows.forEach(r=>v[r.t]+=r.visits);return v;}const id=k==="ot"?6:11,g=k==="ot"?2:0;return A.rows.filter(r=>r.district_id===id&&r.g===g).map(r=>r.visits);}
function drawQ(){const k=$("qS").value,sea=$("qSea").checked,yy=series(k);
  const X=A.days.map(d=>[1,d.pm25/10].concat(sea?[Math.sin(2*Math.PI*d.doy/365.25),Math.cos(2*Math.PI*d.doy/365.25),Math.sin(4*Math.PI*d.doy/365.25),Math.cos(4*Math.PI*d.doy/365.25)].concat([1,2,3,4,5,6].map(j=>d.dow===j?1:0)):[]));
  const f=glmFit(X,yy,"poisson"),b=f.beta[1],se=f.se[1],seq=se*Math.sqrt(f.phi),lp=ci(b,se,1),lq=ci(b,seq,1);
  const svg=clear($("qPlot")),lo=Math.min(lq[0],lp[0]),hi=Math.max(lq[1],lp[1]),pad=(hi-lo)*0.25,F=frame(svg,520,220,{l:20,r:14,t:16,b:40},[Math.min(0.995,lo-pad),Math.max(1.005,hi+pad)],[0,3]);
  xAxis(F,niceTicks(F.xr[0],F.xr[1],5),"rate ratio per 10 µg/m³ PM2.5",v=>fmt(v,3));
  el("line",{x1:F.X(1),x2:F.X(1),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"4 3"},svg);
  [[lp,2,"Poisson","--p1"],[lq,1,"quasi-Poisson","--p2"]].forEach(r=>{el("line",{x1:F.X(r[0][0]),x2:F.X(r[0][1]),y1:F.Y(r[1]),y2:F.Y(r[1]),stroke:css(r[3]),"stroke-width":4},svg);el("circle",{cx:F.X(Math.exp(b)),cy:F.Y(r[1]),r:5,fill:css(r[3])},svg);txt(svg,F.X(r[0][1])+6,F.Y(r[1])+4,r[2],{style:"fill:"+css(r[3])});});
  const pP=2*(1-pnormStd(Math.abs(b/se))),pQ=2*(1-pnormStd(Math.abs(b/seq)));
  $("qStats").innerHTML=[["rate ratio per 10 µg/m³",fmt(Math.exp(b),3)],["dispersion φ",fmt(f.phi,2)],["Poisson p",pFmt(pP)],["quasi-Poisson p",pFmt(pQ)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("qNow","Each 10 µg/m³ of PM2.5 is associated with a rate ratio of <b>"+fmt(Math.exp(b),3)+"</b> ("+fmt(100*(Math.exp(b)-1),1)+"% change in daily visits). The estimate is identical in both models. But the dispersion is φ = "+fmt(f.phi,2)+": the counts vary "+fmt(f.phi,1)+" times more than Poisson assumes, so quasi-Poisson widens the interval by √φ = "+fmt(Math.sqrt(f.phi),2)+". "+(f.phi>1.5?"The Poisson interval is falsely precise.":"Here the overdispersion is modest.")+(sea?"":" Without adjustment for season, unmodeled seasonal variation inflates φ, and seasonal confounding distorts the estimate itself: PM2.5 is higher in winter, when visits are higher anyway.")+" Note also that temperature isn't in this model; Lesson 9 shows why that matters.");
  $("qReport").innerHTML="Each 10 µg/m³ increase in daily PM2.5 was associated with a <b>"+fmt(100*(Math.exp(b)-1),1)+"% change in emergency visits (95% CI "+fmt(100*(lq[0]-1),1)+" to "+fmt(100*(lq[1]-1),1)+"%)</b>"+(sea?", adjusted for season and day of week":"")+" (quasi-Poisson regression, dispersion "+fmt(f.phi,2)+").";}
$("qS").addEventListener("change",drawQ);$("qSea").addEventListener("change",drawQ);drawQ();

buildQuiz("quizzes",[
 {t:"stat",q:"Why is the log link used for count data?",o:[["Because counts are always large","Counts can be small; that isn't the reason.",0],["It keeps the expected count positive and makes effects multiplicative (rate ratios)","e^η is always positive, and e^β multiplies the mean per unit of x.",1],["Because counts are normally distributed","They aren't; the log link is paired with a Poisson or negative binomial distribution.",0],["It makes the variance constant","The log link concerns the mean; the variance comes from the distribution.",0]]},
 {t:"epi",q:"A logistic regression gives β = 0.014 per µg/m³ of NO₂. The OR per 10 µg/m³ is:",o:[["0.14","Exponentiate after multiplying: exp(10 × 0.014).",0],["About 1.15","exp(0.14) ≈ 1.15.",1],["1.014 × 10 = 10.14","ORs multiply, they don't scale linearly.",0],["1.014","That's the OR per 1 µg/m³.",0]]},
 {t:"epi",q:"An outcome affects 30% of participants. A logistic model gives aOR = 1.8. A reader should:",o:[["Interpret it as an 80% increase in risk","With a common outcome, the OR exaggerates the risk ratio.",0],["Know the risk ratio is smaller, and ideally see a risk ratio estimated directly","Modified Poisson or log-binomial models, or standardization, estimate the RR.",1],["Conclude the model is wrong","The OR is correctly estimated; it just isn't a risk ratio.",0],["Ignore it, because ORs are invalid for common outcomes","ORs are valid measures; they are just easy to misread.",0]]},
 {t:"stat",q:"In a Poisson model of district counts, what does the offset log(person-years) do?",o:[["It adjusts for confounding by age","Age is adjusted by including age terms, not the offset.",0],["It makes the model describe rates per person-year rather than raw counts","With the offset, coefficients are log rate ratios.",1],["It removes overdispersion","Overdispersion needs quasi-Poisson or negative binomial models.",0],["It forces the intercept to zero","It fixes the coefficient of log(PT) at 1; the intercept stays.",0]]},
 {t:"stat",q:"A Poisson model has dispersion φ = 4. Compared with Poisson, quasi-Poisson standard errors are:",o:[["The same","Quasi-Poisson rescales standard errors by √φ.",0],["Twice as large","√4 = 2.",1],["Four times as large","The variance is four times larger; the SE is √4 = 2 times.",0],["Smaller","Overdispersion means Poisson SEs are too small, not too large.",0]]},
 {t:"stat",q:"Which of these changes when switching from Poisson to quasi-Poisson regression?",o:[["The coefficient estimates","They are identical; only the variance assumption changes.",0],["The standard errors and confidence intervals","They are multiplied by √φ.",1],["The link function","Both use the log link.",0],["The offset","The offset is the same in both.",0]]}]);
onTheme(()=>{drawK();drawG();drawO();drawQ();});
});
