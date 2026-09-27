import { initTheme } from './theme.js?v=1.1.2';
import { initSearch } from './search.js?v=1.1.2';
import { initTopic } from './topic.js?v=1.1.2';
import { initCodeBlocks } from './code.js?v=1.1.2';
import { initSyntaxHighlighting } from './highlight-loader.js?v=1.1.2';
import { initMermaid } from './mermaid-loader.js?v=1.1.2';
import { initTabs } from './tabs.js?v=1.1.2';
import { initChecklists } from './checklists.js?v=1.1.2';
const header=document.getElementById('siteHeader'),backTop=document.getElementById('backTop');
function onScroll(){header?.classList.toggle('compact',window.scrollY>90);backTop?.classList.toggle('visible',window.scrollY>500)}
addEventListener('scroll',onScroll,{passive:true});onScroll();backTop?.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
initTheme();initSearch();initTopic();initCodeBlocks();initSyntaxHighlighting();initTabs();initChecklists();initMermaid();
