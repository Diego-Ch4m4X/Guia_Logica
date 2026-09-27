const navToggle=document.getElementById('homeNavToggle');
const navPanel=document.getElementById('homeNavPanel');

function setNavOpen(open,{focus=false}={}){
  if(!navToggle||!navPanel)return;
  navToggle.setAttribute('aria-expanded',open?'true':'false');
  navPanel.hidden=!open;
  if(open&&focus)navPanel.querySelector('a')?.focus();
}

if(navToggle&&navPanel){
  navToggle.addEventListener('click',()=>setNavOpen(navToggle.getAttribute('aria-expanded')!=='true'));
  navPanel.addEventListener('click',event=>{if(event.target.closest('a'))setNavOpen(false)});
  document.addEventListener('click',event=>{if(navToggle.getAttribute('aria-expanded')==='true'&&!event.target.closest('#homeNavToggle')&&!event.target.closest('#homeNavPanel'))setNavOpen(false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navToggle.getAttribute('aria-expanded')==='true'){setNavOpen(false);navToggle.focus()}});
}

function initHomeTabs(){
  const group=document.querySelector('[data-home-tabs]');
  if(!group)return;
  const tabs=[...group.querySelectorAll('[role="tab"]')];
  const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
  const activate=(tab,{focus=false,updateHash=false}={})=>{
    tabs.forEach((item,index)=>{
      const active=item===tab;
      item.setAttribute('aria-selected',active?'true':'false');
      item.tabIndex=active?0:-1;
      if(panels[index])panels[index].hidden=!active;
    });
    if(focus)tab.focus();
    if(updateHash)history.replaceState(null,'',`#${tab.id}`);
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      let target=null;
      if(event.key==='ArrowRight')target=tabs[(index+1)%tabs.length];
      if(event.key==='ArrowLeft')target=tabs[(index-1+tabs.length)%tabs.length];
      if(event.key==='Home')target=tabs[0];
      if(event.key==='End')target=tabs[tabs.length-1];
      if(target){event.preventDefault();tabs.forEach(item=>item.tabIndex=item===target?0:-1);target.focus();return;}
      if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(tab,{focus:true});}
    });
  });
  const activateForTarget=()=>{
    let id;
    try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    if(!id)return;
    const target=document.getElementById(id);
    if(!target)return;
    const directTab=tabs.find(tab=>tab.id===id);
    if(directTab){activate(directTab);requestAnimationFrame(()=>document.getElementById('06-os-35-tópicos')?.scrollIntoView({block:'start'}));return;}
    const panel=target.closest?.('[role="tabpanel"]');
    if(panel){
      const tab=tabs.find(item=>item.getAttribute('aria-controls')===panel.id);
      if(tab){
        activate(tab);
        requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
      }
    }
  };
  activateForTarget();
  addEventListener('hashchange',activateForTarget);
  document.querySelectorAll('.curriculum-overview a[href^="#topics-tab-"]').forEach(link=>link.addEventListener('click',()=>setTimeout(activateForTarget,0)));
}
initHomeTabs();

const sectionLinks=[...document.querySelectorAll('[data-home-nav-link]')];
const tracked=sectionLinks.map(link=>({link,target:document.getElementById(decodeURIComponent(link.hash.slice(1)))})).filter(item=>item.target);
let ticking=false;
function updateHomeNavigation(){
  ticking=false;
  if(!tracked.length)return;
  const offset=(document.getElementById('siteHeader')?.offsetHeight||52)+80;
  let current=tracked[0];
  for(const item of tracked){if(item.target.getBoundingClientRect().top<=offset)current=item;else break;}
  tracked.forEach(item=>{if(item===current)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current')});
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateHomeNavigation)}},{passive:true});
addEventListener('resize',updateHomeNavigation,{passive:true});
updateHomeNavigation();
