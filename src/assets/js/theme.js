const root=document.documentElement
const labels={light:'Tema claro',dark:'Tema escuro'}
const continuousAnimations='animate[repeatcount="indefinite"],animateTransform[repeatcount="indefinite"]'
const originalBegins=new WeakMap()

export function syncContinuousMotion(animations,reduced){
  for(const animation of animations){
    if(reduced){
      if(!originalBegins.has(animation))originalBegins.set(animation,animation.getAttribute('begin'))
      animation.setAttribute('begin','indefinite')
      animation.endElement?.()
    }else if(originalBegins.has(animation)){
      const begin=originalBegins.get(animation)
      if(begin===null)animation.removeAttribute('begin')
      else animation.setAttribute('begin',begin)
      animation.beginElement?.()
      originalBegins.delete(animation)
    }
  }
}

function initContinuousMotion(){
  const preference=matchMedia('(prefers-reduced-motion: reduce)')
  const sync=()=>syncContinuousMotion(document.querySelectorAll(continuousAnimations),preference.matches)
  sync()
  preference.addEventListener?.('change',sync)
  new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length))sync()
  }).observe(document.documentElement,{childList:true,subtree:true})
}

export function announce(message){
  const element=document.getElementById('announcer')
  if(!element)return
  element.textContent=''
  setTimeout(()=>{element.textContent=message},30)
}

export function initTheme(){
  initContinuousMotion()
  const button=document.getElementById('themeToggle')
  const iconHost=document.getElementById('themeIcon')
  if(!button||!iconHost)return
  const moonTemplate=document.getElementById('themeIconMoon')
  const sunTemplate=document.getElementById('themeIconSun')
  const systemDark=matchMedia('(prefers-color-scheme: dark)')
  const effectiveTheme=()=>root.dataset.theme==='system'?(systemDark.matches?'dark':'light'):(root.dataset.theme||'light')
  const renderThemeIcon=current=>{
    const template=current==='dark'?sunTemplate:moonTemplate
    if(template instanceof HTMLTemplateElement)iconHost.replaceChildren(template.content.cloneNode(true))
  }
  const update=()=>{
    const current=effectiveTheme()
    const next=current==='dark'?'claro':'escuro'
    button.dataset.currentTheme=current
    renderThemeIcon(current)
    button.title=`Mudar para tema ${next}`
    button.setAttribute('aria-label',`Tema atual: ${current==='dark'?'escuro':'claro'}. Mudar para ${next}`)
  }
  const apply=next=>{
    root.classList.add('theme-switching')
    root.dataset.theme=next
    try{localStorage.setItem('lfad.theme',next)}catch(error){}
    update()
    document.dispatchEvent(new Event('site:themechange'))
    announce(labels[next])
    requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('theme-switching')))
  }
  update()
  button.addEventListener('click',()=>apply(effectiveTheme()==='dark'?'light':'dark'))
  systemDark.addEventListener?.('change',()=>{
    if(root.dataset.theme!=='system')return
    update()
    document.dispatchEvent(new Event('site:themechange'))
  })
}
