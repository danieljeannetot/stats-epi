/* playground.js — "Try it" model playgrounds.
   A playground is registered with PG.add({...}) (see playground-specs-*.js) and mounted wherever
   <div class="pg-mount" data-pg="ID"></div> appears: under a model in a lesson, or on the playground page.
   Each knob has three zones: impossible (outside `valid`, red), possible but beyond the data or evidence
   (outside `ok`, amber) and plausible (inside `ok`, green). */
(function(){
const SPECS={},ORDER=[];
const esc=s=>String(s);
function zoneOf(k,v){if(!isFinite(v))return "red";if(k.integer&&Math.abs(v-Math.round(v))>1e-9)return "red";if(k.valid&&(v<k.valid[0]||v>k.valid[1]))return "red";if(k.ok&&(v<k.ok[0]||v>k.ok[1]))return "amber";return "green";}
const ZTXT={red:"impossible",amber:"possible, but beyond the data or evidence",green:"plausible"};
function why(k,z,v){if(z==="red"&&k.integer&&Math.abs(v-Math.round(v))>1e-9)return "impossible: must be a whole number";return (k.why&&k.why[z])||ZTXT[z];}
function track(k){/* slider background showing the three zones */const lo=k.min,hi=k.max,p=v=>Math.max(0,Math.min(100,100*(v-lo)/(hi-lo)));const vr=k.valid||[lo,hi],ok=k.ok||vr,R="var(--pg-red)",A="var(--pg-amber)",G="var(--pg-green)";
  const st=[[0,vr[0]>lo?R:A],[p(vr[0]),A],[p(ok[0]),G],[p(ok[1]),A],[p(vr[1]),vr[1]<hi?R:A]];let g=[];st.forEach((s,i)=>{const nx=i+1<st.length?st[i+1][0]:100;g.push(s[1]+" "+s[0]+"%",s[1]+" "+nx+"%");});return "linear-gradient(90deg,"+g.join(",")+")";}
function fmtNum(v,d){if(!isFinite(v))return "—";if(v===0)return "0";const a=Math.abs(v);if(d===undefined)d=a>=100?0:a>=10?1:a>=1?2:3;return v.toLocaleString("en-GB",{minimumFractionDigits:d,maximumFractionDigits:d}).replace("-","−");}
window.PG={add(spec){SPECS[spec.id]=spec;ORDER.push(spec.id);},specs:SPECS,order:ORDER,fmt:fmtNum,
  mount(el,id,open){const S=SPECS[id];if(!S)return;el.innerHTML="";
    const btn=document.createElement("button");btn.type="button";btn.className="pg-open";btn.innerHTML="▸ Try it: "+S.title;
    const box=document.createElement("div");box.className="pg-box";box.hidden=true;el.appendChild(btn);el.appendChild(box);let built=false;
    const toggle=()=>{box.hidden=!box.hidden;btn.innerHTML=(box.hidden?"▸ Try it: ":"▾ Try it: ")+S.title;if(!built&&!box.hidden){build(box,S);built=true;}};
    btn.addEventListener("click",toggle);if(open)toggle();}};
function build(box,S){const ctx=S.setup?S.setup():{};const knobs=[].concat((S.inputs?S.inputs(ctx):[]).map(k=>Object.assign({kind:"in"},k)),(S.params?S.params(ctx):[]).map(k=>Object.assign({kind:"par"},k)));
  const v={};knobs.forEach(k=>v[k.key]=k.value);
  box.innerHTML="<p class='pg-intro'>"+(S.intro||"")+"</p><div class='pg-grid'><div class='pg-knobs'></div><div class='pg-out'><div class='pg-eq'></div><div class='pg-res'></div><svg class='pg-svg' viewBox='0 0 520 230' role='img' aria-label='Model curve'></svg><div class='pg-legend small'><span class='pg-sw r'></span>impossible <span class='pg-sw a'></span>beyond the data or evidence <span class='pg-sw g'></span>plausible</div></div></div>";
  const kd=box.querySelector(".pg-knobs");
  [["in","Inputs: describe a case"],["par","Parameters: change the model"]].forEach(([kind,head])=>{const ks=knobs.filter(k=>k.kind===kind);if(!ks.length)return;const h=document.createElement("h5");h.textContent=head;kd.appendChild(h);
    ks.forEach(k=>{const row=document.createElement("div");row.className="pg-k";
      row.innerHTML="<div class='pg-kl'><label>"+k.label+"</label><input type='number' class='pg-num' step='any'><span class='pg-u'>"+(k.unit||"")+"</span></div><input type='range' class='pg-rng' min='"+k.min+"' max='"+k.max+"' step='"+(k.step||(k.max-k.min)/200)+"'><div class='pg-z'></div>";
      const rng=row.querySelector(".pg-rng"),num=row.querySelector(".pg-num"),zz=row.querySelector(".pg-z"),st=k.step||(k.max-k.min)/200,dec=st>=1?0:Math.min(5,Math.ceil(-Math.log10(st))+(String(st).replace(/^.*\./,"").length>Math.ceil(-Math.log10(st))?1:0)),show=x=>+(+x).toFixed(dec);rng.style.background=track(k);rng.value=v[k.key];num.value=show(v[k.key]);
      const set=x=>{v[k.key]=x;const z=zoneOf(k,x);zz.className="pg-z "+z;zz.textContent=why(k,z,x);update();};
      rng.addEventListener("input",()=>{num.value=show(rng.value);set(+rng.value);});num.addEventListener("change",()=>{const x=parseFloat(num.value);if(isFinite(x)){rng.value=Math.max(k.min,Math.min(k.max,x));set(x);}});
      k._sync=()=>{rng.value=v[k.key];num.value=show(v[k.key]);const z=zoneOf(k,v[k.key]);zz.className="pg-z "+z;zz.textContent=why(k,z,v[k.key]);};kd.appendChild(row);});});
  const rb=document.createElement("button");rb.type="button";rb.className="pg-reset";rb.textContent="reset to the values fitted to the course data";rb.addEventListener("click",()=>{knobs.forEach(k=>{v[k.key]=k.value;k._sync();});update();});kd.appendChild(rb);
  const eqEl=box.querySelector(".pg-eq"),resEl=box.querySelector(".pg-res"),svg=box.querySelector(".pg-svg");
  function update(){let r;try{r=S.compute(v,ctx);}catch(e){r={lines:["(cannot compute: "+e.message+")"],out:[]};}
    eqEl.innerHTML=(r.lines||[]).map(l=>"<div>"+l+"</div>").join("");
    resEl.innerHTML=(r.out||[]).map(o=>"<div class='pg-o "+(o.z||"green")+"'><span>"+o.label+"</span><b>"+o.value+"</b>"+(o.msg?"<em>"+o.msg+"</em>":"")+"</div>").join("");
    if(S.curve)drawCurve(svg,S.curve(ctx,v),v);else svg.style.display="none";}
  knobs.forEach(k=>k._sync());update();}
const tick=t=>String(+(+t).toPrecision(6)).replace("-","−");
function drawCurve(svg,C,v){while(svg.firstChild)svg.removeChild(svg.firstChild);const W=520,H=230,m={l:52,r:12,t:14,b:38},xs=[],N=200;
  for(let i=0;i<=N;i++)xs.push(C.x0+(C.x1-C.x0)*i/N);const ys=xs.map(x=>{try{return C.f(x);}catch(e){return NaN;}});
  const fin=ys.filter(isFinite);let y0=C.y0!==undefined?C.y0:Math.min.apply(null,fin.concat([0])),y1=C.y1!==undefined?C.y1:Math.max.apply(null,fin.concat([1e-9]));if(y1-y0<1e-9)y1=y0+1;
  const X=x=>m.l+(W-m.l-m.r)*(x-C.x0)/(C.x1-C.x0),Y=y=>H-m.b-(H-m.t-m.b)*(Math.max(y0,Math.min(y1,y))-y0)/(y1-y0),NS="http://www.w3.org/2000/svg",mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);svg.appendChild(e);return e;};
  const sh=(a,b,cls)=>{if(b<=a)return;mk("rect",{x:X(a),y:m.t,width:X(b)-X(a),height:H-m.t-m.b,class:cls});};
  if(C.valid){sh(C.x0,Math.max(C.x0,C.valid[0]),"pg-bg-r");sh(Math.min(C.x1,C.valid[1]),C.x1,"pg-bg-r");}
  if(C.data){sh(Math.max(C.x0,C.valid?C.valid[0]:C.x0),Math.max(C.x0,C.data[0]),"pg-bg-a");sh(Math.min(C.x1,C.data[1]),Math.min(C.x1,C.valid?C.valid[1]:C.x1),"pg-bg-a");}
  if(C.yValid){if(C.yValid[0]>y0)mk("rect",{x:m.l,y:Y(C.yValid[0]),width:W-m.l-m.r,height:Y(y0)-Y(C.yValid[0]),class:"pg-bg-r"});if(C.yValid[1]<y1)mk("rect",{x:m.l,y:Y(y1),width:W-m.l-m.r,height:Y(C.yValid[1])-Y(y1),class:"pg-bg-r"});}
  const ticks=(a,b,n)=>{const s=Math.pow(10,Math.floor(Math.log10((b-a)/n))),u=[1,2,5,10].map(q=>q*s).find(q=>(b-a)/q<=n)||s*10,o=[];for(let t=Math.ceil(a/u)*u;t<=b+1e-9;t+=u)o.push(+t.toFixed(10));return o;};
  ticks(y0,y1,4).forEach(t=>{mk("line",{x1:m.l,x2:W-m.r,y1:Y(t),y2:Y(t),class:"pg-grid"});mk("text",{x:m.l-6,y:Y(t)+4,"text-anchor":"end",class:"pg-t"}).textContent=C.fy?C.fy(t):tick(t);});
  ticks(C.x0,C.x1,6).forEach(t=>{mk("text",{x:X(t),y:H-m.b+15,"text-anchor":"middle",class:"pg-t"}).textContent=C.fx?C.fx(t):tick(t);});
  mk("text",{x:(m.l+W-m.r)/2,y:H-4,"text-anchor":"middle",class:"pg-t"}).textContent=C.xlab||"";mk("text",{x:m.l,y:10,class:"pg-t"}).textContent=C.ylab||"";
  if(C.rug)C.rug.forEach(x=>{if(x>=C.x0&&x<=C.x1)mk("line",{x1:X(x),x2:X(x),y1:H-m.b,y2:H-m.b-6,class:"pg-rug"});});
  (C.extra||[]).forEach(e=>{const pts=xs.map(x=>X(x)+","+Y(e.f(x))).join(" ");mk("polyline",{points:pts,class:"pg-line2"});});
  let path="";xs.forEach((x,i)=>{if(isFinite(ys[i]))path+=(path?"L":"M")+X(x).toFixed(1)+","+Y(ys[i]).toFixed(1);});mk("path",{d:path,class:"pg-line"});
  if(C.at!==undefined&&isFinite(C.at)){const yy=C.f(C.at),xi=Math.max(C.x0,Math.min(C.x1,C.at));mk("line",{x1:X(xi),x2:X(xi),y1:m.t,y2:H-m.b,class:"pg-cur"});if(isFinite(yy))mk("circle",{cx:X(xi),cy:Y(yy),r:6,class:"pg-pt"});}}
document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".pg-mount").forEach(el=>PG.mount(el,el.dataset.pg,el.dataset.open==="1"));
  const sel=document.getElementById("pgSelect"),host=document.getElementById("pgHost");
  if(sel&&host){/* standalone page */const groups={};ORDER.forEach(id=>{const s=SPECS[id];(groups[s.lesson]=groups[s.lesson]||[]).push(s);});
    sel.innerHTML=Object.keys(groups).map(L=>"<optgroup label='"+L+"'>"+groups[L].map(s=>"<option value='"+s.id+"'>"+s.title+"</option>").join("")+"</optgroup>").join("");
    const show=id=>{if(!SPECS[id])return;sel.value=id;host.innerHTML="";const d=document.createElement("div");d.className="pg-mount";host.appendChild(d);PG.mount(d,id,true);const s=SPECS[id];document.getElementById("pgLink").innerHTML=s.href?"From <a href='"+s.href+"'>"+s.lesson+"</a>":"";};
    sel.addEventListener("change",()=>{location.hash=sel.value;});window.addEventListener("hashchange",()=>show(decodeURIComponent(location.hash.slice(1))));
    show(decodeURIComponent(location.hash.slice(1))||ORDER[0]);}});
})();
