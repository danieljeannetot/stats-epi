document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(), B=genB(), kids=B.children, ND=A.days.length;
let selD=6;
const LAB={pop:["Population",v=>fmtInt(v)],p65:["Share aged 65+",v=>Math.round(100*v)+"%"],dep:["Deprivation (0–1)",v=>fmt(v,2)],green:["Green space (0–1)",v=>fmt(v,2)],traffic:["Traffic (0–1)",v=>fmt(v,2)],uhi:["Summer heat island",v=>"+"+fmt(v,1)+"°C"]};
function drawMap(){const key=$("mapVar").value,svg=clear($("map")),polys=mapPolygons(500,320),vals=DISTRICTS.map(d=>d[key]),lo=Math.min.apply(null,vals),hi=Math.max.apply(null,vals);
  const col=css("--p1");
  DISTRICTS.forEach((d,k)=>{const p=polys[k].map(q=>(q[0]+10).toFixed(1)+","+(q[1]+10).toFixed(1)).join(" ");const v=(d[key]-lo)/(hi-lo||1);
    const g=el("g",{style:"cursor:pointer",tabindex:"0",role:"button","aria-label":d.name},svg);
    el("polygon",{points:p,fill:col,"fill-opacity":(0.12+0.78*v).toFixed(2),stroke:d.id===selD?css("--c-ink"):css("--c-panel"),"stroke-width":d.id===selD?3:1.5},g);
    const cx=polys[k].reduce((s,q)=>s+q[0],0)/4+10,cy=polys[k].reduce((s,q)=>s+q[1],0)/4+10;
    txt(g,cx,cy-2,d.name,{"text-anchor":"middle",style:"fill:"+(v>0.55?css("--c-panel"):css("--c-ink"))+";font-size:12px;font-weight:600"});
    txt(g,cx,cy+13,LAB[key][1](d[key]),{"text-anchor":"middle",style:"fill:"+(v>0.55?css("--c-panel"):css("--c-ink"))});
    const pick=()=>{selD=d.id;drawMap();info();};g.addEventListener("click",pick);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick();}});});
  $("mapLegend").innerHTML="<span>Lighter = lower "+LAB[key][0].toLowerCase()+", darker = higher. Range: "+LAB[key][1](lo)+" to "+LAB[key][1](hi)+".</span>";}
function info(){const d=DISTRICTS.find(x=>x.id===selD);$("dName").textContent=d.name;
  const kd=kids.filter(c=>c.district_id===d.id),vis=sum(A.rows.filter(r=>r.district_id===d.id).map(r=>r.visits));
  $("dTable").innerHTML=Object.keys(LAB).map(k=>"<tr><td>"+LAB[k][0]+"</td><td class='n'>"+LAB[k][1](d[k])+"</td></tr>").join("")+"<tr><td>Neighbors</td><td class='n'>"+NEIGHBORS[d.id-1].map(id=>DISTRICTS[id-1].name).join(", ")+"</td></tr><tr><td>Emergency visits, 2020–2024</td><td class='n'>"+fmtInt(vis)+"</td></tr><tr><td>Children in the cohort</td><td class='n'>"+fmtInt(kd.length)+"</td></tr>";
  const rank=key=>DISTRICTS.slice().sort((a,b)=>b[key]-a[key]).findIndex(x=>x.id===d.id)+1;
  setNow("mapNow","<b>"+d.name+"</b> ranks "+rank("pop")+" of 12 by population, "+rank("traffic")+" by traffic and "+rank("dep")+" by deprivation. "+(d.traffic>0.6?"Its heavy traffic means high NO₂ for children living here (Example B).":"Its traffic is moderate to light, so children's NO₂ exposure is lower.")+" "+(d.uhi>0.8?"In summer it runs "+fmt(d.uhi,1)+"°C hotter than the city average, which matters for heat effects (Example A).":"Its summer heat island is small.")+" "+(d.p65>0.22?"With "+Math.round(100*d.p65)+"% of residents aged 65+, its crude visit rate will look high: Lesson 1 shows why.":""));}
$("mapVar").addEventListener("change",drawMap);drawMap();info();

