document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children,ND=A.days.length,J=DISTRICTS.length;
const POLY=mapPolygons(500,320);
const PER={all:r=>true,y:r=>r.year===2023,m:r=>r.date.slice(0,7)==="2023-07",w:r=>r.date>="2023-07-01"&&r.date<="2023-07-07",d:r=>r.date==="2023-07-03"};
const PLAB={all:"2020–2024",y:"2023",m:"July 2023",w:"1–7 July 2023",d:"3 July 2023"};
function smr(per,age){const rows=A.rows.filter(r=>PER[per](r)&&(age==="all"||r.g===+age)),O=new Array(J).fill(0),PT=DISTRICTS.map(()=>[0,0,0]),Ok=[0,0,0],PTk=[0,0,0];
  rows.forEach(r=>{O[r.district_id-1]+=r.visits;PT[r.district_id-1][r.g]+=r.pop;Ok[r.g]+=r.visits;PTk[r.g]+=r.pop;});
  const rk=Ok.map((o,k)=>PTk[k]>0?o/PTk[k]:0),E=PT.map(p=>p.reduce((s,v,k)=>s+v*rk[k],0));return {O:O,E:E,S:O.map((o,j)=>o/E[j])};}
function drawMap(svgId,vals,fmtV,colorFn,title){const svg=clear($(svgId));txt(svg,10,10,title,{});
  DISTRICTS.forEach((d,k)=>{const p=POLY[k].map(q=>(q[0]+10).toFixed(1)+","+(q[1]+16).toFixed(1)).join(" "),c=colorFn(vals[k]);el("polygon",{points:p,fill:c[0],"fill-opacity":c[1],stroke:css("--c-panel"),"stroke-width":1.5},svg);
    const cx=POLY[k].reduce((s,q)=>s+q[0],0)/4+10,cy=POLY[k].reduce((s,q)=>s+q[1],0)/4+16;txt(svg,cx,cy-2,d.name,{"text-anchor":"middle",style:"fill:"+css("--c-ink")+";font-size:11px;font-weight:600"});txt(svg,cx,cy+12,fmtV(vals[k]),{"text-anchor":"middle",style:"fill:"+css("--c-ink")});});}
const divColor=(v,span)=>{const x=Math.max(-1,Math.min(1,Math.log(v)/Math.log(span)));return [css(x>=0?"--p2":"--p1"),(0.08+0.8*Math.abs(x)).toFixed(2)];};

/* ---------- 17.1 ---------- */
function drawM(){const per=$("mP").value,age=$("mA").value,s=smr(per,age);
  drawMap("mMap",s.S,v=>isFinite(v)?fmt(v,2):"–",v=>isFinite(v)&&v>0?divColor(v,2):[css("--p1"),0.9],"SMR, "+PLAB[per]+", "+(age==="all"?"all ages":"age "+AGE_GROUPS[+age])+" (orange above 1, blue below)");
  const svg=clear($("mFun")),Emax=Math.max.apply(null,s.E)*1.15,Emin=Math.min.apply(null,s.E)*0.6,smax=Math.max(2,Math.max.apply(null,s.S.filter(isFinite))*1.1);
  const F=frame(svg,520,280,{l:44,r:12,t:16,b:40},[Math.log(Math.max(0.5,Emin)),Math.log(Emax)],[0,Math.min(4,smax)]);
  yGrid(F,niceTicks(0,Math.min(4,smax),5),v=>fmt(v,1));const lt=niceTicks(Math.max(0.5,Emin),Emax,4).filter(v=>v>0);xAxis(F,lt.map(Math.log),"expected count (log scale)",v=>fmtInt(Math.exp(v)));
  txt(svg,F.m.l,10,"funnel plot: SMR against expected count, with 95% (dashed) and 99.8% (dotted) limits",{});
  const es=[];for(let e=Math.max(0.5,Emin);e<=Emax;e*=1.05)es.push(e);
  [[1.96,"4 3"],[3.09,"1 3"]].forEach(z=>{poly(F,es.map(Math.log),es.map(e=>Math.max(0,1+z[0]/Math.sqrt(e))),{stroke:css("--c-muted"),"stroke-dasharray":z[1]});poly(F,es.map(Math.log),es.map(e=>Math.max(0,1-z[0]/Math.sqrt(e))),{stroke:css("--c-muted"),"stroke-dasharray":z[1]});});
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(1),y2:F.Y(1),stroke:css("--c-ink")},svg);
  let out=0;DISTRICTS.forEach((d,k)=>{const o=Math.abs(s.S[k]-1)>1.96/Math.sqrt(s.E[k]);if(o)out++;el("circle",{cx:F.X(Math.log(s.E[k])),cy:F.Y(Math.min(4,s.S[k])),r:6,fill:css(o?"--p2":"--p1"),"fill-opacity":0.85},svg);txt(svg,F.X(Math.log(s.E[k]))+8,F.Y(Math.min(4,s.S[k]))+4,d.name,{});});
  const rng=[Math.min.apply(null,s.S),Math.max.apply(null,s.S)],small=s.E.indexOf(Math.min.apply(null,s.E));
  setNow("mNow","Over "+PLAB[per]+", the SMRs range from <b>"+fmt(rng[0],2)+" to "+fmt(rng[1],2)+"</b>, with expected counts between "+fmt(Math.min.apply(null,s.E),1)+" and "+fmt(Math.max.apply(null,s.E),1)+". "+(per==="all"?"With five years of data, expected counts are large, the funnel is narrow, and real differences between districts stand out.":"With short periods the expected counts are small, so chance alone produces large SMRs: "+DISTRICTS[small].name+", the district with the fewest expected visits, has an SMR of "+fmt(s.S[small],2)+".")+" "+out+" of 12 districts fall outside the 95% limits; about 0.6 would by chance alone if all districts had the same true risk.");
  $("mReport").innerHTML="Over "+PLAB[per]+", indirectly standardized SMRs for emergency visits ("+(age==="all"?"all ages":"age "+AGE_GROUPS[+age])+") ranged from <b>"+fmt(rng[0],2)+" to "+fmt(rng[1],2)+"</b> across the 12 districts; "+out+" lay outside the 95% funnel-plot limits.";}
