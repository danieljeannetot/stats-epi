document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const kids=genB().children, N=kids.length;
const pct=(v,d)=>fmt(100*v,d===undefined?1:d)+"%";

/* ---------- 2.1 and 2.2: events in the cohort ---------- */
const EV={smoke:{lab:"a parent smokes",f:c=>c.parent_smoke===1,short:"parent smokes"},
  no2:{lab:"modeled NO₂ ≥ 30 µg/m³",f:c=>c.no2_modeled>=30,short:"high NO₂"},
  boy:{lab:"the child is a boy",f:c=>c.sex==="boy",short:"boy"},
  wheeze:{lab:"a positive wheeze questionnaire",f:c=>c.wheeze_q===1,short:"questionnaire positive"}};
function counts(key){const f=EV[key].f;let n11=0,n10=0,n01=0,n00=0;kids.forEach(c=>{const a=c.asthma===1,b=f(c);if(a&&b)n11++;else if(!a&&b)n01++;else if(a&&!b)n10++;else n00++;});return {n11,n10,n01,n00};}
function drawEvents(){const key=$("pairSel").value,E=EV[key],k=counts(key);
  const pB=(k.n11+k.n01)/N,pA=(k.n11+k.n10)/N,pAB=k.n11/N,pAuB=pA+pB-pAB,pAgB=k.n11/(k.n11+k.n01),pAgnB=k.n10/(k.n10+k.n00),pBgA=k.n11/(k.n11+k.n10);
  const svg=clear($("mosaic")),W=500,H=280,x0=10,y0=26,wB=W*pB;
  txt(svg,x0,14,"Width: share with and without B. Orange height within each column: P(asthma | that column).",{});
  [[x0,wB,pAgB,"B: "+E.short],[x0+wB+4,W-wB-4,pAgnB,"not B"]].forEach(c=>{const hA=H*c[2];
    el("rect",{x:c[0],y:y0,width:Math.max(1,c[1]),height:H-hA,fill:css("--c-rule")},svg);
    el("rect",{x:c[0],y:y0+H-hA,width:Math.max(1,c[1]),height:hA,fill:css("--p2")},svg);
    txt(svg,c[0]+c[1]/2,y0+H+16,c[3],{"text-anchor":"middle",style:"fill:"+css("--c-ink")+";font-weight:600"});
    if(c[1]>60)txt(svg,c[0]+c[1]/2,y0+H-hA-6,pct(c[2]),{"text-anchor":"middle",style:"fill:"+css("--c-ink")});});
  $("pStats").innerHTML=[["P(A)",pct(pA)],["P(B)",pct(pB)],["P(A ∩ B)",pct(pAB)],["P(A ∪ B)",pct(pAuB)],["P(A | B)",pct(pAgB)],["P(A | not B)",pct(pAgnB)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  const indep=pA*pB,ratio=pAgB/pAgnB;
  setNow("pNow","Of the "+fmtInt(N)+" children, <b>"+pct(pB)+"</b> have B ("+E.lab+") and <b>"+pct(pA)+"</b> develop asthma. <b>"+pct(pAB)+"</b> have both, so the probability of at least one is "+pct(pA)+" + "+pct(pB)+" − "+pct(pAB)+" = <b>"+pct(pAuB)+"</b>; the overlap is subtracted so it isn't counted twice.<br><br>If the events were independent, P(A ∩ B) would equal P(A) × P(B) = "+pct(indep,2)+". It is actually "+pct(pAB,2)+". "+(Math.abs(ratio-1)<0.08?"The two are close, and the columns in the plot have similar orange heights: B tells us little about asthma.":"The columns' orange heights differ: asthma is "+fmt(ratio,2)+" times as common when B is true. The events are associated."));
  $("pReport").innerHTML="Among children for whom B held ("+E.lab+"), "+pct(pAgB)+" developed asthma by age 8, compared with "+pct(pAgnB)+" among the others (<b>risk ratio "+fmt(ratio,2)+"</b>).";
  $("condTable").innerHTML="<tr><th>Conditional probability</th><th class='n'>Value</th><th>Reads as</th></tr>"+
    "<tr><td>P(A | B)</td><td class='n'>"+pct(pAgB)+"</td><td>of children with B, the share who develop asthma</td></tr>"+
    "<tr><td>P(B | A)</td><td class='n'>"+pct(pBgA)+"</td><td>of children with asthma, the share who have B</td></tr>"+
    "<tr><td>P(A | not B)</td><td class='n'>"+pct(pAgnB)+"</td><td>of children without B, the share who develop asthma</td></tr>";
  setNow("condNow","P(A | B) = "+pct(pAgB)+" but P(B | A) = "+pct(pBgA)+". They answer different questions, with different denominators: "+fmtInt(k.n11+k.n01)+" children with B in the first case, "+fmtInt(k.n11+k.n10)+" children with asthma in the second."+(key==="wheeze"?" For the questionnaire, P(B | A) is its <b>sensitivity</b> and P(A | B) its <b>positive predictive value</b>. A test can catch most cases and still be wrong about many of the children it flags.":" Switch event B to the questionnaire to see a case where confusing the two matters a great deal."));}
$("pairSel").addEventListener("change",drawEvents);drawEvents();

/* ---------- 2.3: diagnostic test ---------- */
const obs=(function(){let tp=0,fn=0,fp=0,tn=0;kids.forEach(c=>{if(c.asthma&&c.wheeze_q)tp++;else if(c.asthma)fn++;else if(c.wheeze_q)fp++;else tn++;});return {tp,fn,fp,tn,prev:(tp+fn)/N,se:tp/(tp+fn),sp:tn/(tn+fp)};})();
function drawDiag(){const p=+$("dPrev").value/100,se=+$("dSe").value/100,sp=+$("dSp").value/100;
  $("dPrevO").textContent=pct(p,0);$("dSeO").textContent=pct(se,0);$("dSpO").textContent=pct(sp,0);
  const D=Math.round(1000*p),TP=Math.round(D*se),FN=D-TP,H=1000-D,FP=Math.round(H*(1-sp)),TN=H-FP;
  const ppv=TP/(TP+FP||1),npv=TN/(TN+FN||1);
  const svg=clear($("icons")),cols=50,sz=10,gap=0.6;const kinds=[];for(let i=0;i<TP;i++)kinds.push(0);for(let i=0;i<FN;i++)kinds.push(1);for(let i=0;i<FP;i++)kinds.push(2);for(let i=0;i<TN;i++)kinds.push(3);
  kinds.forEach((k,i)=>{const x=10+(i%cols)*sz,y=8+Math.floor(i/cols)*(sz+4);el("rect",{x:x+gap,y:y,width:sz-2*gap,height:sz,rx:2,fill:k===0||k===1?css("--p2"):k===2?css("--p1"):css("--c-rule"),"fill-opacity":k===1?0.3:1},svg);});
  const tr=clear($("tree")),node=(x,y,t,s)=>{el("rect",{x:x-62,y:y-17,width:124,height:34,rx:8,fill:css("--c-panel"),stroke:css("--c-rule")},tr);txt(tr,x,y-2,t,{"text-anchor":"middle",style:"fill:"+css("--c-ink")+";font-weight:600"});txt(tr,x,y+12,s,{"text-anchor":"middle"});};
  const ln=(a,b,c,d)=>el("line",{x1:a,y1:b,x2:c,y2:d,stroke:css("--c-muted"),"stroke-width":1},tr);
  ln(260,40,130,100);ln(260,40,390,100);ln(130,118,65,190);ln(130,118,195,190);ln(390,118,325,190);ln(390,118,455,190);
  node(260,30,"1,000 children","");node(130,108,D+" with asthma","prevalence "+pct(p,0));node(390,108,H+" without","");
  node(65,200,TP+" test +","true positives");node(195,200,FN+" test −","missed");node(325,200,FP+" test +","false positives");node(455,200,TN+" test −","true negatives");
  txt(tr,260,244,"Positive results: "+TP+" + "+FP+" = "+(TP+FP)+", of whom "+TP+" have asthma",{"text-anchor":"middle",style:"fill:"+css("--c-ink")});
  $("dStats").innerHTML=[["PPV",pct(ppv)],["NPV",pct(npv)],["positives",String(TP+FP)],["false positives",String(FP)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("dNow","Out of 1,000 children, <b>"+D+"</b> have asthma and the test flags <b>"+TP+"</b> of them. Among the <b>"+H+"</b> without asthma, it wrongly flags <b>"+FP+"</b>. So of the "+(TP+FP)+" positive results, only "+TP+" are real: the <b>PPV is "+pct(ppv)+"</b>. "+(p<0.05?"Because asthma is rare here, false positives from the large healthy group swamp the true positives, even though the test itself is the same.":ppv<0.6?"Almost as many positives are false as true, because the healthy group is so much larger than the sick one.":"With a fairly common condition, most positives are real.")+" A negative result is reassuring: the NPV is "+pct(npv)+".");
  $("dReport").innerHTML="The questionnaire had a sensitivity of "+pct(se,0)+" and a specificity of "+pct(sp,0)+". At a prevalence of "+pct(p,0)+", <b>the positive predictive value was "+pct(ppv,0)+"</b> and the negative predictive value "+pct(npv,0)+".";}
["dPrev","dSe","dSp"].forEach(id=>$(id).addEventListener("input",drawDiag));
$("dCohort").addEventListener("click",()=>{$("dPrev").value=Math.round(100*obs.prev);$("dSe").value=Math.round(100*obs.se);$("dSp").value=Math.round(100*obs.sp);drawDiag();
  setNow("dNow",$("dNow").innerHTML.replace('<span class="hdr">What\'s happening</span>','')+"<br><br>These are the values observed in the cohort: "+obs.tp+" true positives, "+obs.fn+" missed cases, "+obs.fp+" false positives and "+obs.tn+" true negatives.");});
$("dRare").addEventListener("click",()=>{$("dPrev").value=1;$("dSe").value=90;$("dSp").value=90;drawDiag();});
drawDiag();

/* ---------- 2.4: likelihood ratios ---------- */
function drawLR(){const p=+$("lPre").value/100,se=+$("lSe").value/100,sp=+$("lSp").value/100;$("lPreO").textContent=pct(p,0);$("lSeO").textContent=pct(se,0);$("lSeO").textContent=pct(se,0);$("lSpO").textContent=pct(sp,0);
  const lrp=se/(1-sp),lrn=(1-se)/sp,o=p/(1-p),post=x=>x/(1+x),pp=post(o*lrp),pn=post(o*lrn);
  const svg=clear($("lrPlot")),F=frame(svg,520,280,{l:44,r:14,t:14,b:40},[0,1],[0,1]);
  yGrid(F,[0,0.25,0.5,0.75,1],v=>Math.round(100*v)+"%");xAxis(F,[0,0.25,0.5,0.75,1],"probability before the test",v=>Math.round(100*v)+"%");
  txt(svg,F.m.l,10,"probability after the test",{});
  const xs=[];for(let v=0.005;v<0.996;v+=0.005)xs.push(v);
  poly(F,xs,xs,{stroke:css("--c-lik"),"stroke-dasharray":"4 3","stroke-width":1.2});
  poly(F,xs,xs.map(v=>post(v/(1-v)*lrp)),{stroke:css("--p2"),"stroke-width":2.4});
  poly(F,xs,xs.map(v=>post(v/(1-v)*lrn)),{stroke:css("--p1"),"stroke-width":2.4});
  el("line",{x1:F.X(p),x2:F.X(p),y1:F.Y(pn),y2:F.Y(pp),stroke:css("--c-ink"),"stroke-dasharray":"2 3"},svg);
  [[pp,"--p2"],[pn,"--p1"]].forEach(a=>el("circle",{cx:F.X(p),cy:F.Y(a[0]),r:6,fill:css(a[1])},svg));
  $("lStats").innerHTML=[["LR+",fmt(lrp,1)],["LR−",fmt(lrn,2)],["after positive",pct(pp)],["after negative",pct(pn)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  setNow("lNow","Before the test, the probability of asthma is "+pct(p,0)+": odds of "+fmt(o,3)+". A positive result is <b>"+fmt(lrp,1)+" times</b> more likely in a child with asthma than in one without, so the odds are multiplied by "+fmt(lrp,1)+", to "+fmt(o*lrp,3)+": a probability of <b>"+pct(pp)+"</b>. A negative result multiplies the odds by "+fmt(lrn,2)+", lowering the probability to <b>"+pct(pn)+"</b>.<br><br>The same test moves different children by different amounts: where you end up depends on where you started. That is the essence of Bayesian updating.");
  $("lReport").innerHTML="The questionnaire had a positive likelihood ratio of <b>"+fmt(lrp,1)+"</b> and a negative likelihood ratio of "+fmt(lrn,2)+". For a child with a pre-test probability of "+pct(p,0)+", a positive result raised the probability of asthma to "+pct(pp,0)+".";}
["lPre","lSe","lSp"].forEach(id=>$(id).addEventListener("input",drawLR));drawLR();

/* ---------- quiz ---------- */
buildQuiz("quizzes",[
 {t:"stat",q:"In the cohort, P(asthma) = 14% and P(parent smokes) = 23%. If the two were independent, P(asthma and parent smokes) would be:",o:[["36%","That's the sum, which would count children with both twice; it isn't the joint probability.",0],["About 3%","Under independence, P(A ∩ B) = P(A) × P(B) = 0.14 × 0.23 ≈ 0.03.",1],["13%","That's P(asthma) alone.",0],["It can't be computed","Under independence it can: multiply the two probabilities.",0]]},
 {t:"epi",q:"Which conditional probability is the risk of asthma in children whose parents smoke?",o:[["P(parent smokes | asthma)","This is the share of asthma cases with a smoking parent, which is what a case-control study can estimate, but not a risk.",0],["P(asthma | parent smokes)","A risk is the probability of the outcome among people with a given exposure.",1],["P(asthma and parent smokes)","That joint probability depends on how common smoking is, not only on the risk.",0],["P(asthma) × P(parent smokes)","This is the joint probability under independence.",0]]},
 {t:"epi",q:"A screening test has 90% sensitivity and 90% specificity. In a population where 1% have the condition, roughly what share of positive results are true positives?",o:[["90%","That's the sensitivity, the share of cases detected, not the share of positives who are cases.",0],["About 50%","That would need a prevalence near 10%.",0],["About 8%","Of 1,000 people, 9 of 10 cases test positive, and so do 99 of 990 healthy people: 9 / 108 ≈ 8%.",1],["99%","The test is far from good enough for that at such low prevalence.",0]]},
 {t:"stat",q:"Which of these does not change when the same test is used in a population with higher prevalence?",o:[["The positive predictive value","PPV rises with prevalence.",0],["The negative predictive value","NPV falls as prevalence rises.",0],["The sensitivity","Sensitivity is conditional on having the condition, so (if the test works the same way) it doesn't depend on how common the condition is.",1],["The number of false positives per 1,000 tested","False positives come from the healthy group, which shrinks as prevalence rises.",0]]},
 {t:"stat",q:"A test has LR+ = 8.5. A child's pre-test probability of asthma is 13% (odds 0.15). After a positive result, the odds are:",o:[["0.15 + 8.5","Likelihood ratios multiply the odds; they don't add.",0],["About 1.27, a probability of about 56%","0.15 × 8.5 ≈ 1.27; probability = 1.27 / 2.27 ≈ 0.56.",1],["8.5, a probability of about 89%","That ignores the starting point. Updating depends on the pre-test odds.",0],["Unchanged, because LR is a ratio","A ratio above 1 increases the odds.",0]]},
 {t:"stat",q:"The risk ratio for asthma comparing boys with girls is close to 1.3. What does this say about the events \"boy\" and \"asthma\"?",o:[["They are independent","Independence would give a risk ratio of exactly 1, apart from chance.",0],["They are associated","P(asthma | boy) differs from P(asthma | girl), so the events are not independent.",1],["Being a boy causes asthma","Association alone doesn't establish causation.",0],["Nothing, because sex is binary","Binary variables can be associated with outcomes like any other.",0]]},
 {t:"epi",q:"A p-value is P(data at least this extreme | no effect). A common error is to read it as:",o:[["P(data | effect)","That's a different, but less common, confusion.",0],["P(no effect | data)","This reverses the conditional probability, the same error as reading sensitivity as PPV.",1],["The size of the effect","p-values don't measure effect size, but that's not a reversal of conditioning.",0],["P(effect) × P(data)","That isn't an interpretation anyone uses.",0]]}]);
onTheme(()=>{drawEvents();drawDiag();drawLR();});
});
