document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(), B=genB(), kids=B.children;
const ND=A.days.length, PYF=ND/365.25;

/* ---------- 1.1 variable types ---------- */
const VARS=[
 ["visits","Example A","12, 7, 31","count","Visits are whole numbers of events in a day. Counts can't be negative and their spread grows with their mean, which is why Lesson 8 models them with a Poisson or negative binomial distribution."],
 ["temp","Example A","−3.2, 18.7, 29.4","continuous","Temperature can take any value on a scale. Differences are meaningful (5°C warmer), so means and SDs make sense."],
 ["age_group","Example A","0-14, 15-64, 65+","ordinal","These are categories with a natural order but unequal widths. You can say 65+ is older than 15–64, but not that the gap between groups is the same."],
 ["district","Both","Old Town, Lakeside","nominal","District names are categories with no order. You summarize them with counts and proportions, and in models they become indicator (dummy) variables or random effects."],
 ["asthma","Example B","0, 1","binary","Asthma by age 8 is yes or no. Its mean is a proportion (the risk), and it is modeled with logistic regression in Lesson 8."],
 ["ses","Example B","−1.4, 0.2, 2.1","continuous","The socio-economic score is a continuous scale. It was constructed from several items, but it is analyzed as continuous."],
 ["wheeze_q","Example B","0, 1","binary","The questionnaire result is positive or negative. It is binary even though it's an imperfect measure of asthma, which matters in Lesson 13."],
 ["date","Example A","2023-07-14","date","Dates order observations in time. They are used to build day-of-week, season and trend terms, and observations close in time tend to be alike (Lesson 15)."]];
const TYPES=[["","choose…"],["binary","Binary"],["nominal","Nominal"],["ordinal","Ordinal"],["count","Count"],["continuous","Continuous"],["date","Date or time"]];
const vt=$("varTable");
VARS.forEach((v,i)=>{const tr=document.createElement("tr");
  tr.innerHTML="<td><code>"+v[0]+"</code><br><span class='small'>"+v[1]+"</span></td><td>"+v[2]+"</td><td><select id='vt"+i+"' aria-label='Type of "+v[0]+"'>"+TYPES.map(t=>"<option value='"+t[0]+"'>"+t[1]+"</option>").join("")+"</select></td><td><button type='button' id='vb"+i+"'>Check</button></td><td id='vf"+i+"' class='small'></td>";
  vt.appendChild(tr);
  $("vt"+i).addEventListener("change",()=>{$("vf"+i).textContent="";});
  $("vb"+i).addEventListener("click",()=>{const s=$("vt"+i).value,f=$("vf"+i);
    if(!s){f.innerHTML="<span style='color:var(--c-bad)'>Choose a type first.</span>";return;}
    const ok=s===v[3];f.innerHTML=(ok?"<b style='color:var(--c-ok)'>Correct.</b> ":"<b style='color:var(--c-bad)'>Not quite: it's "+TYPES.find(t=>t[0]===v[3])[1].toLowerCase()+".</b> ")+v[4];});});

/* ---------- 1.2 distributions ---------- */
const cityDaily=new Array(ND).fill(0);A.rows.forEach(r=>{cityDaily[r.t]+=r.visits;});
const lake65=A.rows.filter(r=>r.district==="Lakeside"&&r.g===2).map(r=>r.visits);
const SRC={city:{v:cityDaily,lab:"visits per day",unit:"",d:0},lake:{v:lake65,lab:"visits per day",unit:"",d:1},pm:{v:A.days.map(d=>d.pm25),lab:"µg/m³",unit:" µg/m³",d:1},
  temp:{v:A.days.map(d=>d.temp_city),lab:"°C",unit:"°C",d:1},no2:{v:kids.map(c=>c.no2_modeled),lab:"µg/m³",unit:" µg/m³",d:1}};
