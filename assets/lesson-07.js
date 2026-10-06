document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA(),kids=genB().children;
const traf=c=>DISTRICTS[c.district_id-1].traffic;
const qt=v=>v<0.001?"<0.001":fmt(v,3);
const pz=(b,se)=>2*(1-pnormStd(Math.abs(b/se)));

/* ---------- 7.1 ---------- */
let seed=3,S=[],best=null;
function newS(){const r=makeRng(700+seed);S=[];for(let i=0;i<60;i++)S.push(kids[Math.floor(r()*kids.length)]);best=lmFit(S.map(c=>[1,c.green]),S.map(c=>c.no2_modeled));}
function drawLS(){const a=+$("a0").value,b=+$("b1").value;$("a0O").textContent=fmt(a,1);$("b1O").textContent=fmt(b,1);
  const svg=clear($("ls")),F=frame(svg,520,320,{l:44,r:14,t:16,b:40},[0,1],[0,70]);yGrid(F,[0,20,40,60]);xAxis(F,[0,0.2,0.4,0.6,0.8,1],"green space around the home (0–1)",v=>fmt(v,1));
  txt(svg,F.m.l,10,"modeled NO₂ (µg/m³), 60 children",{});
  let ssr=0;S.forEach(c=>{const f=a+b*c.green,r=c.no2_modeled-f;ssr+=r*r;
    if($("lsSq").checked){const s=Math.abs(F.Y(c.no2_modeled)-F.Y(f));el("rect",{x:F.X(c.green),y:Math.min(F.Y(c.no2_modeled),F.Y(f)),width:Math.min(s,F.w-F.m.r-F.X(c.green)),height:s,fill:css("--p2"),"fill-opacity":0.07,stroke:css("--p2"),"stroke-opacity":0.25},svg);}
    el("line",{x1:F.X(c.green),x2:F.X(c.green),y1:F.Y(c.no2_modeled),y2:F.Y(f),stroke:css("--p2"),"stroke-width":1},svg);});
  S.forEach(c=>el("circle",{cx:F.X(c.green),cy:F.Y(Math.min(70,c.no2_modeled)),r:3.4,fill:css("--c-lik")},svg));
  poly(F,[0,1],[a,a+b],{stroke:css("--p1"),"stroke-width":2.6});
  const ssrB=best.rss;
  $("lsStats").innerHTML=[["your sum of squares",fmtInt(ssr)],["least-squares minimum",fmtInt(ssrB)],["least-squares intercept",fmt(best.beta[0],1)],["least-squares slope",fmt(best.beta[1],1)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const ratio=ssr/ssrB;
  setNow("lsNow","Each orange line is a residual: a child's NO₂ minus the value your line predicts for them. Squaring and adding them gives <b>"+fmtInt(ssr)+"</b>. The smallest possible total, achieved by the least-squares line, is "+fmtInt(ssrB)+". "+(ratio<1.01?"Your line is essentially the least-squares line.":"Yours is "+fmt(ratio,2)+" times larger. "+(b>best.beta[1]?"Try a steeper negative slope.":"Try a shallower slope."))+" Squaring means large misses count heavily, which is why a single extreme child can pull the line (Lesson 10).");
  $("lsReport").innerHTML="In this sample of 60 children, NO₂ was <b>"+fmt(Math.abs(best.beta[1])/10,1)+" µg/m³ "+(best.beta[1]<0?"lower":"higher")+" per 0.1 increase in green space</b> (least-squares slope "+fmt(best.beta[1],1)+" per unit; intercept "+fmt(best.beta[0],1)+" µg/m³).";}
["a0","b1"].forEach(id=>$(id).addEventListener("input",drawLS));$("lsSq").addEventListener("change",drawLS);
$("lsFit").addEventListener("click",()=>{$("a0").value=Math.max(10,Math.min(70,best.beta[0])).toFixed(1);$("b1").value=Math.max(-70,Math.min(20,best.beta[1])).toFixed(1);drawLS();});
$("lsNew").addEventListener("click",()=>{seed++;newS();drawLS();});newS();drawLS();

/* ---------- 7.2 ---------- */
const y=kids.map(c=>c.no2_modeled);
function drawM(){const use={ses:$("mSes").checked,traf:$("mTraf").checked,boy:$("mBoy").checked};
  const names=["intercept","green space"].concat(use.ses?["SES score"]:[]).concat(use.traf?["district traffic"]:[]).concat(use.boy?["boy"]:[]);
  const X=kids.map(c=>[1,c.green].concat(use.ses?[c.ses]:[]).concat(use.traf?[traf(c)]:[]).concat(use.boy?[c.sex==="boy"?1:0]:[]));
  const f=lmFit(X,y),z=1.96;
  $("mTab").innerHTML="<tr><th>Term</th><th class='n'>Estimate</th><th class='n'>SE</th><th class='n'>95% CI</th><th class='n'>p</th></tr>"+names.map((nm,i)=>"<tr><td>"+nm+"</td><td class='n'>"+fmt(f.beta[i],2)+"</td><td class='n'>"+fmt(f.se[i],2)+"</td><td class='n'>"+fmt(f.beta[i]-z*f.se[i],2)+" to "+fmt(f.beta[i]+z*f.se[i],2)+"</td><td class='n'>"+qt(pz(f.beta[i],f.se[i]))+"</td></tr>").join("");
  const crude=lmFit(kids.map(c=>[1,c.green]),y).beta[1],g=f.beta[1];
  $("mStats").innerHTML=[["green coefficient",fmt(g,1)],["without adjustment",fmt(crude,1)],["R²",fmt(f.r2,3)],["residual SD",fmt(f.sigma,1)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg="With "+(names.length>2?names.slice(2).join(", "):"no other predictors")+" in the model, NO₂ is <b>"+fmt(Math.abs(g)/10,2)+" µg/m³ lower per 0.1 more green space</b>"+(names.length>2?", comparing children with the same values of the other predictors":"")+". ";
  if(use.traf)msg+="Adding district traffic changed the green coefficient from "+fmt(crude,1)+" to "+fmt(g,1)+", because green districts tend to have less traffic: part of the crude association was a traffic difference. The model now explains "+fmt(100*f.r2,0)+"% of the variation in NO₂. ";
  else msg+="R² = "+fmt(f.r2,2)+": green space alone explains "+fmt(100*f.r2,0)+"% of the variation. Add district traffic and see what happens. ";
  if(use.boy)msg+="Sex has essentially no association with NO₂, as expected: adding it changes nothing.";
  if(use.ses&&!use.traf)msg+="SES is associated with both green space and NO₂, so adding it moves the green coefficient a little.";
  setNow("mNow",msg);
  $("mReport").innerHTML="Each 0.1 increase in residential green space was associated with <b>"+fmt(Math.abs(g)/10,1)+" µg/m³ "+(g<0?"lower":"higher")+" modeled NO₂ (95% CI "+fmt(Math.abs(f.beta[1]+z*f.se[1])/10,2)+" to "+fmt(Math.abs(f.beta[1]-z*f.se[1])/10,2)+")</b>"+(names.length>2?", adjusted for "+names.slice(2).join(", "):"")+".";}
["mSes","mTraf","mBoy"].forEach(id=>$(id).addEventListener("change",drawM));drawM();

/* ---------- 7.3 ---------- */
const city=new Array(A.days.length).fill(0);A.rows.forEach(r=>city[r.t]+=r.visits);
function skew(a){const m=mean(a),s=sd(a);return sum(a.map(x=>Math.pow((x-m)/s,3)))/a.length;}
function drawR(){const m=$("rM").value;let fitted,res,xlab;
  if(m==="good"){const f=lmFit(kids.map(c=>[1,c.green,c.ses,traf(c)]),y);fitted=f.fitted;res=f.resid;xlab="fitted NO₂ (µg/m³)";}
  else if(m==="curve"){const T=A.days.map(d=>d.temp_city),f=lmFit(T.map(t=>[1,t]),city);fitted=f.fitted;res=f.resid;xlab="fitted daily visits";}
  else{const r=makeRng(99),rows=[];for(let i=0;i<1500;i++)rows.push(A.rows[Math.floor(r()*A.rows.length)]);const f=lmFit(rows.map(q=>[1,q.pop/1000]),rows.map(q=>q.visits));fitted=f.fitted;res=f.resid;xlab="fitted visits per district–age group per day";}
  const idx=[];const r=makeRng(5);for(let i=0;i<Math.min(fitted.length,1200);i++)idx.push(fitted.length>1200?Math.floor(r()*fitted.length):i);
  const fx=idx.map(i=>fitted[i]),rx=idx.map(i=>res[i]),lo=Math.min.apply(null,fx),hi=Math.max.apply(null,fx),rm=Math.max.apply(null,rx.map(Math.abs))*1.05;
  let svg=clear($("rPlot")),F=frame(svg,520,260,{l:50,r:14,t:16,b:40},[lo,hi],[-rm,rm]);yGrid(F,niceTicks(-rm,rm,4),v=>fmt(v,0));xAxis(F,niceTicks(lo,hi,5),xlab,v=>fmt(v,0));
  txt(svg,F.m.l,10,"residual against fitted value",{});fx.forEach((x,i)=>el("circle",{cx:F.X(x),cy:F.Y(rx[i]),r:1.8,fill:css("--c-lik"),"fill-opacity":0.5},svg));
  el("line",{x1:F.m.l,x2:F.w-F.m.r,y1:F.Y(0),y2:F.Y(0),stroke:css("--p2"),"stroke-width":1.4},svg);
  const nb=10,bw=(hi-lo)/nb,bm=[],bs=[];for(let k=0;k<nb;k++){const sel=rx.filter((v,i)=>fx[i]>=lo+k*bw&&fx[i]<lo+(k+1)*bw);bm.push(sel.length>5?mean(sel):NaN);bs.push(sel.length>5?sd(sel):NaN);}
  const pts=bm.map((v,k)=>isNaN(v)?null:[lo+(k+0.5)*bw,v]).filter(Boolean);poly(F,pts.map(q=>q[0]),pts.map(q=>q[1]),{stroke:css("--p1"),"stroke-width":2.4});
  svg=clear($("rHist"));const nbh=40,h=new Array(nbh).fill(0);res.forEach(v=>{const i=Math.floor((v+rm)/(2*rm)*nbh);if(i>=0&&i<nbh)h[i]++;});const hm=Math.max.apply(null,h)*1.1;
  F=frame(svg,520,160,{l:50,r:14,t:16,b:30},[-rm,rm],[0,hm]);xAxis(F,niceTicks(-rm,rm,6),null,v=>fmt(v,0));txt(svg,F.m.l,10,"distribution of residuals",{});
  h.forEach((k,i)=>el("rect",{x:F.X(-rm+i*2*rm/nbh)+0.5,y:F.Y(k),width:F.X(2*rm/nbh)-F.X(0)-1,height:F.Y(0)-F.Y(k),fill:css("--c-lik"),"fill-opacity":0.6},svg));
  const sdLow=bs.find(v=>!isNaN(v)),sdHigh=bs.slice().reverse().find(v=>!isNaN(v)),curv=Math.max.apply(null,bm.filter(v=>!isNaN(v)).map(Math.abs))/sd(res);
  $("rStats").innerHTML=[["residual SD",fmt(sd(res),1)],["spread at low fitted",fmt(sdLow,1)],["spread at high fitted",fmt(sdHigh,1)],["skewness",fmt(skew(res),2)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const msgs={good:"The residuals form a shapeless band around zero: the blue line, the average residual in bands of fitted values, stays flat, and the spread is similar everywhere ("+fmt(sdLow,1)+" vs "+fmt(sdHigh,1)+"). The histogram is roughly symmetric. The assumptions look reasonable.",
    curve:"The blue line bends: residuals are positive at both ends and negative in the middle. A straight line can't describe a U-shaped relation between temperature and visits: both cold and hot days are busier. The fix is a nonlinear term (Lesson 11), not a different error distribution.",
    funnel:"The residuals fan out: small district–age groups vary by about "+fmt(sdLow,1)+" visits, the largest by about "+fmt(sdHigh,1)+". This is <b>heteroskedasticity</b>, typical of counts, whose variance grows with their mean. Coefficients stay unbiased, but standard errors are wrong. Poisson and negative binomial models (Lesson 8) build this mean–variance relation in."};
  setNow("rNow",msgs[m]);}
$("rM").addEventListener("change",drawR);drawR();

/* ---------- 7.4 ---------- */
function drawP(){const x0=+$("pX").value,n=+$("pN").value;$("pXO").textContent=fmt(x0,2);$("pNO").textContent=fmtInt(n);
  const r=makeRng(4040),sub=[];for(let i=0;i<n;i++)sub.push(kids[Math.floor(r()*kids.length)]);const X=sub.map(c=>[1,c.green]),f=lmFit(X,sub.map(c=>c.no2_modeled));
  const t=1.96,band=x=>{const v=f.vcov[0][0]+2*x*f.vcov[0][1]+x*x*f.vcov[1][1];return {m:f.beta[0]+f.beta[1]*x,ci:t*Math.sqrt(v),pi:t*Math.sqrt(v+f.sigma*f.sigma)};};
  const svg=clear($("pPlot")),F=frame(svg,520,300,{l:44,r:14,t:16,b:40},[0,1],[0,70]);yGrid(F,[0,20,40,60]);xAxis(F,[0,0.2,0.4,0.6,0.8,1],"green space",v=>fmt(v,1));txt(svg,F.m.l,10,"modeled NO₂ (µg/m³), fitted on "+fmtInt(n)+" children",{});
  const xs=[];for(let x=0;x<=1.0001;x+=0.02)xs.push(x);const B=xs.map(band);
  const area=(lo,hi,col,op)=>el("polygon",{points:xs.map((x,i)=>F.X(x)+","+F.Y(Math.max(0,Math.min(70,lo(B[i]))))).concat(xs.slice().reverse().map((x,i)=>F.X(x)+","+F.Y(Math.max(0,Math.min(70,hi(B[xs.length-1-i])))))).join(" "),fill:css(col),"fill-opacity":op},svg);
  area(b=>b.m-b.pi,b=>b.m+b.pi,"--p2",0.15);area(b=>b.m-b.ci,b=>b.m+b.ci,"--p1",0.35);
  const sh=sub.slice(0,300);sh.forEach(c=>el("circle",{cx:F.X(c.green),cy:F.Y(Math.min(70,c.no2_modeled)),r:1.8,fill:css("--c-lik"),"fill-opacity":0.5},svg));
  poly(F,xs,B.map(b=>b.m),{stroke:css("--p1"),"stroke-width":2.4});el("line",{x1:F.X(x0),x2:F.X(x0),y1:F.m.t,y2:F.Y(0),stroke:css("--c-ink"),"stroke-dasharray":"3 3"},svg);
  const b0=band(x0);
  $("pStats").innerHTML=[["predicted mean",fmt(b0.m,1)],["95% CI for the mean","± "+fmt(b0.ci,2)],["95% prediction interval","± "+fmt(b0.pi,1)],["residual SD",fmt(f.sigma,1)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  setNow("pNow","For children with green space "+fmt(x0,2)+", the <b>average</b> NO₂ is estimated at "+fmt(b0.m,1)+" µg/m³, give or take "+fmt(b0.ci,2)+" (blue band). One <b>individual child</b>'s NO₂ is much less predictable: ± "+fmt(b0.pi,1)+" (orange band), because children with the same green space differ by about "+fmt(f.sigma,1)+" µg/m³. Increase the number of children: the blue band shrinks toward the line, but the orange band stays wide. More data tell us the mean better; they don't make individuals more alike.");
  $("pReport").innerHTML="For a child with green space "+fmt(x0,2)+", predicted mean NO₂ was <b>"+fmt(b0.m,1)+" µg/m³ (95% CI "+fmt(b0.m-b0.ci,1)+" to "+fmt(b0.m+b0.ci,1)+")</b>; 95% of individual children would be expected between "+fmt(Math.max(0,b0.m-b0.pi),1)+" and "+fmt(b0.m+b0.pi,1)+" µg/m³.";}
["pX","pN"].forEach(id=>$(id).addEventListener("input",drawP));drawP();

buildQuiz("quizzes",[
 {t:"stat",q:"Least squares chooses the line that:",o:[["Passes through the most points","Few points lie exactly on the line.",0],["Minimizes the sum of squared vertical distances from the points to the line","That's the least-squares criterion; with normal errors it also gives the maximum likelihood estimate.",1],["Minimizes the sum of distances perpendicular to the line","That's a different method (orthogonal regression).",0],["Makes half the residuals positive","That's roughly what a median-type line does.",0]]},
 {t:"stat",q:"In a model of NO₂ on green space and district traffic, the green-space coefficient is −14. It means:",o:[["Green space causes NO₂ to fall by 14","The coefficient is an association within levels of traffic; causation needs more assumptions.",0],["Among children in districts with the same traffic, NO₂ is on average 14 µg/m³ lower per unit (1.4 per 0.1) of green space","Coefficients in multiple regression compare people with the same values of the other predictors.",1],["14% of NO₂ is explained by green space","R² measures explained variation; the coefficient is a slope.",0],["Traffic doesn't matter","The traffic coefficient answers that, not the green one.",0]]},
 {t:"epi",q:"A paper's Table 2 shows adjusted coefficients for an exposure and for all its confounders. The confounders' coefficients:",o:[["Are all valid effect estimates of those confounders","Each confounder may need a different adjustment set; their coefficients often can't be read as effects (the Table 2 fallacy).",0],["May not be interpretable as causal effects, because the model was built for the main exposure","The adjustment set that suits one exposure rarely suits all the other variables in the model.",1],["Are always biased toward zero","There is no general direction.",0],["Should be omitted from any paper","They can be reported, but with care in interpretation.",0]]},
 {t:"stat",q:"A residual plot shows residuals spreading out as fitted values increase. This is:",o:[["Nonlinearity","Nonlinearity shows as a curve in the average residual, not as a widening spread.",0],["Heteroskedasticity","Non-constant variance; common for counts, whose variance grows with their mean.",1],["Autocorrelation","That shows as patterns over time.",0],["Evidence the model is perfect","It's a violation of the constant-variance assumption.",0]]},
 {t:"stat",q:"With more data, the 95% prediction interval for an individual child:",o:[["Shrinks to zero","It can't shrink below the natural scatter of individuals around the mean.",0],["Shrinks toward ± 1.96 × the residual SD","The uncertainty in the mean vanishes, but the individual scatter remains.",1],["Becomes identical to the confidence interval for the mean","The prediction interval always includes the residual variation.",0],["Gets wider","More data never widen it on average.",0]]},
 {t:"epi",q:"Why is linear regression usually not used for daily emergency visit counts?",o:[["Because counts can't be averaged","They can; the issue is the model's assumptions.",0],["Because the variance of counts grows with their mean, effects are often multiplicative, and linear models can predict negative counts","Poisson-type GLMs (Lesson 8) address all three.",1],["Because linear regression requires binary outcomes","That's logistic regression.",0],["Because the sample is always too small","Daily series are often long.",0]]}]);
onTheme(()=>{drawLS();drawR();drawP();});
});
