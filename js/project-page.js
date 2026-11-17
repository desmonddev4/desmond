(()=>{
const $=s=>document.querySelector(s),esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const want=new URLSearchParams(location.search).get('id')||'0';
const safeLink=u=>/^https?:\/\//i.test(u||'')?u:'';
let shown=null;
const draw=()=>{
  const W=window.WORKS||[];
  if(!W.length){
    if(NSTProjects.live&&!shown)return;
    if(shown!=='empty'){
      shown='empty';document.title='Projects | Desmond Amedzie';
      $('#pt').textContent='Projects coming soon';$('#pd').textContent='New project case studies will appear here once they are added.';
      $('.sec').hidden=true;
    }
    return;
  }
  if(shown==='empty'){shown=null;$('.sec').hidden=false}
  let id=W.findIndex(w=>String(w.id)===want);
  if(id<0){ if(!NSTProjects.live||!/^p/.test(want)||shown==='miss'){ id=0 } else { return } }   // custom project not loaded yet: wait for the next nst:projects
  const w=W[id]; if(!w) return; shown=String(w.id);
  document.title=w.t+' | Desmond Amedzie';$('#pt').textContent=w.t;$('#pd').textContent=w.d;
  $('#shot').src=NSTProjects.imgOf(w);$('#shot').alt=w.t;
  if(w.custom){NSTProjects.full(w.id).then(b=>{if(b&&shown===String(w.id))$('#shot').src=b})}
  $('#mc').textContent=w.client||'Private client';$('#mr').textContent=w.role||'Developer';$('#my').textContent=w.year;
  $('#ms').innerHTML=(w.stack||[]).map(s=>'<span class="chip">'+esc(s)+'</span>').join('');
  $('#sb').textContent=w.brief||w.d;$('#sw').textContent=w.built||'';$('#sr').textContent=w.result||'';
  const lv=safeLink(w.live),a=$('#live');if(lv){a.href=lv;a.style.display=''}else{a.style.display='none'}
  const pv=safeLink(w.prototypeUrl),pa=$('#prototype');if(pv){pa.href=pv;pa.style.display=''}else{pa.style.display='none'}
  const n=(o,l)=>{const x=W[(id+o+W.length)%W.length];return '<a class="pnc" href="project.html?id='+encodeURIComponent(x.id)+'"><img src="'+esc(NSTProjects.imgOf(x))+'" alt=""><span><small>'+l+'</small><b>'+esc(x.t)+'</b></span></a>'};
  $('#pn').innerHTML=n(-1,'Previous project')+n(1,'Next project');
};
draw();document.addEventListener('nst:projects',draw);
setTimeout(()=>{ if(!shown){shown='miss';draw()} },4000);
})();
