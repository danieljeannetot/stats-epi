/* bart-engine.js — a compact Bayesian additive regression trees sampler for teaching.
   Follows Chipman, George & McCulloch (2010): sum of m trees, tree prior gamma*(1+d)^-beta,
   conjugate normal leaves, grow/prune Metropolis–Hastings moves, Bayesian backfitting.
   Gaussian outcomes, and binary outcomes by probit data augmentation (Albert & Chib 1993).
   Hard decision rules only; bartisan's default soft rules are described, not implemented here. */
(function(root){
function rngFrom(seed){let s=seed>>>0||1;return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function rgamma(k,r){if(k<1)return rgamma(k+1,r)*Math.pow(r(),1/k);const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=gauss(r);v=1+c*x;}while(v<=0);v=v*v*v;const u=r();if(u<1-0.0331*x*x*x*x||Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return d*v;}}
function pnorm(x){const t=1/(1+0.2316419*Math.abs(x)),d=0.3989422804014327*Math.exp(-x*x/2),p=d*t*(0.31938153+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>0?1-p:p;}
function qnorm(p){/* Acklam's rational approximation */const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
  if(p<=0)return -8;if(p>=1)return 8;const pl=0.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if(p<=1-pl){q=p-0.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
  q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}

function BART(X,y,o){o=o||{};const n=X.length,p=X[0].length,m=o.m||50,gam=o.gamma===undefined?0.95:o.gamma,bet=o.beta===undefined?2:o.beta,k=o.k||2,minLeaf=o.minLeaf||5,nCut=o.nCut||40,type=o.type||"gauss";
  const r=rngFrom(o.seed||1),S={n:n,p:p,m:m,type:type,iter:0};
  /* candidate cutpoints: midpoints between quantiles of each predictor */
  const cuts=[];for(let j=0;j<p;j++){const v=X.map(row=>row[j]).sort((a,b)=>a-b),u=[];for(let q=1;q<nCut;q++){const a=v[Math.floor((q/nCut)*(n-1))],b=v[Math.min(n-1,Math.floor((q/nCut)*(n-1))+1)],c=(a+b)/2;if(!u.length||c>u[u.length-1]+1e-12)u.push(c);}cuts.push(u.filter(c=>c>v[0]&&c<v[n-1]));}
  let ymin=0,ymax=1,offset=0,sigma2=1,sigMu,target;
  if(type==="gauss"){ymin=Math.min.apply(null,y);ymax=Math.max.apply(null,y);target=y.map(v=>(v-ymin)/(ymax-ymin)-0.5);sigMu=0.5/(k*Math.sqrt(m));
    /* sigma prior: nu = 3, lambda such that P(sigma < sd(target)) = 0.9 */
    const mt=target.reduce((a,b)=>a+b,0)/n,s2=target.reduce((a,b)=>a+(b-mt)*(b-mt),0)/(n-1);S.nu=3;S.lambda=0.5844*s2/3;sigma2=s2;}
  else{const yb=y.reduce((a,b)=>a+b,0)/n;offset=qnorm(Math.min(0.99,Math.max(0.01,yb)));sigMu=3/(k*Math.sqrt(m));target=y.map(v=>v?1:-1);sigma2=1;}
  const lo0=new Array(p).fill(0),hi0=cuts.map(c=>c.length);
  const allIdx=Array.from({length:n},(_,i)=>i);
  const trees=[],fits=[];for(let t=0;t<m;t++){trees.push({leaf:true,mu:0,idx:allIdx.slice(),depth:0,lo:lo0.slice(),hi:hi0.slice(),parent:null});fits.push(new Float64Array(n));}
  const F=new Float64Array(n),R=new Float64Array(n);
  /* optional parametric part: W (n x q) with coefficients beta ~ Normal(0, betaSD^2), as in bartisan's vc(x, ~ 1) */
  const W=o.W||null,q=W?W[0].length:0,beta=new Float64Array(q),Wb=new Float64Array(n),bsd=o.betaSD||1;S.beta=beta;
  function leaves(t,out){if(t.leaf)out.push(t);else{leaves(t.left,out);leaves(t.right,out);}return out;}
  function nogs(t,out){if(!t.leaf){if(t.left.leaf&&t.right.leaf)out.push(t);else{nogs(t.left,out);nogs(t.right,out);}}return out;}
  const LL=(nn,s)=>-0.5*Math.log(1+nn*sigMu*sigMu/sigma2)+sigMu*sigMu*s*s/(2*sigma2*(sigma2+nn*sigMu*sigMu));
  const psplit=d=>gam*Math.pow(1+d,-bet);
  const sumR=idx=>{let s=0;for(let q=0;q<idx.length;q++)s+=R[idx[q]];return s;};
  function treeStructLog(d){return Math.log(psplit(d))+2*Math.log(1-psplit(d+1))-Math.log(1-psplit(d));}
  function grow(root,lv,nogCount){const b=lv.length,leaf=lv[Math.floor(r()*b)],vars=[];for(let j=0;j<p;j++)if(leaf.hi[j]-leaf.lo[j]>=1)vars.push(j);if(!vars.length)return false;
    const j=vars[Math.floor(r()*vars.length)],ci=leaf.lo[j]+Math.floor(r()*(leaf.hi[j]-leaf.lo[j])),c=cuts[j][ci],L=[],Rr=[];for(const i of leaf.idx)(X[i][j]<=c?L:Rr).push(i);
    if(L.length<minLeaf||Rr.length<minLeaf)return false;
    const sl=sumR(L),sr=sumR(Rr),sp=sl+sr,parentWasNog=leaf.parent&&leaf.parent.left.leaf&&leaf.parent.right.leaf,w2=nogCount-(parentWasNog?1:0)+1;
    const lr=Math.log(0.5/(b===1?1:0.5))+Math.log(b)-Math.log(w2)+treeStructLog(leaf.depth)+LL(L.length,sl)+LL(Rr.length,sr)-LL(leaf.idx.length,sp);
    if(Math.log(r())<lr){const lhi=leaf.hi.slice();lhi[j]=ci;const rlo=leaf.lo.slice();rlo[j]=ci+1;
      leaf.left={leaf:true,mu:0,idx:L,depth:leaf.depth+1,lo:leaf.lo.slice(),hi:lhi,parent:leaf};leaf.right={leaf:true,mu:0,idx:Rr,depth:leaf.depth+1,lo:rlo,hi:leaf.hi.slice(),parent:leaf};
      leaf.leaf=false;leaf.v=j;leaf.c=c;leaf.ci=ci;return true;}return false;}
  function prune(root,lv,ng){const b=lv.length,w2=ng.length,node=ng[Math.floor(r()*w2)],sl=sumR(node.left.idx),sr=sumR(node.right.idx);
    const lr=Math.log((b-1===1?1:0.5)/0.5)+Math.log(w2)-Math.log(b-1)-treeStructLog(node.depth)+LL(node.idx.length,sl+sr)-LL(node.left.idx.length,sl)-LL(node.right.idx.length,sr);
    if(Math.log(r())<lr){node.leaf=true;node.left=null;node.right=null;node.mu=0;return true;}return false;}
  S.acc={grow:0,prune:0,tried:0};
  function updateBeta(){if(!q)return;const A=[],bvec=new Array(q).fill(0);for(let a=0;a<q;a++)A.push(new Array(q).fill(0));
    for(let i=0;i<n;i++){const e=target[i]-offset-(F[i]-Wb[i]),w=W[i];for(let a=0;a<q;a++){bvec[a]+=w[a]*e;for(let c=0;c<q;c++)A[a][c]+=w[a]*w[c];}}
    for(let a=0;a<q;a++)A[a][a]+=sigma2/(bsd*bsd);
    /* posterior: Normal(A^-1 b, sigma2 A^-1); solve with a Cholesky factor */
    const L=A.map(()=>new Array(q).fill(0));for(let i=0;i<q;i++)for(let j=0;j<=i;j++){let v=A[i][j];for(let k2=0;k2<j;k2++)v-=L[i][k2]*L[j][k2];L[i][j]=i===j?Math.sqrt(v):v/L[j][j];}
    const fw=new Array(q);for(let i=0;i<q;i++){let v=bvec[i];for(let k2=0;k2<i;k2++)v-=L[i][k2]*fw[k2];fw[i]=v/L[i][i];}
    const z=Array.from({length:q},()=>gauss(r)),u=new Array(q);for(let i=0;i<q;i++)u[i]=fw[i]+Math.sqrt(sigma2)*z[i];
    for(let i=q-1;i>=0;i--){let v=u[i];for(let k2=i+1;k2<q;k2++)v-=L[k2][i]*beta[k2];beta[i]=v/L[i][i];}
    for(let i=0;i<n;i++){let v=0;for(let a=0;a<q;a++)v+=W[i][a]*beta[a];F[i]+=v-Wb[i];Wb[i]=v;}}
  S.step=function(){for(let t=0;t<m;t++){const tr=trees[t],ft=fits[t];for(let i=0;i<n;i++)R[i]=target[i]-(F[i]-ft[i])-offset;
      const lv=leaves(tr,[]),ng=nogs(tr,[]);S.acc.tried++;
      if(lv.length===1||r()<0.5){if(grow(tr,lv,ng.length))S.acc.grow++;}else{if(prune(tr,lv,ng))S.acc.prune++;}
      const lv2=leaves(tr,[]);for(const lf of lv2){const nn=lf.idx.length,s=sumR(lf.idx),v=sigma2*sigMu*sigMu/(sigma2+nn*sigMu*sigMu),mn=sigMu*sigMu*s/(sigma2+nn*sigMu*sigMu);lf.mu=mn+Math.sqrt(v)*gauss(r);for(const i of lf.idx){F[i]+=lf.mu-ft[i];ft[i]=lf.mu;}}}
    updateBeta();
    if(type==="gauss"){let sse=0;for(let i=0;i<n;i++){const e=target[i]-F[i];sse+=e*e;}sigma2=(S.nu*S.lambda+sse)/(2*rgamma((S.nu+n)/2,r));}
    else{for(let i=0;i<n;i++){const mu=F[i]+offset,u=r();if(y[i]){const a=pnorm(-mu);target[i]=mu+qnorm(a+u*(1-a));}else{const a=pnorm(-mu);target[i]=mu+qnorm(u*a);}}}
    S.iter++;};
  function treeVal(t,x){while(!t.leaf)t=x[t.v]<=t.c?t.left:t.right;return t.mu;}
  /* prediction on the outcome scale (gauss) or the latent probit scale (probit) */
  S.predictLatent=function(x,w){let s=offset;for(let t=0;t<m;t++)s+=treeVal(trees[t],x);if(w)for(let a=0;a<q;a++)s+=w[a]*beta[a];return s;};
  S.predict=function(x,w){const f=S.predictLatent(x,w);return type==="gauss"?(f+0.5)*(ymax-ymin)+ymin:pnorm(f);};
  S.sigma=function(){return type==="gauss"?Math.sqrt(sigma2)*(ymax-ymin):1;};
  S.meanLeaves=function(){let s=0;for(const t of trees)s+=leaves(t,[]).length;return s/m;};
  S.splitCounts=function(){const c=new Array(p).fill(0);for(const t of trees)(function walk(u){if(!u.leaf){c[u.v]++;walk(u.left);walk(u.right);}})(t);return c;};
  return S;}

/* single greedy regression tree (CART) for one predictor, used to show what one tree does */
function cart1D(x,y,maxDepth,minLeaf){const idx=x.map((_,i)=>i).sort((a,b)=>x[a]-x[b]);
  function build(ids,d){const n=ids.length,mean=ids.reduce((s,i)=>s+y[i],0)/n;if(d>=maxDepth||n<2*minLeaf)return {leaf:true,mu:mean,n:n,lo:x[ids[0]],hi:x[ids[n-1]]};
    let tot=0;ids.forEach(i=>tot+=y[i]);let left=0,best=null;for(let q=0;q<n-1;q++){left+=y[ids[q]];const nl=q+1,nr=n-nl;if(nl<minLeaf||nr<minLeaf||x[ids[q]]===x[ids[q+1]])continue;const gain=left*left/nl+(tot-left)*(tot-left)/nr;if(!best||gain>best.g)best={g:gain,q:q};}
    if(!best)return {leaf:true,mu:mean,n:n};const c=(x[ids[best.q]]+x[ids[best.q+1]])/2;return {leaf:false,c:c,left:build(ids.slice(0,best.q+1),d+1),right:build(ids.slice(best.q+1),d+1)};}
  const tree=build(idx,0);const pred=v=>{let t=tree;while(!t.leaf)t=v<=t.c?t.left:t.right;return t.mu;};const splits=[];(function w(t){if(!t.leaf){splits.push(t.c);w(t.left);w(t.right);}})(tree);let nl=0;(function w(t){if(t.leaf)nl++;else{w(t.left);w(t.right);}})(tree);
  return {tree:tree,predict:pred,splits:splits,leaves:nl};}

/* draw a function from the BART prior on [0, 1], on the standardized outcome scale */
function priorDraw(m,gam,bet,k,r,grid){const sigMu=0.5/(k*Math.sqrt(m)),f=new Float64Array(grid.length);let leavesTot=0;
  function grow(lo,hi,d){if(r()<gam*Math.pow(1+d,-bet)&&hi-lo>2){const c=lo+1+Math.floor(r()*(hi-lo-1));return {c:c,left:grow(lo,c,d+1),right:grow(c,hi,d+1)};}leavesTot++;return {mu:sigMu*gauss(r)};}
  for(let t=0;t<m;t++){const tr=grow(0,100,0);grid.forEach((g,i)=>{let u=tr;const gi=Math.floor(g*100);while(u.c!==undefined)u=gi<u.c?u.left:u.right;f[i]+=u.mu;});}
  return {f:f,leaves:leavesTot/m};}

const api={BART:BART,cart1D:cart1D,priorDraw:priorDraw,bartRng:rngFrom,bartGauss:gauss,bartPnorm:pnorm,bartQnorm:qnorm};
if(typeof module!=="undefined")module.exports=api;else Object.assign(root,api);
})(typeof window!=="undefined"?window:this);