["mP","mA"].forEach(id=>$(id).addEventListener("change",drawM));

/* ---------- 17.2 Moran's I ---------- */
const NB=NEIGHBORS.map(n=>n.map(id=>id-1));
function moran(x){const n=x.length,m=mean(x),dv=x.map(v=>v-m),den=sum(dv.map(v=>v*v));let num=0;NB.forEach((nb,i)=>nb.forEach(j=>{num+=dv[i]*dv[j]/nb.length;}));return n*num/(n*den);}
const s5=smr("all","all"),fRes=glmFit(DISTRICTS.map(d=>[1,d.dep]),s5.O,"poisson",{offset:s5.E.map(Math.log)}),res5=s5.O.map((o,j)=>o/fRes.mu[j]);
const rN=makeRng(1717),noise=DISTRICTS.map(()=>gaussFrom(rN));
const VARS={dep:{v:DISTRICTS.map(d=>d.dep),f:v=>fmt(v,2),lab:"deprivation"},traffic:{v:DISTRICTS.map(d=>d.traffic),f:v=>fmt(v,2),lab:"traffic"},smr:{v:s5.S,f:v=>fmt(v,2),lab:"SMR, five years"},res:{v:res5,f:v=>fmt(v,2),lab:"SMR adjusted for deprivation"},noise:{v:noise,f:v=>fmt(v,2),lab:"random noise"}};
function drawI(){const k=$("iV").value,V=VARS[k],x=V.v,lo=Math.min.apply(null,x),hi=Math.max.apply(null,x);
  drawMap("iMap",x,V.f,v=>[css("--p3"),(0.08+0.8*(v-lo)/(hi-lo||1)).toFixed(2)],V.lab+" (darker = higher)");
  const I=moran(x),r=makeRng(4242),perm=[];for(let s=0;s<999;s++){const p=x.slice();for(let i=p.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}perm.push(moran(p));}
  const pv=(1+perm.filter(v=>v>=I).length)/1000,svg=clear($("iPerm")),lo2=Math.min(-0.8,Math.min.apply(null,perm)),hi2=Math.max(0.8,I+0.05,Math.max.apply(null,perm)),nb=30,w=(hi2-lo2)/nb,c=new Array(nb).fill(0);perm.forEach(v=>c[Math.min(nb-1,Math.floor((v-lo2)/w))]++);
  const cm=Math.max.apply(null,c)*1.1,F=frame(svg,520,220,{l:44,r:12,t:16,b:40},[lo2,hi2],[0,cm]);xAxis(F,niceTicks(lo2,hi2,6),"Moran's I",v=>fmt(v,1));txt(svg,F.m.l,10,"Moran's I in 999 random shuffles of the values among districts",{});
  c.forEach((v,i)=>el("rect",{x:F.X(lo2+i*w)+0.5,y:F.Y(v),width:F.X(lo2+w)-F.X(lo2)-1,height:F.Y(0)-F.Y(v),fill:css("--c-lik"),"fill-opacity":0.6},svg));
  el("line",{x1:F.X(I),x2:F.X(I),y1:F.m.t,y2:F.Y(0),stroke:css("--p2"),"stroke-width":3},svg);txt(svg,F.X(I)+4,F.m.t+12,"observed",{style:"fill:"+css("--p2")});
  $("iStats").innerHTML=[["Moran's I",fmt(I,3)],["expected if no autocorrelation",fmt(-1/11,3)],["permutation p",pFmt(pv)]].map(q=>"<div><span>"+q[0]+"</span><b>"+q[1]+"</b></div>").join("");
  const msg=k==="noise"?"Random values assigned to districts should show no spatial pattern, and they don't.":k==="res"?"These are the SMRs after adjusting for deprivation. The simulation built in district effects that are correlated between neighbors, and once deprivation is accounted for, that spatial structure becomes visible.":"Here there is no clear spatial pattern: on a 4 × 3 grid, most districts touch most others (a central district has 8 of 11 as neighbors), so 'neighbor' and 'non-neighbor' comparisons differ little, and a negative I can arise from a few unlike neighbors.";
  setNow("iNow","Moran's I for "+V.lab+" is <b>"+fmt(I,2)+"</b>; under no autocorrelation it would be about "+fmt(-1/11,2)+". "+(pv<0.05?"Only "+fmt(100*pv,1)+"% of random shuffles give a value this large: neighbors are more alike than chance would make them.":"Random shuffles give values this large "+fmt(100*pv,0)+"% of the time: no evidence of spatial autocorrelation.")+" "+msg+" With only 12 districts, the test has little power; real studies have hundreds of areas, and the neighbor structure matters as much as the values.");}
