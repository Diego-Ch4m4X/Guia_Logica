const languages=new Set(['bash','java','javascript','python']);
let loader;

function loadScript(url,timeout=5000){
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    let done=false;
    const finish=(error)=>{
      if(done)return;
      done=true;
      clearTimeout(timer);
      if(error){script.remove();reject(error)}else resolve(window.hljs);
    };
    const timer=setTimeout(()=>finish(new Error('Tempo esgotado ao carregar o destaque de sintaxe')),timeout);
    script.src=url;
    if(url.startsWith('https://cdnjs.cloudflare.com/')){
      script.integrity='sha384-wjfDDhOPPdjtva8vWBhWeVprSpmxisEu5aYT3q1JyACqXpdKpo3PWZTMVq24MBix';
      script.crossOrigin='anonymous';
    }
    script.onload=()=>finish(window.hljs?null:new Error('Biblioteca de destaque indisponível'));
    script.onerror=()=>finish(new Error('Falha ao carregar a biblioteca de destaque'));
    document.head.append(script);
  });
}

async function getHighlighter(){
  if(window.hljs)return window.hljs;
  if(!loader){
    const root=document.querySelector('meta[name="site-root"]')?.content||'./';
    const local=new URL(`${root}assets/vendor/highlight-11.12.0.min.js?v=1.1.1`,document.baseURI).href;
    loader=loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/highlight.min.js')
      .catch(()=>loadScript(local));
  }
  return loader;
}

export async function initSyntaxHighlighting(){
  const blocks=[...document.querySelectorAll('[data-code][data-language]')]
    .filter(block=>languages.has(block.dataset.language)&&block.querySelector('pre code'));
  if(!blocks.length)return;
  let api;
  try{api=await getHighlighter()}catch{return}
  for(const block of blocks){
    const code=block.querySelector('pre code');
    if(code.dataset.highlighted)return;
    try{
      const source=code.textContent;
      code.innerHTML=api.highlight(source,{language:block.dataset.language,ignoreIllegals:true}).value;
      code.dataset.highlighted='1';
    }catch{ /* O texto original permanece legível. */ }
  }
}
