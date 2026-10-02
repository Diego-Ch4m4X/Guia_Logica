function updateCopy(root,language){
  const key=language==='en'?'en':'pt';
  root.querySelectorAll('[data-logic-copy]').forEach(node=>{node.textContent=node.dataset[key]??node.textContent;});
}

function updateValues(root,language,representation){
  root.querySelectorAll('[data-logic-value]').forEach(node=>{
    const key=representation==='bit'?'bit':language==='en'?'booleanEn':'booleanPt';
    node.textContent=node.dataset[key]??node.textContent;
  });
}

function updatePressed(root,attribute,value){
  root.querySelectorAll(`[${attribute}]`).forEach(button=>button.setAttribute('aria-pressed',button.getAttribute(attribute)===value?'true':'false'));
}

function render(root,announce=false){
  const language=root.dataset.language==='en'?'en':'pt-BR';
  const representation=root.dataset.representation==='bit'?'bit':'boolean';
  updateCopy(root,language);
  updateValues(root,language,representation);
  updatePressed(root,'data-logic-language-choice',language);
  updatePressed(root,'data-logic-representation-choice',representation);
  root.setAttribute('lang',language);
  if(announce){
    const languageButton=root.querySelector(`[data-logic-language-choice="${language}"]`);
    const representationButton=root.querySelector(`[data-logic-representation-choice="${representation}"]`);
    const status=root.querySelector('[data-logic-status]');
    if(status){const prefix=language==='en'?'View':'Visualização';status.textContent=`${prefix}: ${languageButton?.textContent?.trim()||language}, ${representationButton?.textContent?.trim()||representation}.`;}
  }
}

export function initLogicReference(){
  document.querySelectorAll('[data-logic-reference]').forEach(root=>{
    if(root.dataset.logicReady)return;
    root.dataset.logicReady='1';
    const controls=root.querySelector('[data-logic-controls]');
    if(controls)controls.hidden=false;
    root.querySelectorAll('[data-logic-language-choice]').forEach(button=>button.addEventListener('click',()=>{
      root.dataset.language=button.dataset.logicLanguageChoice;
      render(root,true);
    }));
    root.querySelectorAll('[data-logic-representation-choice]').forEach(button=>button.addEventListener('click',()=>{
      root.dataset.representation=button.dataset.logicRepresentationChoice;
      render(root,true);
    }));
    render(root,false);
  });
}

if(typeof document!=='undefined')initLogicReference();
