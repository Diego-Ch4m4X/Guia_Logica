import { escapeHtml, escapeAttribute } from './html.js';

function chapterNumber(text, fallback) {
  if (/^Índice$/i.test(text)) return '01';
  if (/^Índice operacional de Problemas Reais/i.test(text)) return 'PR';
  const m = String(text).match(/^(\d+)(?:\.|\s)/);
  return m ? m[1] : String(fallback).padStart(2,'0');
}

export function buildGuide(headings) {
  const parts = ['<nav aria-label="Capítulos do tópico aberto"><ol class="guide-tree">'];
  const firstChapter = headings.findIndex(h => h.chapter);
  const intro = headings.slice(0, firstChapter < 0 ? 0 : firstChapter).filter(h => h.level === 2);
  if (intro.length) {
    parts.push('<li class="guide-group">Comece aqui</li><li><ol class="guide-subtree">');
    for (const h of intro) parts.push(`<li><a class="guide-subitem" href="#${escapeAttribute(h.id)}">${escapeHtml(h.text)}</a></li>`);
    parts.push('</ol></li>');
  }

  let chapterIndex = 0;
  for (let i = Math.max(firstChapter,0); i < headings.length; i += 1) {
    const h = headings[i];
    if (!h.chapter) continue;
    if (/^PARTE\b/i.test(h.text)) {
      parts.push(`<li class="guide-group">${escapeHtml(h.text)}</li>`);
      continue;
    }
    chapterIndex += 1;
    const children = [];
    for (let j=i+1; j<headings.length && !headings[j].chapter; j+=1) {
      if (headings[j].level === 2) children.push(headings[j]);
    }
    const num = chapterNumber(h.text, chapterIndex);
    if (children.length) {
      parts.push(`<li class="guide-branch"><div class="guide-node"><a class="guide-item" href="#${escapeAttribute(h.id)}"><span class="chapter-num">${escapeHtml(num)}</span><span>${escapeHtml(h.text)}</span></a><button aria-expanded="false" class="guide-disclosure" type="button"><span aria-hidden="true" class="guide-disclosure-mark"></span><span class="sr-only">Expandir subtópicos de ${escapeHtml(h.text)}</span></button></div><ol class="guide-subtree" hidden>`);
      for (const child of children) parts.push(`<li><a class="guide-subitem" href="#${escapeAttribute(child.id)}">${escapeHtml(child.text)}</a></li>`);
      parts.push('</ol></li>');
    } else {
      parts.push(`<li><a class="guide-item" href="#${escapeAttribute(h.id)}"><span class="chapter-num">${escapeHtml(num)}</span><span>${escapeHtml(h.text)}</span></a></li>`);
    }
  }
  parts.push('</ol></nav>');
  return parts.join('');
}

export function buildToc(_headings, id='dynamicToc') {
  return `<ul class="page-toc-list" id="${escapeAttribute(id)}"></ul>`;
}

export function buildDrawer(title, body, side = '') {
  const sideClass = '';
  const aria = side ? 'Fechar índice' : 'Fechar navegação';
  return `<div class="drawer-head"><span class="drawer-title">${escapeHtml(title)}</span><button class="icon-btn drawer-close" type="button" aria-label="${aria}">×</button></div><div class="drawer-body${sideClass}">${body}</div>`;
}