$("iV").addEventListener("change",drawI);

/* ---------- 17.3 ecological ---------- */
const dist=DISTRICTS.map(d=>{const k=kids.filter(c=>c.district_id===d.id);return {d:d,n:k.length,cases:sum(k.map(c=>c.asthma)),no2:mean(k.map(c=>c.no2_modeled)),ses:mean(k.map(c=>c.ses))};});
function binomFit(X,cases,n){/* grouped binomial GLM by expanding to 0/1 rows */const Xr=[],yr=[];X.forEach((x,j)=>{for(let i=0;i<n[j];i++){Xr.push(x);yr.push(i<cases[j]?1:0);}});return glmFit(Xr,yr,"binomial");}
function drawE(){const adj=$("eAdj").checked,X=dist.map(q=>[1,q.no2/10].concat(adj?[q.ses]:[])),f=binomFit(X,dist.map(q=>q.cases),dist.map(q=>q.n));
  const ind=glmFit(kids.map(c=>[1,c.no2_modeled/10].concat(adj?[c.ses]:[])),kids.map(c=>c.asthma),"binomial"),indT=glmFit(kids.map(c=>[1,c.no2_true/10,c.ses,c.green]),kids.map(c=>c.asthma),"binomial");
  const svg=clear($("ePlot")),F=frame(svg,520,300,{l:44,r:12,t:16,b:40},[10,45],[0.05,0.25]);yGrid(F,[0.05,0.1,0.15,0.2,0.25],v=>Math.round(100*v)+"%");xAxis(F,[10,15,20,25,30,35,40,45],"district mean modeled NO₂ (µg/m³)");txt(svg,F.m.l,10,"asthma risk by district (circle size = children)",{});
  dist.forEach(q=>{el("circle",{cx:F.X(q.no2),cy:F.Y(q.cases/q.n),r:3+Math.sqrt(q.n)/3,fill:css("--p1"),"fill-opacity":0.5,stroke:css("--p1")},svg);txt(svg,F.X(q.no2)+6,F.Y(q.cases/q.n)-6,q.d.name,{});});
  const ms=mean(dist.map(q=>q.ses)),xs=[];for(let v=10;v<=45;v+=0.5)xs.push(v);poly(F,xs,xs.map(v=>1/(1+Math.exp(-(f.beta[0]+f.beta[1]*v/10+(adj?f.beta[2]*ms:0))))),{stroke:css("--p2"),"stroke-width":2.4});
  const ci=(b,se)=>fmt(Math.exp(b-1.96*se),2)+"–"+fmt(Math.exp(b+1.96*se),2);
  $("eStats").innerHTML=[["ecological OR per 10 µg/m³ (12 districts)",fmt(Math.exp(f.beta[1]),2)+" ("+ci(f.beta[1],f.se[1])+")"],["individual OR, same adjustment (5,000 children)",fmt(Math.exp(ind.beta[1]),2)+" ("+ci(ind.beta[1],ind.se[1])+")"],["true OR (simulation)",fmt(TRUTH_B.orPer10,2)]].map(q=>"<div><span>"+q[0]+"</span><b>"+q[1]+"</b></div>").join("");
  setNow("eNow","With only district averages, the association between NO₂ and asthma is estimated from 12 points: an ecological OR of <b>"+fmt(Math.exp(f.beta[1]),2)+"</b> per 10 µg/m³"+(adj?", adjusted for district mean SES":"")+". The individual-level analysis gives "+fmt(Math.exp(ind.beta[1]),2)+". "+(adj?"Adjusting for district SES changes the ecological estimate considerably: with so few areas, NO₂ and deprivation are almost inseparable at district level, and the interval is very wide.":"Districts with more traffic are also more deprived, so the ecological slope mixes the effects of NO₂ and of deprivation, which is ecological confounding. Tick the box to adjust for district mean SES.")+" Neither estimate can be read as the effect on an individual child without assumptions that ecological data can't check: that would be the <b>ecological fallacy</b>.");}