let sampSeed=1;
function currentData(){const s=SRC[$("hVar").value];let v=s.v;if($("hSample").value==="30"){const r=makeRng(1000+sampSeed);const out=[];for(let i=0;i<30;i++)out.push(v[Math.floor(r()*v.length)]);v=out;}return v;}
function skew(a){const m=mean(a),s=sd(a);return sum(a.map(x=>Math.pow((x-m)/s,3)))/a.length;}
function drawHist(){const key=$("hVar").value,s=SRC[key],base=currentData();const lo0=Math.min.apply(null,s.v),hi0=Math.max.apply(null,s.v);
  const ov=+$("hOut").value;let extra=null;if(ov>0){extra=hi0+(hi0-lo0)*ov/100*3;}
  $("hOutO").textContent=extra===null?"none":fmt(extra,s.d)+s.unit;
  const data=extra===null?base:base.concat([extra]);
  const lo=Math.min(lo0,Math.min.apply(null,data)),hi=Math.max.apply(null,data);
  const nb=$("hSample").value==="30"?15:40,w=(hi-lo)/nb||1,c=new Array(nb).fill(0);data.forEach(x=>{c[Math.min(nb-1,Math.floor((x-lo)/w))]++;});
  const svg=clear($("hist")),cm=Math.max.apply(null,c)*1.12;const F=frame(svg,520,260,{l:44,r:14,t:16,b:40},[lo,hi],[0,cm]);
  yGrid(F,niceTicks(0,cm,4));xAxis(F,niceTicks(lo,hi,6),s.lab);txt(svg,F.m.l,10,"number of "+(key==="no2"?"children":"days"),{});
  c.forEach((k,i)=>el("rect",{x:F.X(lo+i*w)+0.5,y:F.Y(k),width:Math.max(0.5,F.X(lo+(i+1)*w)-F.X(lo+i*w)-1),height:F.Y(0)-F.Y(k),fill:css("--c-lik"),"fill-opacity":0.55},svg));
  const m=mean(data),md=quantile(data,0.5),q1=quantile(data,0.25),q3=quantile(data,0.75),s2=sd(data),sk=skew(data);
  [[m,css("--p1")],[md,css("--p2")]].forEach(a=>el("line",{x1:F.X(a[0]),x2:F.X(a[0]),y1:F.m.t,y2:F.Y(0),stroke:a[1],"stroke-width":2.4},svg));
  if(extra!==null)el("circle",{cx:F.X(extra),cy:F.Y(0)-6,r:6,fill:css("--c-hl")},svg);
  $("hStats").innerHTML=[["n",fmtInt(data.length)],["mean",fmt(m,s.d)],["median",fmt(md,s.d)],["SD",fmt(s2,s.d)],["IQR",fmt(q1,s.d)+"–"+fmt(q3,s.d)],["skewness",fmt(sk,2)]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
  const shape=Math.abs(sk)<0.3?"roughly symmetric":sk>0?"right-skewed (a long tail of high values)":"left-skewed";
  let msg="This distribution is <b>"+shape+"</b>, with skewness "+fmt(sk,2)+". The mean is "+fmt(m,s.d)+" and the median "+fmt(md,s.d)+". ";
  msg+=Math.abs(sk)<0.3?"When the two are close like this, mean (SD) is a fair summary.":"The mean sits "+(m>md?"above":"below")+" the median because the tail pulls it, so median (IQR) describes a typical value better.";
  if(extra!==null){const m0=mean(base),s0=sd(base),md0=quantile(base,0.5),iqr0=quantile(base,0.75)-quantile(base,0.25);
    msg+="<br><br><b>Effect of the one extra value ("+fmt(extra,s.d)+").</b> The mean moved by "+fmt(m-m0,s.d)+" and the SD by "+fmt(s2-s0,s.d)+", while the median moved by "+fmt(md-md0,s.d)+" and the IQR by "+fmt((q3-q1)-iqr0,s.d)+"."+($("hSample").value==="all"?" With all "+fmtInt(base.length)+" values, one value barely matters. Switch to a sample of 30 and try again.":" With only 30 values, a single extreme one shifts the mean and SD noticeably.");}
  if(key==="lake")msg+="<br><br>Lakeside's older residents produce only a handful of visits per day, so the distribution is lumpy: counts can only be whole numbers.";
  if(key==="temp")msg+="<br><br>Temperature has two humps, winter and summer. No single summary describes a two-humped distribution well, so plot it.";
  setNow("hNow",msg);
  const rep={city:"The city's emergency departments had a mean of "+fmt(m,0)+" visits per day (SD "+fmt(s2,0)+").",lake:"Lakeside residents aged 65+ made a median of "+fmt(md,0)+" visits per day (IQR "+fmt(q1,0)+"–"+fmt(q3,0)+").",
    pm:"Daily PM2.5 had a median of "+fmt(md,1)+" µg/m³ (IQR "+fmt(q1,1)+"–"+fmt(q3,1)+").",temp:"Daily mean temperature ranged from "+fmt(Math.min.apply(null,data),1)+" to "+fmt(Math.max.apply(null,data),1)+"°C (median "+fmt(md,1)+"°C).",
    no2:"Children's modeled residential NO₂ had a median of "+fmt(md,1)+" µg/m³ (IQR "+fmt(q1,1)+"–"+fmt(q3,1)+")."};
  $("hReport").textContent=rep[key];}
["hVar","hSample","hOut"].forEach(id=>$(id).addEventListener("input",drawHist));
$("hResample").addEventListener("click",()=>{sampSeed++;if($("hSample").value!=="30")$("hSample").value="30";drawHist();});
drawHist();

/* ---------- 1.3 occurrence ---------- */
const cases=sum(kids.map(c=>c.asthma)),N=kids.length,risk=cases/N,odds=cases/(N-cases);
const totVisits=sum(A.rows.map(r=>r.visits)),totPop=sum(DISTRICTS.map(d=>d.pop)),py=totPop*PYF,rate=1000*totVisits/py;
$("occReport").innerHTML="Of "+fmtInt(N)+" children, "+fmtInt(cases)+" were diagnosed with asthma by age 8: a cumulative incidence of <b>"+fmt(100*risk,1)+"%</b> (odds "+fmt(odds,3)+").<br>The city recorded "+fmtInt(totVisits)+" emergency visits over "+fmtInt(py)+" person-years: <b>"+fmt(rate,0)+" visits per 1,000 person-years</b>.";
function drawRO(){const p=+$("rSl").value/100,o=p/(1-p);$("rSlO").textContent=fmt(100*p,0)+"%";
  const svg=clear($("riskOdds")),F=frame(svg,520,200,{l:44,r:14,t:16,b:40},[0,0.9],[0,Math.max(1.2,9)]);
  const xs=[],ys=[];for(let v=0.005;v<=0.9;v+=0.005){xs.push(v);ys.push(v/(1-v));}
  yGrid(F,[0,2,4,6,8]);xAxis(F,[0,0.2,0.4,0.6,0.8],"risk",t=>Math.round(100*t)+"%");txt(svg,F.m.l,10,"odds = risk / (1 − risk); gray line: odds equal to risk",{});
  poly(F,[0,0.9],[0,0.9],{stroke:css("--c-lik"),"stroke-dasharray":"4 3","stroke-width":1.2});
  poly(F,xs,ys,{stroke:css("--p1"),"stroke-width":2.4});
  el("circle",{cx:F.X(p),cy:F.Y(Math.min(9,o)),r:6,fill:css("--c-hl")},svg);
  setNow("roNow","A risk of <b>"+fmt(100*p,0)+"%</b> means odds of <b>"+fmt(o,3)+"</b>: for every child with the outcome there are "+fmt(1/o,1)+" without. "+(p<0.15?"For a fairly rare outcome like this, odds and risk are close.":p<0.3?"They are starting to drift apart.":"For a common outcome, the odds are far larger than the risk, so the two can't be used interchangeably.")+" Asthma in the cohort (about 14%) is close to the rare end.");}
$("rSl").addEventListener("input",drawRO);drawRO();
(function(){const rows=DISTRICTS.map(d=>{const v=sum(A.rows.filter(r=>r.district_id===d.id).map(r=>r.visits));return {d:d,r:1000*v/(d.pop*PYF)};}).sort((a,b)=>b.r-a.r);
  const svg=clear($("rateBars")),F=frame(svg,520,330,{l:100,r:44,t:10,b:30},[0,320],[0,12]);xAxis(F,[0,100,200,300],"visits per 1,000 person-years");
  rows.forEach((o,i)=>{const y=F.m.t+i*24;txt(svg,F.m.l-8,y+15,o.d.name,{"text-anchor":"end",style:"fill:"+css("--c-ink")});el("rect",{x:F.X(0),y:y+4,width:F.X(o.r)-F.X(0),height:16,fill:css("--p1"),"fill-opacity":0.75},svg);txt(svg,F.X(o.r)+5,y+16,fmt(o.r,0),{});});})();

/* ---------- 1.4 comparing groups ---------- */
function drawCmp(){const c=+$("cut").value;$("cutO").textContent=c+" µg/m³";
  const hi=kids.filter(k=>k.no2_modeled>=c),lo=kids.filter(k=>k.no2_modeled<c);
  const a=sum(hi.map(k=>k.asthma)),b=hi.length-a,cc=sum(lo.map(k=>k.asthma)),d=lo.length-cc;
  const r1=a/hi.length,r0=cc/lo.length,rd=r1-r0,rr=r1/r0,or=(a*d)/(b*cc);
  const se=Math.sqrt(1/a-1/hi.length+1/cc-1/lo.length),rl=Math.exp(Math.log(rr)-1.96*se),ru=Math.exp(Math.log(rr)+1.96*se);
  $("twoByTwo").innerHTML="<tr><th></th><th class='n'>Asthma</th><th class='n'>No asthma</th><th class='n'>Total</th><th class='n'>Risk</th></tr>"+
   "<tr><td>High NO₂ (≥ "+c+")</td><td class='n'>a = "+a+"</td><td class='n'>b = "+b+"</td><td class='n'>"+hi.length+"</td><td class='n'>"+fmt(100*r1,1)+"%</td></tr>"+
   "<tr><td>Lower NO₂ (&lt; "+c+")</td><td class='n'>c = "+cc+"</td><td class='n'>d = "+d+"</td><td class='n'>"+lo.length+"</td><td class='n'>"+fmt(100*r0,1)+"%</td></tr>";
  $("cmpStats").innerHTML=[["risk difference",(rd>=0?"+":"")+fmt(100*rd,1)+" per 100"],["risk ratio",fmt(rr,2)],["odds ratio",fmt(or,2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("cmpNow","With the cut-off at "+c+" µg/m³, "+fmtInt(hi.length)+" children count as highly exposed. Their risk is "+fmt(100*r1,1)+"% against "+fmt(100*r0,1)+"%: <b>"+fmt(Math.abs(100*rd),1)+" "+(rd>=0?"extra":"fewer")+" cases per 100 children</b>, a risk ratio of "+fmt(rr,2)+". The odds ratio, "+fmt(or,2)+", is slightly larger than the risk ratio, as it always is when the RR is above 1. Because asthma is fairly rare, the gap is small.<br><br>Move the cut-off and the numbers change, although the children and their exposures don't. Splitting a continuous exposure into two groups is a choice, and Lesson 11 shows how to avoid it. Remember too that this is a crude comparison: children in high-NO₂ districts also differ in socio-economic position (Lesson 9).");
  $("cmpReport").innerHTML="Children with modeled NO₂ of at least "+c+" µg/m³ had a "+fmt(100*r1,1)+"% risk of asthma by age 8, compared with "+fmt(100*r0,1)+"% in children with lower exposure (<b>RR "+fmt(rr,2)+", 95% CI "+fmt(rl,2)+" to "+fmt(ru,2)+"</b>; crude, unadjusted).";}
$("cut").addEventListener("input",drawCmp);drawCmp();
function drawOR(){const r0=+$("b0").value/100,r1=Math.min(0.999,1.5*r0),or=(r1/(1-r1))/(r0/(1-r0));$("b0O").textContent=fmt(100*r0,0)+"%";
  const svg=clear($("orRr")),F=frame(svg,520,220,{l:44,r:14,t:16,b:40},[0.01,0.5],[1,3.2]);yGrid(F,[1,1.5,2,2.5,3]);xAxis(F,[0.1,0.2,0.3,0.4,0.5],"risk in the unexposed",t=>Math.round(100*t)+"%");
  const xs=[],ys=[];for(let v=0.01;v<=0.5;v+=0.005){const a=Math.min(0.999,1.5*v);xs.push(v);ys.push((a/(1-a))/(v/(1-v)));}
  poly(F,[0.01,0.5],[1.5,1.5],{stroke:css("--p4"),"stroke-width":2.2});poly(F,xs,ys,{stroke:css("--p2"),"stroke-width":2.4});
  txt(svg,F.X(0.02),F.Y(1.5)-6,"risk ratio = 1.5",{style:"fill:"+css("--p4")});txt(svg,F.X(0.30)-10,F.Y(ys[Math.round((0.30-0.01)/0.005)])-10,"odds ratio",{style:"fill:"+css("--p2")});
  el("circle",{cx:F.X(r0),cy:F.Y(Math.min(3.2,or)),r:6,fill:css("--c-hl")},svg);
  setNow("orNow","With "+fmt(100*r0,0)+"% risk in the unexposed and "+fmt(100*r1,1)+"% in the exposed, the risk ratio is 1.5 but the <b>odds ratio is "+fmt(or,2)+"</b>. "+(r0<0.1?"For a rare outcome they nearly coincide, so the OR is a good stand-in for the RR.":"The more common the outcome, the more the OR exaggerates. Reporting it as \"times the risk\" would overstate the effect.")+"");}
$("b0").addEventListener("input",drawOR);drawOR();

/* ---------- 1.5 standardization ---------- */
const stdW=[0,1,2].map(g=>sum(DISTRICTS.map(d=>agePop(d,g)))),stdT=sum(stdW),W=stdW.map(v=>v/stdT);
const DR=DISTRICTS.map(d=>{const ar=[0,1,2].map(g=>{const v=sum(A.rows.filter(r=>r.district_id===d.id&&r.g===g).map(r=>r.visits));return {v:v,py:agePop(d,g)*PYF,r:1000*v/(agePop(d,g)*PYF)};});
  const crude=1000*sum(ar.map(a=>a.v))/sum(ar.map(a=>a.py));const asr=sum(ar.map((a,g)=>W[g]*a.r));return {d:d,ar:ar,crude:crude,asr:asr};});
const rankOf=key=>{const s=DR.slice().sort((a,b)=>b[key]-a[key]);const m={};s.forEach((o,i)=>m[o.d.id]=i+1);return m;};
const rC=rankOf("crude"),rS=rankOf("asr");let stdMode="crude";
function drawStd(){const key=stdMode,s=DR.slice().sort((a,b)=>b[key]-a[key]),svg=clear($("stdBars"));const F=frame(svg,520,360,{l:120,r:70,t:10,b:30},[0,320],[0,12]);xAxis(F,[0,100,200,300],key==="crude"?"crude visits per 1,000 person-years":"age-standardized visits per 1,000 person-years");
  const sel=+$("stdD").value;
  s.forEach((o,i)=>{const y=F.m.t+i*26.5,on=o.d.id===sel;txt(svg,14,y+15,String(i+1),{style:"fill:"+css("--c-muted")});txt(svg,F.m.l-8,y+15,o.d.name,{"text-anchor":"end",style:"fill:"+css("--c-ink")+(on?";font-weight:700":"")});
    el("rect",{x:F.X(0),y:y+4,width:F.X(o[key])-F.X(0),height:17,fill:key==="crude"?css("--c-lik"):css("--p4"),"fill-opacity":on?1:0.7},svg);txt(svg,F.X(o[key])+5,y+16,fmt(o[key],0),{});txt(svg,F.w-6,y+16,Math.round(100*o.d.p65)+"% 65+",{"text-anchor":"end"});});
  $("showCrude").setAttribute("aria-pressed",String(key==="crude"));$("showStd").setAttribute("aria-pressed",String(key==="asr"));}
function drawStdTable(){const id=+$("stdD").value,o=DR.find(x=>x.d.id===id);
  $("stdTable").innerHTML="<tr><th>Age group</th><th class='n'>Share in "+o.d.name+"</th><th class='n'>Share in city (standard)</th><th class='n'>Rate per 1,000 PY</th></tr>"+
   [0,1,2].map(g=>"<tr><td>"+AGE_GROUPS[g]+"</td><td class='n'>"+fmt(100*agePop(o.d,g)/o.d.pop,0)+"%</td><td class='n'>"+fmt(100*W[g],0)+"%</td><td class='n'>"+fmt(o.ar[g].r,0)+"</td></tr>").join("")+
   "<tr><td><b>Crude</b></td><td colspan='2' class='small'>weighted by "+o.d.name+"'s own ages</td><td class='n'><b>"+fmt(o.crude,0)+"</b></td></tr><tr><td><b>Standardized</b></td><td colspan='2' class='small'>weighted by the city's ages</td><td class='n'><b>"+fmt(o.asr,0)+"</b></td></tr>";
  const moved=rS[id]-rC[id];
  setNow("stdNow","<b>"+o.d.name+"</b> has "+fmt(100*o.d.p65,0)+"% of residents aged 65+, against "+fmt(100*W[2],0)+"% in the city as a whole. Its crude rate, "+fmt(o.crude,0)+", ranks "+rC[id]+" of 12. After standardization, the rate is "+fmt(o.asr,0)+" and it ranks <b>"+rS[id]+"</b>. "+(moved>0?"It drops "+moved+" place"+(moved>1?"s":"")+" because part of its high crude rate came from having many older residents, not from higher rates within each age group.":moved<0?"It rises "+(-moved)+" place"+(moved<-1?"s":"")+": its young population was hiding relatively high age-specific rates.":"Its rank doesn't change, because its age structure is close to the city's.")+" Try Lakeside, the oldest district, and Station, one of the youngest.");
  $("stdReport").innerHTML="The age-standardized emergency visit rate in "+o.d.name+" was <b>"+fmt(o.asr,0)+" per 1,000 person-years</b> (direct standardization to the city population, 2020–2024), compared with a crude rate of "+fmt(o.crude,0)+".";
  drawStd();}
$("stdD").innerHTML=DISTRICTS.map(d=>"<option value='"+d.id+"'"+(d.name==="Lakeside"?" selected":"")+">"+d.name+"</option>").join("");
$("stdD").addEventListener("change",drawStdTable);
$("showCrude").addEventListener("click",()=>{stdMode="crude";drawStd();});
$("showStd").addEventListener("click",()=>{stdMode="asr";drawStd();});
drawStdTable();

/* ---------- quiz ---------- */
const Q=[
 {t:"stat",q:"Daily PM2.5 is right-skewed. Which summary describes a typical day best?",o:[["Mean and standard deviation","The mean is pulled up by the few high-pollution days, and mean − 2 SD can even fall below zero.",0],["Median and interquartile range","The median is not affected by how extreme the tail is, and the IQR describes the middle half of days.",1],["Minimum and maximum","The range depends entirely on the two most extreme days, and it grows with the length of follow-up.",0],["Mode only","The mode gives one value but says nothing about spread.",0]]},
 {t:"epi",q:"In the cohort, 14% of children were diagnosed with asthma by age 8. What is this measure?",o:[["A prevalence","Prevalence counts existing cases at one point in time. Here we follow children from birth and count new diagnoses over a period.",0],["A cumulative incidence (risk)","It is the proportion of an initially disease-free group who develop the outcome over a stated period, here birth to age 8.",1],["An incidence rate","A rate has person-time in the denominator. This is a proportion of children.",0],["An odds","The odds would be cases divided by non-cases, about 0.15.",0]]},
 {t:"epi",q:"Why are emergency visits expressed per 1,000 person-years rather than per 1,000 residents?",o:[["Because person-years are easier to compute","They're usually harder to compute. The reason is about what the denominator represents.",0],["Because one person can make several visits, and the measure must reflect the time over which visits could occur","Visits are recurrent events over time, so the denominator is the total time at risk.",1],["Because rates are always larger than risks","The size of the number isn't the reason for choosing the measure.",0],["Because residents who move away must be excluded","Person-time handles people who move by counting only the time they lived there, rather than excluding them.",0]]},
 {t:"stat",q:"You add one extremely high value to a sample of 30. Which pair of summaries changes most?",o:[["Median and IQR","These depend on the order of values, not their size, so one extreme value barely moves them.",0],["Mean and standard deviation","Both use every value's size, so one extreme value pulls them strongly. Try it in section 1.2 with a sample of 30.",1],["Both pairs change equally","They react very differently, which is why the choice matters for skewed data.",0],["Neither changes","With only 30 values, one extreme value has a large effect on the mean and SD.",0]]},
 {t:"epi",q:"Lakeside has a higher crude visit rate than Greenmeadow, but a lower age-standardized rate. The most likely explanation is:",o:[["Lakeside has more air pollution","Pollution would affect age-specific rates and so would also show in the standardized comparison.",0],["Lakeside's population is older, and older people visit more often","Its crude rate is inflated by age structure. Standardization compares the districts as if they had the same ages.",1],["The standardized rate is less accurate","Both are accurate. They answer different questions.",0],["Greenmeadow's emergency department is busier","Rates are by place of residence, not by hospital, and the reversal points to a difference in age structure.",0]]},
 {t:"stat",q:"Baseline risk is 30% and the true risk ratio is 1.5. The odds ratio is:",o:[["Exactly 1.5","The OR equals the RR only in the limit of a very rare outcome.",0],["Smaller than 1.5","When the RR is above 1, the OR is further from 1 than the RR, not closer.",0],["Larger than 1.5 (about 1.9)","Risks of 45% vs 30% give odds of 0.82 vs 0.43, an OR of about 1.9. Common outcomes make the OR exaggerate.",1],["Impossible to tell without the sample size","The OR follows directly from the two risks. Sample size affects precision, not the value.",0]]},
 {t:"stat",q:"The variable age_group, with levels 0–14, 15–64 and 65+, is best described as:",o:[["Nominal","The groups have a natural order, so nominal loses information.",0],["Ordinal","The categories are ordered, but the gaps between them are unequal.",1],["Continuous","Age itself is continuous, but this grouped version only takes three values.",0],["Binary","There are three levels, not two.",0]]},
 {t:"epi",q:"Splitting children at 30 µg/m³ gives one risk ratio. Splitting at 25 µg/m³ gives a different one. What does this show?",o:[["One of the two calculations must be wrong","Both are correct. They compare different groups.",0],["The effect of NO₂ changes over time","Nothing about time has changed. Only the definition of the groups.",0],["A dichotomized exposure gives results that depend on an arbitrary cut-off","Continuous exposures are better modeled without cut-offs, as Lesson 11 shows.",1],["NO₂ has no real effect","A changing RR doesn't imply no effect. It reflects which children end up in each group.",0]]}];
buildQuiz("quizzes",Q);
onTheme(()=>{drawHist();drawRO();drawCmp();drawOR();drawStdTable();});
});
