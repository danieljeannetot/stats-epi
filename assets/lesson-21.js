document.addEventListener("DOMContentLoaded",function(){
const $=id=>document.getElementById(id);
const A=genA();
const lbeta=(a,b)=>lgammaFn(a)+lgammaFn(b)-lgammaFn(a+b),dbeta=(x,a,b)=>Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-lbeta(a,b));
function ess(chains){const M=chains.length,N=chains[0].length;if(N<4)return NaN;const means=chains.map(mean),vars=chains.map(c=>{const m=mean(c);return sum(c.map(v=>(v-m)*(v-m)))/(N-1);});
  const W=mean(vars),B=M>1?N*sum(means.map(m=>Math.pow(m-mean(means),2)))/(M-1):0,vp=(N-1)/N*W+B/N;let s=0;
  for(let k=1;k<N-1;k+=2){const rho=t=>{let acc=0;chains.forEach((c,i)=>{const m=means[i];let a=0;for(let j=t;j<N;j++)a+=(c[j]-m)*(c[j-t]-m);acc+=a/N;});return 1-(W-acc/M)/vp;};const pr=rho(k)+rho(k+1);if(pr<0)break;s+=pr;if(k>200)break;}
  return Math.max(1,Math.min(M*N*2,M*N/(1+2*s)));}
function rhat(chains){const sp=[];chains.forEach(c=>{const h=Math.floor(c.length/2);sp.push(c.slice(0,h));sp.push(c.slice(h,2*h));});const M=sp.length,N=sp[0].length;if(N<2)return NaN;
  const means=sp.map(mean),W=mean(sp.map(c=>{const m=mean(c);return sum(c.map(v=>(v-m)*(v-m)))/(N-1);})),B=N*sum(means.map(m=>Math.pow(m-mean(means),2)))/(M-1);return Math.sqrt(((N-1)/N*W+B/N)/W);}
function essSimple(c){return ess([c]);}

/* ---------- 21.1 Metropolis on a risk ---------- */
const lp1=p=>p<=0||p>=1?-Infinity:30*Math.log(p)+170*Math.log(1-p)+Math.log(p)+17*Math.log(1-p);
let ch=[],acc=0,r1=makeRng(2101);
function reset1(){ch=[+$("m1X").value];acc=0;r1=makeRng(2101);draw1();}
function step1(k){const s=+$("m1S").value;for(let i=0;i<k;i++){const cur=ch[ch.length-1],prop=cur+s*gaussFrom(r1);if(Math.log(r1())<lp1(prop)-lp1(cur)){ch.push(prop);acc++;}else ch.push(cur);}draw1();}
function draw1(){$("m1SO").textContent=fmt(+$("m1S").value,3);$("m1XO").textContent=fmt(+$("m1X").value,2);const N=ch.length;
  let svg=clear($("m1Trace")),F=frame(svg,520,170,{l:44,r:12,t:16,b:30},[0,Math.max(50,N-1)],[0,0.9]);yGrid(F,[0,0.3,0.6,0.9],v=>Math.round(100*v)+"%");xAxis(F,niceTicks(0,Math.max(50,N-1),5).filter(v=>Number.isInteger(v)),null);txt(svg,F.m.l,10,"trace: the chain's value at each iteration",{});
  const wu=Math.floor(N*0.1);if(wu>0)el("rect",{x:F.X(0),y:F.m.t,width:F.X(wu)-F.X(0),height:F.Y(0)-F.m.t,fill:css("--c-soft")},svg);
  const stepI=Math.max(1,Math.floor(N/800));const xs=[],ys=[];for(let i=0;i<N;i+=stepI){xs.push(i);ys.push(ch[i]);}poly(F,xs,ys,{stroke:css("--p1"),"stroke-width":1.2});
  const kept=ch.slice(wu),ap=32,bp=188;svg=clear($("m1Hist"));F=frame(svg,520,200,{l:44,r:12,t:16,b:36},[0.05,0.3],[0,1]);xAxis(F,[0.05,0.1,0.15,0.2,0.25,0.3],"risk",v=>Math.round(100*v)+"%");txt(svg,F.m.l,10,"samples after warm-up (bars) and the exact posterior (line)",{});
  const xs2=[];for(let x=0.05;x<=0.3;x+=0.002)xs2.push(x);const de=xs2.map(x=>dbeta(x,ap,bp)),dm=Math.max.apply(null,de);
  if(kept.length>5){const nb=40,w=0.25/nb,c=new Array(nb).fill(0);kept.forEach(v=>{const i=Math.floor((v-0.05)/w);if(i>=0&&i<nb)c[i]++;});const sc=dm/(kept.length*w);c.forEach((k,i)=>{const h=k*sc/dm;el("rect",{x:F.X(0.05+i*w)+0.5,y:F.Y(h),width:F.X(0.05+w)-F.X(0.05)-1,height:F.Y(0)-F.Y(h),fill:css("--c-post"),"fill-opacity":0.5},svg);});}
  poly(F,xs2,de.map(v=>v/dm),{stroke:css("--c-ink"),"stroke-width":2});
  const ar=N>1?acc/(N-1):NaN,e=kept.length>20?essSimple(kept):NaN;
  $("m1Stats").innerHTML=[["iterations",fmtInt(N-1)],["acceptance rate",isNaN(ar)?"—":fmt(100*ar,0)+"%"],["posterior mean (sampled / exact)",(kept.length?fmt(100*mean(kept),2):"—")+" / "+fmt(100*ap/(ap+bp),2)+"%"],["effective sample size",isNaN(e)?"—":fmtInt(e)]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  const s=+$("m1S").value;let msg=N<2?"The chain starts at "+fmt(100*ch[0],0)+"%, far from where the posterior lies. Take a few steps.":"After "+fmtInt(N-1)+" iterations, "+fmt(100*ar,0)+"% of proposals have been accepted. ";
  if(N>1){if(s<0.008)msg+="The step size is tiny: almost every proposal is accepted, but the chain crawls, and successive values are nearly identical, so the effective sample size is small.";else if(s>0.12)msg+="The step size is large: most proposals land far out in the tails and are rejected, so the chain sits still for long stretches (flat segments in the trace).";else msg+="This step size is reasonable: moves are frequent and substantial.";
    msg+=" The shaded first 10% is <b>warm-up</b>, discarded because the chain was still travelling from its starting point. "+(kept.length>500?"The histogram now closely matches the exact posterior.":"With more iterations, the histogram will match the exact posterior.");}
  setNow("m1Now",msg);}
$("m1One").addEventListener("click",()=>step1(1));$("m1Ten").addEventListener("click",()=>step1(100));$("m1K").addEventListener("click",()=>step1(2000));$("m1R").addEventListener("click",reset1);
$("m1X").addEventListener("input",reset1);$("m1S").addEventListener("input",draw1);reset1();

/* ---------- the 2-parameter Poisson model ---------- */
const LK=DISTRICTS.find(d=>d.name==="Lakeside").id,WARM=A.rows.filter(r=>r.district_id===LK&&r.g===2&&r.temp>=15).slice(0,120),Y=WARM.map(r=>r.visits);
function model(centered){const c=centered?20:0,x=WARM.map(r=>r.temp-c),f=glmFit(x.map(v=>[1,v]),Y,"poisson"),mode=f.beta,sd=[Math.sqrt(f.vcov[0][0]),Math.sqrt(f.vcov[1][1])],rho=f.vcov[0][1]/(sd[0]*sd[1]);
  const pa=centered?{m:Math.log(8),s:1}:{m:Math.log(8)-20*0.02,s:2},pb={m:0,s:0.05};
  const lp=th=>{let s=0;for(let i=0;i<x.length;i++){const e=th[0]+th[1]*x[i];s+=Y[i]*e-Math.exp(e);}return s-0.5*Math.pow((th[0]-pa.m)/pa.s,2)-0.5*Math.pow((th[1]-pb.m)/pb.s,2);};
  const gr=th=>{let g0=0,g1=0;for(let i=0;i<x.length;i++){const r=Y[i]-Math.exp(th[0]+th[1]*x[i]);g0+=r;g1+=r*x[i];}return [g0-(th[0]-pa.m)/(pa.s*pa.s),g1-(th[1]-pb.m)/(pb.s*pb.s)];};
  return {mode:mode,sd:sd,rho:rho,lp:lp,gr:gr,centered:centered};}
const MOD={c:model(true),u:model(false)};
/* samplers work in standardized coordinates z = (theta - mode) / sd, like a diagonal mass matrix */
function runSampler(M,kind,n,start,rng,opts){opts=opts||{};const toT=z=>[M.mode[0]+M.sd[0]*z[0],M.mode[1]+M.sd[1]*z[1]],lpz=z=>M.lp(toT(z)),gz=z=>{const g=M.gr(toT(z));return [g[0]*M.sd[0],g[1]*M.sd[1]];};
  let z=start.slice(),cur=lpz(z),eps=opts.eps||0.3,step=opts.step||0.8,acc=0;const out=[],paths=[];
  for(let it=0;it<n;it++){if(kind==="rw"){const p=[z[0]+step*gaussFrom(rng),z[1]+step*gaussFrom(rng)],lpp=lpz(p),a=Math.log(rng())<lpp-cur;if(a){z=p;cur=lpp;acc++;}if(!opts.fixed&&it<opts.adapt)step*=a?1.05:0.96;paths.push([toT(z)]);}
    else{let q=z.slice(),r=[gaussFrom(rng),gaussFrom(rng)];const H0=-cur+0.5*(r[0]*r[0]+r[1]*r[1]),L=Math.min(60,Math.max(3,Math.ceil(1.6/eps))),tr=[toT(q)];let g=gz(q);
      for(let l=0;l<L;l++){r=[r[0]+eps/2*g[0],r[1]+eps/2*g[1]];q=[q[0]+eps*r[0],q[1]+eps*r[1]];g=gz(q);r=[r[0]+eps/2*g[0],r[1]+eps/2*g[1]];tr.push(toT(q));}
      const lq=lpz(q),H1=-lq+0.5*(r[0]*r[0]+r[1]*r[1]),a=isFinite(H1)&&Math.log(rng())<H0-H1;if(a){z=q;cur=lq;acc++;}if(!opts.fixed&&it<opts.adapt)eps*=a?1.03:0.85;paths.push(tr);}
    out.push(toT(z));}
  return {draws:out,acc:acc/n,paths:paths,eps:eps,step:step};}

/* ---------- 21.2 ---------- */
let hS="rw",hP="c",hRes=null,hRng=makeRng(2121);
function gridLP(M){const g=[],NA=44,NB=44,lo=[M.mode[0]-4*M.sd[0],M.mode[1]-4*M.sd[1]],hi=[M.mode[0]+4*M.sd[0],M.mode[1]+4*M.sd[1]];let mx=-Infinity;
  for(let i=0;i<NA;i++){const row=[];for(let j=0;j<NB;j++){const v=M.lp([lo[0]+(hi[0]-lo[0])*(i+0.5)/NA,lo[1]+(hi[1]-lo[1])*(j+0.5)/NB]);row.push(v);if(v>mx)mx=v;}g.push(row);}return {g:g.map(r=>r.map(v=>Math.exp(v-mx))),lo:lo,hi:hi,NA:NA,NB:NB};}
const GRIDS={c:gridLP(MOD.c),u:gridLP(MOD.u)};
function drawH(){["hM","hH"].forEach(id=>$(id).setAttribute("aria-pressed",String((id==="hM")===(hS==="rw"))));["hC","hU"].forEach(id=>$(id).setAttribute("aria-pressed",String((id==="hC")===(hP==="c"))));
  const M=MOD[hP],G=GRIDS[hP],svg=clear($("hMap")),F=frame(svg,520,330,{l:56,r:12,t:16,b:40},[G.lo[1],G.hi[1]],[G.lo[0],G.hi[0]]);
  xAxis(F,niceTicks(G.lo[1],G.hi[1],5),"β (per °C)",v=>fmt(v,3));niceTicks(G.lo[0],G.hi[0],4).forEach(v=>txt(svg,F.m.l-6,F.Y(v)+4,fmt(v,2),{"text-anchor":"end"}));txt(svg,F.m.l,10,"posterior of (α, β); α = log expected visits at "+(hP==="c"?"20°C":"0°C"),{});
  const cw=(F.w-F.m.l-F.m.r)/G.NB,chh=(F.Y(G.lo[0])-F.m.t)/G.NA;G.g.forEach((row,i)=>row.forEach((v,j)=>{if(v>0.01)el("rect",{x:F.m.l+j*cw,y:F.Y(G.lo[0])-(i+1)*chh,width:cw+0.5,height:chh+0.5,fill:css("--c-post"),"fill-opacity":(0.85*Math.pow(v,0.7)).toFixed(2)},svg);}));
  if(hRes){const d=hRes.draws;d.forEach(p=>el("circle",{cx:F.X(p[1]),cy:F.Y(p[0]),r:1.8,fill:css("--c-ink"),"fill-opacity":0.6},svg));
    if(hS==="rw"){const last=d.slice(-40);poly(F,last.map(p=>p[1]),last.map(p=>p[0]),{stroke:css("--p2"),"stroke-width":1.4});}
    else{const tr=hRes.paths[hRes.paths.length-1];poly(F,tr.map(p=>p[1]),tr.map(p=>p[0]),{stroke:css("--p2"),"stroke-width":2});tr.forEach(p=>el("circle",{cx:F.X(p[1]),cy:F.Y(p[0]),r:2.4,fill:css("--p2")},svg));}}
  const t=clear($("hTr"));if(hRes){const b=hRes.draws.map(p=>p[1]),T=frame(t,520,160,{l:56,r:12,t:16,b:24},[0,b.length-1],[G.lo[1],G.hi[1]]);txt(t,T.m.l,10,"trace of β",{});poly(T,b.map((_,i)=>i),b,{stroke:css("--p1"),"stroke-width":1.2});}
  const e=hRes?essSimple(hRes.draws.slice(50).map(p=>p[1])):NaN;
  $("hStats").innerHTML=[["posterior correlation of α and β",fmt(M.rho,3)],["iterations",hRes?String(hRes.draws.length):"0"],["acceptance rate",hRes?fmt(100*hRes.acc,0)+"%":"—"],["effective sample size for β",hRes?fmtInt(e)+" of "+(hRes.draws.length-50):"—"]].map(x=>"<div><span>"+x[0]+"</span><b>"+x[1]+"</b></div>").join("");
  let msg=(hP==="c"?"With temperature centered at 20°C, α and β are nearly uncorrelated ("+fmt(M.rho,2)+"): the posterior is a round blob.":"With temperature in raw °C, α is the log expected visits at 0°C, far outside the data, and it trades off almost perfectly against β (correlation "+fmt(M.rho,3)+"): the posterior is a thin diagonal ridge.")+" ";
  if(hRes)msg+=(hS==="rw"?"The random walk (orange path: last 40 moves) proposes steps in random directions. "+(hP==="u"?"On a thin ridge, almost every direction leads off it, so steps must be tiny and the chain creeps: ESS "+fmtInt(e)+".":"On a round posterior it explores well: ESS "+fmtInt(e)+"."):"HMC follows the gradient along a trajectory (orange: the last iteration's leapfrog steps), traveling far in one iteration and still being accepted. "+(hP==="u"?"Even on the ridge it does far better than the random walk (ESS "+fmtInt(e)+"), though it needed a smaller step size.":"ESS "+fmtInt(e)+": nearly independent draws."));
  else msg+="Press Run.";
  setNow("hNow",msg+" Centering predictors is a cheap fix that helps every sampler.");}
$("hM").addEventListener("click",()=>{hS="rw";hRes=null;drawH();});$("hH").addEventListener("click",()=>{hS="hmc";hRes=null;drawH();});
$("hC").addEventListener("click",()=>{hP="c";hRes=null;drawH();});$("hU").addEventListener("click",()=>{hP="u";hRes=null;drawH();});
$("hRun").addEventListener("click",()=>{const r=runSampler(MOD[hP],hS,300,[2.5,-2.5],hRng,{adapt:100});hRes=r;drawH();});$("hRes").addEventListener("click",()=>{hRes=null;hRng=makeRng(2121);drawH();});drawH();

/* ---------- 21.3 diagnostics ---------- */
const SC={good:{m:"c",k:"hmc",n:800,warm:200,opts:{adapt:200}},short:{m:"c",k:"rw",n:40,warm:0,opts:{step:0.5,fixed:true}},tiny:{m:"c",k:"rw",n:600,warm:0,opts:{step:0.03,fixed:true}},unc:{m:"u",k:"rw",n:800,warm:200,opts:{adapt:200}}};
const STARTS=[[3,3],[-3,-3],[3,-3],[-3,3]];let sc="good";
function drawD(){document.querySelectorAll("[data-sc]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.sc===sc)));const S=SC[sc],M=MOD[S.m],rng=makeRng(2131);
  const runs=STARTS.map(s=>runSampler(M,S.k,S.n,s,rng,Object.assign({},S.opts))),post=runs.map(r=>r.draws.slice(S.warm)),cols=["--p1","--p2","--p4","--p5"];
  const svg=clear($("dTr")),half=[["β",1],["α",0]];half.forEach((h,k)=>{const top=k*150,all=runs.flatMap(r=>r.draws.map(p=>p[h[1]])),lo=Math.min.apply(null,all),hi=Math.max.apply(null,all);
    const F={X:i=>44+i/(S.n-1)*(520-56),Y:v=>top+18+(1-(v-lo)/(hi-lo||1))*110};txt(svg,44,top+12,"trace of "+h[0]+(S.warm?" (shaded: warm-up)":""),{});
    if(S.warm)el("rect",{x:F.X(0),y:top+18,width:F.X(S.warm)-F.X(0),height:110,fill:css("--c-soft")},svg);
    runs.forEach((r,c)=>{const xs=[],ys=[];r.draws.forEach((p,i)=>{if(i%Math.max(1,Math.floor(S.n/400))===0){xs.push(F.X(i));ys.push(F.Y(p[h[1]]));}});el("polyline",{points:xs.map((x,i)=>x.toFixed(1)+","+ys[i].toFixed(1)).join(" "),fill:"none",stroke:css(cols[c]),"stroke-width":1.1,"stroke-opacity":0.85},svg);});});
  const res=half.map(h=>{const chs=post.map(c=>c.map(p=>p[h[1]]));return {n:h[0],rh:rhat(chs),es:ess(chs),m:mean(chs.flat())};});
  $("dTab").innerHTML="<tr><th>Parameter</th><th class='n'>R-hat</th><th class='n'>ESS</th><th class='n'>posterior mean</th></tr>"+res.map(r=>"<tr><td>"+r.n+"</td><td class='n' style='color:"+(r.rh>1.01?"var(--c-bad)":"var(--c-ok)")+"'>"+fmt(r.rh,3)+"</td><td class='n' style='color:"+(r.es<400?"var(--c-bad)":"var(--c-ok)")+"'>"+fmtInt(r.es)+"</td><td class='n'>"+fmt(r.m,4)+"</td></tr>").join("");
  const msg={good:"Four chains, started far apart, quickly find the same region and then overlap completely: the classic \"hairy caterpillar\". R-hat is at or near 1.00 and the effective sample size is large. These draws can be trusted.",
    short:"With only 40 iterations and no warm-up, the chains haven't forgotten their starting points: they are still converging, and they disagree. R-hat is well above 1.01. Never interpret such output; run longer.",
    tiny:"The step size is so small that each chain drifts slowly from its start, like a random walk through treacle. Even after 600 iterations the chains haven't met: R-hat is large, ESS tiny. Stan adapts its step size automatically, which is why this is rare in practice, but a warning about it means exactly this.",
    unc:"With the uncentered parameterization, the random walk has to creep along a thin ridge. The chains do overlap eventually, but the effective sample size is a small fraction of the draws, and α (far from the data) is worst. Centering the predictor, as in 21.2, fixes it."}[sc];
  setNow("dNow",msg);}
document.querySelectorAll("[data-sc]").forEach(b=>b.addEventListener("click",()=>{sc=b.dataset.sc;drawD();}));drawD();

buildQuiz("quizzes",[
 {t:"stat",q:"Why is MCMC used instead of computing the posterior on a grid?",o:[["Grids give the wrong answer","Grids are exact up to resolution, but infeasible in many dimensions.",0],["The number of grid points grows exponentially with the number of parameters","100 points per parameter for 20 parameters is 10⁴⁰ points.",1],["MCMC needs no likelihood","It needs the unnormalized posterior, which includes the likelihood.",0],["Grids can't handle priors","They handle priors easily.",0]]},
 {t:"stat",q:"In the Metropolis algorithm, a proposal with lower posterior density than the current value is:",o:[["Always rejected","Then the chain would only climb to the mode.",0],["Accepted with probability equal to the ratio of the two densities","This lets the chain explore the tails in proportion to their probability.",1],["Always accepted","Then the chain would ignore the posterior.",0],["Accepted only during warm-up","The rule is the same throughout.",0]]},
 {t:"stat",q:"A Metropolis chain accepts 99% of its proposals. This usually means:",o:[["The sampler is working perfectly","High acceptance often means tiny steps.",0],["The step size is too small, so the chain moves slowly and draws are highly autocorrelated","Efficiency is about distance traveled, not acceptance.",1],["The posterior is flat","Not necessarily.",0],["The chain has converged","Acceptance rate says little about convergence.",0]]},
 {t:"stat",q:"What does Hamiltonian Monte Carlo use that random-walk Metropolis doesn't?",o:[["The prior","Both use the prior.",0],["The gradient of the log posterior, to make long moves along its shape","Gradient information guides proposals.",1],["Conjugacy","HMC works for non-conjugate models.",0],["A grid","No grid is used.",0]]},
 {t:"stat",q:"R-hat of 1.15 for a key parameter means:",o:[["The parameter is 15% larger than expected","R-hat isn't about the parameter's size.",0],["The chains disagree: the sampler hasn't converged, so results shouldn't be interpreted","Values above 1.01 signal problems.",1],["The effective sample size is 1.15","That's a different diagnostic.",0],["The posterior is bimodal","That's one possible cause, not the meaning.",0]]},
 {t:"stat",q:"Why does centering temperature at 20°C help the sampler?",o:[["It changes the model's predictions","Predictions are identical.",0],["It makes the intercept refer to a temperature within the data, removing the strong correlation between intercept and slope","An uncorrelated posterior is easier to explore.",1],["It removes the need for a prior on β","The prior is still needed.",0],["It reduces overdispersion","Centering doesn't change the variance structure.",0]]}]);
onTheme(()=>{draw1();drawH();drawD();});
});
