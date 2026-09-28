import { initCodeBlocks } from './code.js?v=__ASSET_VERSION__';

export function initTabs(){
  const groups=[...document.querySelectorAll('[data-tabs]')];
  const activateForHash=()=>{
    let targetId;
    try{targetId=decodeURIComponent(location.hash.slice(1));}catch{return;}
    if(!targetId)return;
    for(const group of groups){
      const panel=[...group.querySelectorAll('[role="tabpanel"]')].find(item=>item.id===targetId||item.querySelector(`#${CSS.escape(targetId)}`));
      if(panel){group.querySelector(`[role="tab"][aria-controls="${panel.id}"]`)?.click();requestAnimationFrame(()=>document.getElementById(targetId)?.scrollIntoView({block:'start'}));return;}
    }
  };
  groups.forEach(group=>{
    if(group.dataset.ready)return;group.dataset.ready='1';
    const tabs=[...group.querySelectorAll('[role="tab"]')];
    const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
    const activate=(tab,focus=false)=>{
      tabs.forEach((item,index)=>{const active=item===tab;item.setAttribute('aria-selected',active?'true':'false');item.tabIndex=active?0:-1;if(panels[index])panels[index].hidden=!active;});
      if(focus)tab.focus();
      requestAnimationFrame(initCodeBlocks);
      document.dispatchEvent(new Event('tabs:change'));
    };
    tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>activate(tab));
      tab.addEventListener('keydown',event=>{let target=null;if(event.key==='ArrowRight')target=tabs[(index+1)%tabs.length];if(event.key==='ArrowLeft')target=tabs[(index-1+tabs.length)%tabs.length];if(event.key==='Home')target=tabs[0];if(event.key==='End')target=tabs[tabs.length-1];if(target){event.preventDefault();activate(target,true);}});
    });
  });
  activateForHash();addEventListener('hashchange',activateForHash);
}
