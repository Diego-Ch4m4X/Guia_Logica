function scrollBehavior(){return matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}
function escapeHTML(value){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function textOf(element){return element?.textContent?.replace(/\s+/g,' ').trim()||''}

export function initTopic(){
  const body=document.body
  if(!document.querySelector('.page-shell'))return

  const guideKey='lfad.guideCollapsed'
  const tocKey='lfad.tocCollapsed'
  const readSession=key=>{try{return sessionStorage.getItem(key)}catch{return null}}
  const writeSession=(key,value)=>{try{sessionStorage.setItem(key,value)}catch{}}
  const setGuide=collapsed=>{body.classList.toggle('guide-collapsed',collapsed);writeSession(guideKey,collapsed?'1':'0')}
  const setToc=collapsed=>{body.classList.toggle('toc-collapsed',collapsed);writeSession(tocKey,collapsed?'1':'0')}
  if(readSession(guideKey)==='1')setGuide(true)
  if(readSession(tocKey)==='1')setToc(true)
  document.getElementById('collapseGuide')?.addEventListener('click',()=>{setGuide(true);document.getElementById('reopenGuide')?.focus()})
  document.getElementById('reopenGuide')?.addEventListener('click',()=>{setGuide(false);document.getElementById('collapseGuide')?.focus()})
  document.getElementById('collapseToc')?.addEventListener('click',()=>{setToc(true);document.getElementById('reopenToc')?.focus()})
  document.getElementById('reopenToc')?.addEventListener('click',()=>{setToc(false);document.getElementById('collapseToc')?.focus()})

  const allHeads=[...document.querySelectorAll('.article-body h2[id],.article-body h3[id],.article-body h4[id]')]
  const guideLinks=[...document.querySelectorAll('#guidePanel .guide-item[href],#guidePanel .guide-subitem[href],#guideDrawer .guide-item[href],#guideDrawer .guide-subitem[href]')]
  const tocLists=[document.getElementById('dynamicToc'),document.getElementById('dynamicTocDrawer')]
  const collapsedDisclosureIcon=document.getElementById('guideDisclosureCollapsed')
  const expandedDisclosureIcon=document.getElementById('guideDisclosureExpanded')
  let activeNav=''
  let activeTocChapter=''

  const visibleHeads=()=>allHeads.filter(head=>!head.closest('[role="tabpanel"][hidden]'))
  // LABs and exercises use positioned wrappers. offsetTop would then be relative
  // to each wrapper, so scroll tracking must compare document-space coordinates.
  const documentTop=element=>element.getBoundingClientRect().top+window.scrollY
  const chapterFor=(head,heads,positions)=>{
    const visibleChapters=heads.filter(item=>item.matches('.chapter-title[id]'))
    if(!head||!visibleChapters.length)return null
    const headTop=positions.get(head)
    if(headTop<positions.get(visibleChapters[0]))return null
    let chapter=visibleChapters[0]
    for(const item of visibleChapters)if(positions.get(item)<=headTop)chapter=item
    return chapter
  }
  const navHeadFor=(current,heads,positions)=>{
    const navigationHeads=heads.filter(head=>head.matches('h2[id],h3[id]'))
    const readingStart=window.scrollY+125
    if(!current||!navigationHeads.length||readingStart<positions.get(navigationHeads[0]))return null
    let selected=navigationHeads[0]
    const currentTop=positions.get(current)
    for(const head of navigationHeads)if(positions.get(head)<=currentTop)selected=head
    return selected
  }
  const buildToc=chapter=>{
    if(!chapter){tocLists.forEach(list=>{if(list)list.innerHTML='' });return}
    const heads=visibleHeads()
    const start=heads.indexOf(chapter)
    const items=[]
    for(let index=start+1;index<heads.length;index+=1){
      const head=heads[index]
      if(head.matches('.chapter-title[id]'))break
      if(head.matches('h3[id],h4[id]'))items.push(head)
    }
    const markup=items.map(head=>`<li><a class="${head.tagName==='H4'?'level-3':''}" href="#${encodeURIComponent(head.id)}">${escapeHTML(textOf(head))}</a></li>`).join('')||`<li><a href="#${encodeURIComponent(chapter.id)}">${escapeHTML(textOf(chapter))}</a></li>`
    tocLists.forEach(list=>{if(list)list.innerHTML=markup})
  }
  const keepVisible=link=>{
    const panel=document.getElementById('guidePanel')
    const scroller=panel?.querySelector('.panel-scroll')
    if(!link||!scroller)return
    const top=scroller.getBoundingClientRect().top
    const bottom=scroller.getBoundingClientRect().bottom
    const rect=link.getBoundingClientRect()
    if(rect.top<top+16)scroller.scrollTo({top:scroller.scrollTop+rect.top-top-16,behavior:scrollBehavior()})
    if(rect.bottom>bottom-16)scroller.scrollTo({top:scroller.scrollTop+rect.bottom-bottom+16,behavior:scrollBehavior()})
  }
  const setBranchExpanded=(branch,expanded)=>{
    const disclosure=branch?.querySelector('.guide-disclosure')
    const subtree=branch?.querySelector(':scope > .guide-subtree')
    if(!disclosure||!subtree)return
    disclosure.setAttribute('aria-expanded',String(expanded))
    subtree.hidden=!expanded
    const mark=disclosure.querySelector('.guide-disclosure-mark')
    const icon=expanded?collapsedDisclosureIcon:expandedDisclosureIcon
    if(mark&&icon instanceof HTMLTemplateElement)mark.replaceChildren(icon.content.cloneNode(true))
    const label=disclosure.querySelector('.sr-only')
    if(label)label.textContent=`${expanded?'Recolher':'Expandir'} subtópicos de ${textOf(branch.querySelector('.guide-item'))}`
  }
  document.querySelectorAll('.guide-disclosure').forEach(disclosure=>disclosure.addEventListener('click',()=>{
    const branch=disclosure.closest('.guide-branch')
    setBranchExpanded(branch,disclosure.getAttribute('aria-expanded')!=='true')
  }))
  document.querySelectorAll('.guide-branch').forEach(branch=>setBranchExpanded(branch,false))
  const syncGuideBranches=activeId=>{
    const activeBranches=new Set(
      guideLinks
        .filter(link=>link.getAttribute('href')===`#${activeId}`)
        .map(link=>link.closest('.guide-branch'))
        .filter(Boolean)
    )
    document.querySelectorAll('.guide-branch').forEach(branch=>setBranchExpanded(branch,activeBranches.has(branch)))
  }
  guideLinks.forEach(link=>link.addEventListener('click',()=>{
    const destination=link.getAttribute('href')?.slice(1)||''
    syncGuideBranches(destination)
  }))
  const setActiveNav=head=>{
    const id=head?.id||''
    if(id===activeNav)return
    activeNav=id
    guideLinks.forEach(link=>{
      const active=Boolean(id)&&link.getAttribute('href')===`#${id}`
      link.classList.toggle('active',active)
      if(active)link.setAttribute('aria-current','location')
      else link.removeAttribute('aria-current')
    })
    const panelLink=[...document.querySelectorAll('#guidePanel a[href]')].find(link=>link.getAttribute('href')===`#${id}`)
    syncGuideBranches(id)
    keepVisible(panelLink)
  }
  const update=()=>{
    const heads=visibleHeads()
    if(!heads.length)return
    const positions=new Map(heads.map(head=>[head,documentTop(head)]))
    const y=window.scrollY+125
    let current=heads[0]
    for(const head of heads)if(positions.get(head)<=y)current=head

    setActiveNav(navHeadFor(current,heads,positions))
    const chapter=chapterFor(current,heads,positions)
    const chapterId=chapter?.id||''
    if(chapterId!==activeTocChapter){activeTocChapter=chapterId;buildToc(chapter)}
    document.querySelectorAll('.page-toc-list a').forEach(link=>{
      const active=link.getAttribute('href')===`#${current.id}`
      link.classList.toggle('active',active)
      if(active)link.setAttribute('aria-current','location')
      else link.removeAttribute('aria-current')
    })
    const context=document.getElementById('headerContext')
    if(context)context.textContent=textOf(current)
  }
  let updateScheduled=false
  const scheduleUpdate=()=>{
    if(updateScheduled)return
    updateScheduled=true
    requestAnimationFrame(()=>{updateScheduled=false;update()})
  }
  addEventListener('scroll',scheduleUpdate,{passive:true})
  addEventListener('resize',scheduleUpdate)
  document.addEventListener('tabs:change',scheduleUpdate)
  update()

  const backdrop=document.getElementById('drawerBackdrop')
  const guideDrawer=document.getElementById('guideDrawer')
  const tocDrawer=document.getElementById('tocDrawer')
  let returnFocus=null
  let activeDrawer=null
  const focusables=drawer=>[...drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element=>!element.closest('[hidden],[inert]'))
  const openDrawer=(drawer,trigger)=>{
    if(!drawer||!backdrop)return
    returnFocus=trigger
    activeDrawer=drawer
    drawer.inert=false
    backdrop.classList.add('open')
    drawer.classList.add('open')
    drawer.setAttribute('aria-hidden','false')
    body.style.overflow='hidden'
    focusables(drawer)[0]?.focus()
  }
  const closeDrawers=()=>{
    ;[guideDrawer,tocDrawer].forEach(drawer=>{
      if(!drawer)return
      drawer.classList.remove('open')
      drawer.setAttribute('aria-hidden','true')
      drawer.inert=true
    })
    backdrop?.classList.remove('open')
    body.style.overflow=''
    activeDrawer=null
    returnFocus?.focus()
    returnFocus=null
  }
  document.getElementById('mobileMenu')?.addEventListener('click',event=>openDrawer(guideDrawer,event.currentTarget))
  document.getElementById('openGuideDrawer')?.addEventListener('click',event=>openDrawer(guideDrawer,event.currentTarget))
  document.getElementById('openTocDrawer')?.addEventListener('click',event=>openDrawer(tocDrawer,event.currentTarget))
  document.querySelectorAll('#guideDrawer .drawer-close,#tocDrawer .drawer-close,#guideDrawer a,#tocDrawer a').forEach(element=>element.addEventListener('click',closeDrawers))
  backdrop?.addEventListener('click',closeDrawers)
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&activeDrawer){closeDrawers();return}
    if(event.key!=='Tab'||!activeDrawer)return
    const items=focusables(activeDrawer)
    if(!items.length)return
    const first=items[0],last=items.at(-1)
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  })
}