$("eAdj").addEventListener("change",drawE);

/* ---------- 17.4 empirical Bayes ---------- */
function drawS(){const per=$("sP").value,age=$("sA").value,s=smr(per,age),t=smr("all",age);
  const mu=sum(s.O)/sum(s.E),s2=Math.max(0,sum(s.E.map((e,j)=>e*(s.S[j]-mu)*(s.S[j]-mu)))/sum(s.E)-mu/mean(s.E)),w=s.E.map(e=>s2/(s2+mu/e)),eb=s.S.map((v,j)=>w[j]*v+(1-w[j])*mu);
  const rm=a=>Math.sqrt(mean(a.map((v,j)=>(v-t.S[j])*(v-t.S[j]))));
  const all=s.S.concat(eb,t.S),lo=Math.min(0.4,Math.min.apply(null,all)),hi=Math.max(1.6,Math.max.apply(null,all)),svg=clear($("sPlot")),F=frame(svg,520,320,{l:110,r:20,t:16,b:40},[lo,hi],[0,J+1]);
  xAxis(F,niceTicks(lo,hi,6),"SMR",v=>fmt(v,1));el("line",{x1:F.X(1),x2:F.X(1),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  txt(svg,F.m.l,10,"gray: raw, "+PLAB[per]+"; green: smoothed; black: five-year SMR",{});
  const ord=DISTRICTS.map((d,j)=>j).sort((a,b)=>s.E[a]-s.E[b]);
  ord.forEach((j,r)=>{const yy=F.Y(J-r);txt(svg,F.m.l-8,yy+4,DISTRICTS[j].name+" (E "+fmt(s.E[j],0)+")",{"text-anchor":"end",style:"fill:"+css("--c-ink")});
    el("line",{x1:F.X(Math.max(lo,Math.min(hi,s.S[j]))),x2:F.X(eb[j]),y1:yy,y2:yy,stroke:css("--p4"),"stroke-width":1.4},svg);
    el("circle",{cx:F.X(Math.max(lo,Math.min(hi,s.S[j]))),cy:yy,r:5,fill:css("--c-lik")},svg);el("circle",{cx:F.X(eb[j]),cy:yy,r:5,fill:css("--p4")},svg);
    el("line",{x1:F.X(t.S[j]),x2:F.X(t.S[j]),y1:yy-7,y2:yy+7,stroke:css("--c-ink"),"stroke-width":2.4},svg);});
  $("sStats").innerHTML=[["error of raw SMRs vs five-year",fmt(rm(s.S),3)],["error of smoothed SMRs",fmt(rm(eb),3)],["estimated SD of true relative risks",fmt(Math.sqrt(s2),3)],["weight on own data, smallest / largest district",fmt(Math.min.apply(null,w),2)+" / "+fmt(Math.max.apply(null,w),2)]].map(q=>"<div><span>"+q[0]+"</span><b>"+q[1]+"</b></div>").join("");
  setNow("sNow","Each raw SMR (gray) is pulled toward the city-wide value by an amount that depends on its expected count: districts are sorted from fewest expected visits (top) to most. The smallest districts keep only "+fmt(100*Math.min.apply(null,w),0)+"% of their own estimate; the largest keep "+fmt(100*Math.max.apply(null,w),0)+"%. Judged against the five-year SMRs (black ticks), the smoothed values are <b>"+(rm(eb)<rm(s.S)?"more accurate":"no more accurate")+"</b>: root mean squared error "+fmt(rm(eb),3)+" instead of "+fmt(rm(s.S),3)+". "+(s2===0?"Here the moment estimator puts the between-district variance at zero, so every district is pulled all the way to the city mean"+(rm(eb)>rm(s.S)?". That over-shrinks: the districts do differ, and the smoothed map is slightly worse than the raw one. It is a known weakness of simple estimators with few areas; a Bayesian model with a prior on the variance (Lesson 25) avoids it.":"."):"Shrinkage trades a little bias for a large reduction in noise."));
  $("sReport").innerHTML="Empirical Bayes smoothed SMRs for "+PLAB[per]+" ranged from <b>"+fmt(Math.min.apply(null,eb),2)+" to "+fmt(Math.max.apply(null,eb),2)+"</b> (raw: "+fmt(Math.min.apply(null,s.S),2)+" to "+fmt(Math.max.apply(null,s.S),2)+"), using a Poisson–gamma model with moment estimates of the between-district variance.";}
["sP","sA"].forEach(id=>$(id).addEventListener("change",drawS));

setTimeout(()=>{drawM();drawI();drawE();drawS();},10);
buildQuiz("quizzes",[
 {t:"epi",q:"On a map of one week's SMRs, the two most extreme districts are the two smallest. The most likely explanation is:",o:[["Small districts have the most unusual populations","Possible, but the pattern is expected from chance alone.",0],["Small expected counts make SMRs highly variable, so extreme values arise by chance","The SE of an SMR is about √O / E: large when E is small.",1],["The standardization was wrong","Standardization adjusts for age; it doesn't remove sampling variation.",0],["Large districts are under-reported","Nothing suggests that.",0]]},
 {t:"stat",q:"A funnel plot shows:",o:[["Each area's SMR against its expected count, with limits for chance variation that narrow as the expected count grows","It puts each area's value in the context of its precision.",1],["A histogram of SMRs","A funnel plot is a scatter plot with control limits.",0],["The trend over time","It's a cross-sectional display.",0],["Publication bias","That's a different kind of funnel plot, used in meta-analysis.",0]]},
 {t:"stat",q:"Moran's I of 0.45 with a permutation p of 0.01 means:",o:[["45% of the variation is spatial","Moran's I isn't a proportion of variance.",0],["Neighboring districts are more similar than expected under random arrangement","Positive spatial autocorrelation, unlikely to be due to chance.",1],["The variable is normally distributed","Moran's I says nothing about the distribution.",0],["Neighbors are dissimilar","That would give a negative I.",0]]},
 {t:"epi",q:"An ecological study finds that districts with higher mean NO₂ have higher asthma rates. Concluding that each child's risk increases with their own NO₂ is:",o:[["Correct, since areas consist of individuals","Area-level associations need not hold for individuals.",0],["The ecological fallacy: the area-level association may be confounded or distorted by aggregation","Individual-level data, or strong assumptions, are needed for individual-level claims.",1],["Simpson's paradox","Related, but the term here is the ecological fallacy.",0],["Valid if the study has many areas","More areas help precision, but don't remove ecological bias.",0]]},
 {t:"stat",q:"In empirical Bayes smoothing, which districts' SMRs are pulled most toward the overall mean?",o:[["Those with the largest SMRs","Shrinkage depends on precision, not on the value itself.",0],["Those with the smallest expected counts","Imprecise estimates get the least weight on their own data.",1],["Those in the city center","Global EB shrinkage ignores location.",0],["All districts equally","Weights differ by precision.",0]]},
 {t:"stat",q:"Why do smoothed SMRs tend to be more accurate than raw ones, even though they are biased toward the mean?",o:[["Because they use more data from each district","They use the same data, plus information from other districts.",0],["Because the reduction in variance outweighs the small bias introduced","The bias–variance trade-off, as with Stein's paradox.",1],["Because raw SMRs are computed incorrectly","Raw SMRs are unbiased, just noisy.",0],["They aren't; smoothing always loses accuracy","Simulations and theory show the opposite for many noisy estimates.",0]]}]);
onTheme(()=>{drawM();drawI();drawE();drawS();});
});
