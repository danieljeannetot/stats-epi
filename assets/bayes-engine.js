/* bayes-engine.js — numerical tools shared by Lessons 23–25. */
(function(root){
function rng(seed){let s=seed>>>0||1;return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function rgamma(k,r){if(k<1)return rgamma(k+1,r)*Math.pow(r(),1/k);const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=gauss(r);v=1+c*x;}while(v<=0);v=v*v*v;const u=r();if(u<1-0.0331*x*x*x*x||Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return d*v;}}
function chol(M){const n=M.length,L=M.map(()=>new Array(n).fill(0));for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=M[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(s,1e-12)):s/L[j][j];}return L;}
function cholSolve(L,b){const n=L.length,y=new Array(n),x=new Array(n);for(let i=0;i<n;i++){let s=b[i];for(let k=0;k<i;k++)s-=L[i][k]*y[k];y[i]=s/L[i][i];}for(let i=n-1;i>=0;i--){let s=y[i];for(let k=i+1;k<n;k++)s-=L[k][i]*x[k];x[i]=s/L[i][i];}return x;}
function inv(M){const L=chol(M),n=M.length;const cols=[];for(let j=0;j<n;j++){const e=new Array(n).fill(0);e[j]=1;cols.push(cholSolve(L,e));}return M.map((_,i)=>cols.map(c=>c[i]));}
function logdet(M){const L=chol(M);let s=0;for(let i=0;i<L.length;i++)s+=2*Math.log(L[i][i]);return s;}
/* draw from Normal(mean = P^-1 b, cov = P^-1) given a precision matrix P */
function rmvnPrec(P,b,r){const L=chol(P),m=cholSolve(L,b),z=m.map(()=>gauss(r)),n=m.length,x=new Array(n);for(let i=n-1;i>=0;i--){let s=z[i];for(let k=i+1;k<n;k++)s-=L[k][i]*x[k];x[i]=s/L[i][i];}return m.map((v,i)=>v+x[i]);}
function rmvn(m,V,r){const L=chol(V),z=m.map(()=>gauss(r));return m.map((v,i)=>v+L[i].reduce((s,w,k)=>s+w*z[k],0));}
/* symmetric eigen-decomposition (Jacobi rotations); returns {values, vectors (columns)} */
function eigSym(A){const n=A.length,a=A.map(r=>r.slice()),V=A.map((_,i)=>A.map((__,j)=>i===j?1:0));
  for(let sweep=0;sweep<100;sweep++){let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=a[i][j]*a[i][j];if(off<1e-20)break;
    for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){if(Math.abs(a[p][q])<1e-15)continue;const th=(a[q][q]-a[p][p])/(2*a[p][q]),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
      for(let k=0;k<n;k++){const akp=a[k][p],akq=a[k][q];a[k][p]=c*akp-s*akq;a[k][q]=s*akp+c*akq;}for(let k=0;k<n;k++){const apk=a[p][k],aqk=a[q][k];a[p][k]=c*apk-s*aqk;a[q][k]=s*apk+c*aqk;}
      for(let k=0;k<n;k++){const vkp=V[k][p],vkq=V[k][q];V[k][p]=c*vkp-s*vkq;V[k][q]=s*vkp+c*vkq;}}}
  return {values:a.map((r,i)=>r[i]),vectors:V};}