/* time series explorer */
$("aD").innerHTML=DISTRICTS.map(d=>"<option value='"+d.id+"'"+(d.id===6?" selected":"")+">"+d.name+"</option>").join("");
function drawTS(){const id=+$("aD").value,g=$("aG").value,yr=+$("aY").value;const days=A.days.filter(d=>d.year===yr),t0=days[0].t,n=days.length;
  const v=new Array(n).fill(0);A.rows.forEach(r=>{if(r.district_id===id&&r.year===yr&&(g==="all"||r.g===+g))v[r.t-t0]+=r.visits;});
  const temp=A.tempD[id-1].slice(t0,t0+n);
  let svg=clear($("tsTemp")),F=frame(svg,1000,170,{l:50,r:14,t:18,b:26},[1,n],[Math.floor(Math.min.apply(null,temp)/5)*5,Math.ceil(Math.max.apply(null,temp)/5)*5]);
  yGrid(F,niceTicks(F.yr[0],F.yr[1],4),t=>t+"°");const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],mt=[];days.forEach((d,i)=>{if(d.date.slice(8)==="01")mt.push(i+1);});
  xAxis(F,mt,null,t=>months[+days[t-1].date.slice(5,7)-1]);txt(svg,F.m.l,12,"daily mean temperature in "+DISTRICTS[id-1].name+", "+yr,{});
  poly(F,days.map((_,i)=>i+1),temp,{stroke:css("--p2"),"stroke-width":1.4});
  svg=clear($("tsVis"));const vmax=Math.max.apply(null,v)*1.08;F=frame(svg,1000,230,{l:50,r:14,t:18,b:26},[1,n],[0,vmax]);
  yGrid(F,niceTicks(0,vmax,5));xAxis(F,mt,null,t=>months[+days[t-1].date.slice(5,7)-1]);
  txt(svg,F.m.l,12,"emergency visits per day ("+(g==="all"?"all ages":AGE_GROUPS[+g])+")",{});
  const w7=v.map((_,i)=>{const s=v.slice(Math.max(0,i-3),Math.min(n,i+4));return mean(s);});
  poly(F,days.map((_,i)=>i+1),v,{stroke:css("--c-lik"),"stroke-width":1,"stroke-opacity":0.7});poly(F,days.map((_,i)=>i+1),w7,{stroke:css("--p1"),"stroke-width":2.4});
  const hot=temp.map((T,i)=>[T,i]).sort((a,b)=>b[0]-a[0]).slice(0,10).map(x=>x[1]),cold=temp.map((T,i)=>[T,i]).sort((a,b)=>a[0]-b[0]).slice(0,10).map(x=>x[1]),mild=temp.map((T,i)=>[Math.abs(T-19),i]).sort((a,b)=>a[0]-b[0]).slice(0,30).map(x=>x[1]);
  const mh=mean(hot.map(i=>v[i])),mc=mean(cold.map(i=>v[i])),mm=mean(mild.map(i=>v[i]));
  const dowm=[0,1,2,3,4,5,6].map(k=>mean(days.map((d,i)=>[d,i]).filter(x=>x[0].dow===k).map(x=>v[x[1]])));
  setNow("tsNow","The gray line is each day's count and the blue line a 7-day average. On the 10 hottest days of "+yr+", "+DISTRICTS[id-1].name+" averaged <b>"+fmt(mh,1)+"</b> visits, on the 10 coldest <b>"+fmt(mc,1)+"</b>, and on mild days near 19°C <b>"+fmt(mm,1)+"</b>. "+(mh>mm&&mc>mm?"Both extremes are busier than mild days: a first sign of the U-shaped temperature effect you'll model in Lesson 16.":"The pattern is noisy at this level; try all ages or a larger district.")+" The day-to-day zigzag is the weekly cycle: Mondays average "+fmt(dowm[1],1)+" and Sundays "+fmt(dowm[0],1)+"."+(g==="2"?" Visits by older residents rise most on hot days.":""));}
["aD","aG","aY"].forEach(id=>$(id).addEventListener("change",drawTS));drawTS();

/* cohort summary */
const risk=mean(kids.map(c=>c.asthma));
$("bStats").innerHTML=[["children",fmtInt(kids.length)],["schools",String(B.schools.length)],["asthma by age 8",fmt(100*risk,1)+"%"],["median modeled NO₂",fmt(quantile(kids.map(c=>c.no2_modeled),0.5),1)+" µg/m³"],["validation subsample",fmtInt(kids.filter(c=>c.validation).length)],["questionnaire positive",fmt(100*mean(kids.map(c=>c.wheeze_q)),1)+"%"]].map(a=>"<div><span>"+a[0]+"</span><b>"+a[1]+"</b></div>").join("");
const rows=DISTRICTS.map(d=>{const k=kids.filter(c=>c.district_id===d.id);return {d:d,n:k.length,r:mean(k.map(c=>c.asthma)),no2:mean(k.map(c=>c.no2_modeled)),ses:mean(k.map(c=>c.ses))};}).sort((a,b)=>b.no2-a.no2);
$("bTable").innerHTML="<tr><th>District</th><th class='n'>Children</th><th class='n'>Mean modeled NO₂ (µg/m³)</th><th class='n'>Mean SES score</th><th class='n'>Asthma by age 8</th></tr>"+rows.map(o=>"<tr><td>"+o.d.name+"</td><td class='n'>"+o.n+"</td><td class='n'>"+fmt(o.no2,1)+"</td><td class='n'>"+(o.ses>=0?"+":"")+fmt(o.ses,2)+"</td><td class='n'>"+fmt(100*o.r,1)+"%</td></tr>").join("");

/* quiz */
const Q=[
 {t:"stat",q:"Why does the course use simulated rather than real data?",o:[["Real data are never good enough for teaching","Real data are excellent for teaching, but they can't tell you whether a method got the right answer.",0],["Because the true values are known, so you can see whether each method recovers them","This is the key advantage: every estimate can be compared with the truth that generated the data.",1],["To avoid having to clean the data","Avoiding data cleaning is a side benefit, not the reason.",0],["Because simulated data have no random variation","They do have random variation, deliberately, just like real data.",0]]},
 {t:"epi",q:"In Example B, which variable could a real study never observe?",o:[["no2_modeled","Modeled NO₂ is what real studies use, from land-use regression.",0],["no2_personal","Personal monitoring is possible, in a subsample, which is exactly what validation studies do.",0],["no2_true","A child's true long-term exposure is never directly observed. We have it only because we simulated it, and Lesson 13 uses it to show what exposure error does.",1],["wheeze_q","Questionnaires are routinely collected.",0]]},
 {t:"stat",q:"In the three-way notation, which form is the one you would type into software?",o:[["A, standard notation","Standard notation is for reading papers and textbooks.",0],["B, model list and R","The model list maps line by line to R (and later Stan) code.",1],["C, epidemiological reporting","Reporting is how results are communicated, after the model has been fitted.",0],["All three equally","They describe the same model, but only one is written for software.",0]]}];
buildQuiz("quizzes",Q);
onTheme(()=>{drawMap();drawTS();});
});