function pnorm(x){const t=1/(1+0.2316419*Math.abs(x)),d=0.3989422804014327*Math.exp(-x*x/2),p=d*t*(0.31938153+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>0?1-p:p;}
function qnorm(p){const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
  if(p<=0)return -8;if(p>=1)return 8;const pl=0.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if(p<=1-pl){q=p-0.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
/* truncated normal: N(mu, 1) restricted to > 0 (pos = true) or < 0 */
function rtruncnorm(mu,pos,r){const a=pnorm(-mu),u=r();return pos?mu+qnorm(a+u*(1-a)):mu+qnorm(u*a);}
/* Pareto-smoothed importance sampling LOO (Vehtari, Gelman & Gabry 2017).
   ll: array over draws of arrays over observations (log-likelihood). Returns elpd, se, p_loo, k values. */
function gpdFit(x){/* Zhang & Stephens (2009) estimator, as used in the loo package */const n=x.length,m=30+Math.floor(Math.sqrt(n)),xs=x.slice().sort((a,b)=>a-b),xstar=xs[Math.floor(n/4+0.5)-1]||xs[0],theta=[],lth=[];
  for(let j=1;j<=m;j++)theta.push(1/xs[n-1]+(1-Math.sqrt(m/(j-0.5)))/(3*xstar));
  theta.forEach(t=>{let s=0;for(const v of xs)s+=Math.log1p(-t*v);const k=-s/n;lth.push(n*(Math.log(t/k)+k-1));});
  const w=lth.map(l=>1/lth.reduce((s,l2)=>s+Math.exp(l2-l),0));let th=0;theta.forEach((t,j)=>th+=t*w[j]);let ks=0;for(const v of xs)ks+=Math.log1p(-th*v);const k=-ks/n,sigma=k/th;
  const kHat=(n*k+10*0.5)/(n+10);return {k:kHat,sigma:sigma};}
function qgpd(p,k,sigma){return sigma*(Math.pow(1-p,-k)-1)/k;}
function psisLoo(ll){const S=ll.length,N=ll[0].length,M=Math.min(Math.floor(0.2*S),Math.ceil(3*Math.sqrt(S)));const elpd=new Array(N),ks=new Array(N);let lpd=0;
  for(let i=0;i<N;i++){const lr=new Array(S);let mx=-Infinity;for(let s=0;s<S;s++){lr[s]=-ll[s][i];if(lr[s]>mx)mx=lr[s];}const w=lr.map(v=>Math.exp(v-mx)),ord=w.map((_,s)=>s).sort((a,b)=>w[a]-w[b]);
    const cut=w[ord[S-M-1]],tail=ord.slice(S-M);let kk=Infinity;
    if(cut>0){const exc=tail.map(s=>w[s]-cut);const f=gpdFit(exc);kk=f.k;if(isFinite(f.k)&&isFinite(f.sigma)&&f.sigma>0){tail.forEach((s,j)=>{w[s]=Math.min(cut+qgpd((j+0.5)/M,f.k,f.sigma),Math.max.apply(null,w));});}}
    const wbar=w.reduce((a,b)=>a+b,0)/S,cap=Math.pow(S,0.75)*wbar;for(let s=0;s<S;s++)w[s]=Math.min(w[s],cap);
    let num=0,den=0,mll=-Infinity;for(let s=0;s<S;s++)if(ll[s][i]>mll)mll=ll[s][i];for(let s=0;s<S;s++){num+=w[s]*Math.exp(ll[s][i]-mll);den+=w[s];}
    elpd[i]=Math.log(num/den)+mll;ks[i]=kk;let l1=0;for(let s=0;s<S;s++)l1+=Math.exp(ll[s][i]-mll);lpd+=Math.log(l1/S)+mll;}
  const tot=elpd.reduce((a,b)=>a+b,0),m=tot/N,se=Math.sqrt(N*elpd.reduce((a,b)=>a+(b-m)*(b-m),0)/(N-1));return {elpd:tot,se:se,pointwise:elpd,k:ks,p_loo:lpd-tot};}
/* HMC with a fixed number of leapfrog steps, step-size adaptation during warm-up, and divergence detection.
   logp(q) and grad(q) on an unconstrained space. */
function hmc(logp,grad,q0,o){o=o||{};const r=rng(o.seed||1),nIter=o.n||1000,warm=o.warmup||500,L=o.L||15;let eps=o.eps||0.2,q=q0.slice(),lp=logp(q),g=grad(q);const out=[],div=[];let acc=0;
  for(let it=0;it<nIter;it++){let p=q.map(()=>gauss(r)),qn=q.slice(),gn=g.slice();const H0=-lp+0.5*p.reduce((s,v)=>s+v*v,0);let divergent=false,lpn=lp;
    for(let l=0;l<L;l++){p=p.map((v,i)=>v+eps/2*gn[i]);qn=qn.map((v,i)=>v+eps*p[i]);gn=grad(qn);p=p.map((v,i)=>v+eps/2*gn[i]);lpn=logp(qn);if(!isFinite(lpn)||(-lpn+0.5*p.reduce((s,v)=>s+v*v,0))-H0>1000){divergent=true;break;}}
    const H1=divergent?Infinity:-lpn+0.5*p.reduce((s,v)=>s+v*v,0),a=Math.min(1,Math.exp(H0-H1));
    if(!divergent&&r()<a){q=qn;lp=lpn;g=gn;}
    if(it<warm){eps*=Math.exp(0.05*(a-0.8));}else{acc+=a;out.push(q.slice());div.push(divergent);}}
  return {draws:out,divergent:div,eps:eps,acc:acc/Math.max(1,nIter-warm)};}
const api={bRng:rng,bGauss:gauss,bGamma:rgamma,bChol:chol,bCholSolve:cholSolve,bInv:inv,bLogdet:logdet,rmvnPrec:rmvnPrec,rmvn:rmvn,eigSym:eigSym,bPnorm:pnorm,bQnorm:qnorm,rtruncnorm:rtruncnorm,psisLoo:psisLoo,hmc:hmc};
if(typeof module!=="undefined")module.exports=api;else Object.assign(root,api);
})(typeof window!=="undefined"?window:this);
