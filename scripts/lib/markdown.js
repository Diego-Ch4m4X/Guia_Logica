import { escapeHtml, escapeAttribute } from './html.js';
import { createSlugger, headingPlainText } from './slug.js';

const COPY_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';
const WRAP_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h12a4 4 0 0 1 0 8H9"></path><path d="m12 11-3 3 3 3"></path><path d="M4 18h4"></path></svg>';

const rawInlineTag = /<\/?(?:a|strong|em|code|kbd|span|sup|sub)(?:\s+[^>]*)?>/gi;

function protect(text, regex, store) {
  return text.replace(regex, match => {
    const key = `\u0000P${store.length}\u0000`;
    store.push(match);
    return key;
  });
}

function restore(text, store) {
  return text.replace(/\u0000P(\d+)\u0000/g, (_, i) => store[Number(i)] ?? '');
}


function outputHref(href) {
  const value = String(href);
  if (value.startsWith('#')) return `#${encodeURIComponent(value.slice(1))}`;
  return value;
}

function canonicalLinkBaseSlug(text) {
  const out = [];
  for (const ch of String(text).trim().toLowerCase()) {
    if (ch === '-' || ch === '_') out.push(ch);
    else if (/^\s$/u.test(ch)) out.push('-');
    else if (/^[\p{P}\p{S}]$/u.test(ch)) continue;
    else out.push(ch);
  }
  return out.join('');
}

export function renderInline(input) {
  let text = String(input);
  const store = [];

  // Code spans first: literal content, escaped, never parsed as Markdown/HTML.
  text = protect(text, /`([^`]+)`/g, store);
  for (let i = 0; i < store.length; i += 1) {
    if (!store[i].startsWith('<code>')) {
      const m = store[i].match(/^`([\s\S]*)`$/);
      if (m) store[i] = `<code>${escapeHtml(m[1])}</code>`;
    }
  }

  // Controlled inline HTML already present in canonical Markdown.
  text = protect(text, rawInlineTag, store);

  // Escape all remaining raw text.
  text = escapeHtml(text);

  // Images before links.
  text = text.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, alt, url, title) => `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}"${title ? ` title="${escapeAttribute(title)}"` : ''}>`);

  text = text.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, label, href, title) => `<a href="${escapeAttribute(outputHref(href))}"${title ? ` title="${escapeAttribute(title)}"` : ''}>${label}</a>`);

  text = text.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>');

  // Protect generated HTML tags so emphasis markers in href/src attributes are never reparsed.
  text = protect(text, /<[^>]+>/g, store);

  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');
  text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return restore(text, store);
}

function codeLanguageLabel(language) {
  if (!language || language === 'text' || language === 'txt' || language === 'plaintext') return 'saída / texto';
  if (language === 'bash' || language === 'sh' || language === 'shell') return 'terminal';
  return language;
}

function renderCodeBlock(language, code) {
  const lang = language || 'text';
  const label = codeLanguageLabel(lang);
  return `<div class="code-block" data-code data-language="${escapeAttribute(lang)}"><div class="code-head"><span class="code-lang">${escapeHtml(label)}</span><button class="code-action copy-btn" type="button" aria-label="Copiar código" title="Copiar código">${COPY_ICON}</button><button class="code-action wrap-btn" type="button" aria-label="Quebrar linha" title="Quebrar linha">${WRAP_ICON}</button></div><div class="code-viewport"><pre><code>${escapeHtml(code)}</code></pre></div><div class="code-footer"><button class="expand-btn" type="button" hidden>Mostrar mais ↓</button></div></div>`;
}

function renderMermaid(code) {
  const escaped = escapeHtml(code);
  return `<figure class="mermaid-figure" data-mermaid="true"><figcaption class="mermaid-figure-head"><span class="mermaid-figure-kicker">Diagrama Mermaid</span><span class="mermaid-figure-note">Renderização progressiva; fonte preservada</span></figcaption><div class="mermaid-render-host" role="img" aria-label="Diagrama Mermaid"></div><template>${escaped}</template><details class="mermaid-source-details"><summary>Ver código-fonte Mermaid</summary><pre><code>${escaped}</code></pre></details></figure>`;
}

function isTableDelimiter(line) {
  const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim());
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

export function splitTableRow(line) {
  const source = String(line).trim();
  const cells = [];
  let current = '';
  let codeTicks = 0;
  let endedWithDelimiter = false;

  for (let i = 0; i < source.length;) {
    const ch = source[i];

    // GFM permits escaped pipes inside table cells. The escape belongs to
    // Markdown syntax, so the rendered cell receives the literal pipe.
    if (ch === '\\' && source[i + 1] === '|') {
      current += '|';
      endedWithDelimiter = false;
      i += 2;
      continue;
    }

    // Pipes inside code spans are cell content, not column separators.
    if (ch === '`') {
      let run = 1;
      while (source[i + run] === '`') run += 1;
      current += '`'.repeat(run);
      if (codeTicks === 0) {
        const marker = '`'.repeat(run);
        if (source.indexOf(marker, i + run) !== -1) codeTicks = run;
      } else if (codeTicks === run) {
        codeTicks = 0;
      }
      endedWithDelimiter = false;
      i += run;
      continue;
    }

    if (ch === '|' && codeTicks === 0) {
      cells.push(current.trim());
      current = '';
      endedWithDelimiter = true;
      i += 1;
      continue;
    }

    current += ch;
    endedWithDelimiter = false;
    i += 1;
  }

  cells.push(current.trim());
  if (source.startsWith('|')) cells.shift();
  if (endedWithDelimiter) cells.pop();
  return cells;
}

function isBlockStart(lines, i) {
  const line = lines[i] ?? '';
  const next = lines[i + 1] ?? '';
  return /^\s{0,3}(#{1,6})\s+/.test(line) ||
    /^\s{0,3}(`{3,}|~{3,})/.test(line) ||
    /^\s{0,3}(?:[-*_]\s*){3,}$/.test(line) ||
    /^\s{0,3}>/.test(line) ||
    /^\s{0,3}(?:[-+*]|\d+[.)])\s+/.test(line) ||
    /^\s*</.test(line) ||
    (line.includes('|') && isTableDelimiter(next));
}

function renderList(lines, start, context) {
  const first = lines[start];
  const m = first.match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
  if (!m) return null;
  const baseIndent = m[1].length;
  const ordered = /^\d/.test(m[2]);
  const tag = ordered ? 'ol' : 'ul';
  const items = [];
  let i = start;

  while (i < lines.length) {
    const lm = lines[i].match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
    if (!lm || lm[1].length !== baseIndent || /^\d/.test(lm[2]) !== ordered) break;
    let body = lm[3];
    const task = body.match(/^\[([ xX])\]\s+(.*)$/);
    let itemHtml;
    if (task) {
      const checked = task[1].toLowerCase() === 'x';
      context.checkCounter += 1;
      const key = `${context.checkPrefix}-check-${String(context.checkCounter).padStart(3, '0')}`;
      itemHtml = `<label class="task-label"><input class="interactive-check" data-check-key="${key}" type="checkbox"${checked ? ' checked' : ''}><span>${renderInline(task[2])}</span></label>`;
    } else {
      itemHtml = renderInline(body);
    }
    i += 1;

    // Continuation lines / nested list.
    const continuations = [];
    while (i < lines.length) {
      if (!lines[i].trim()) { i += 1; break; }
      const nm = lines[i].match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
      if (nm && nm[1].length === baseIndent) break;
      if (nm && nm[1].length > baseIndent) {
        const nested = renderList(lines, i, context);
        if (nested) { continuations.push(nested.html); i = nested.next; continue; }
      }
      const indent = (lines[i].match(/^\s*/) || [''])[0].length;
      if (indent <= baseIndent) break;
      continuations.push(`<br>${renderInline(lines[i].trim())}`);
      i += 1;
    }
    items.push(`<li${task ? ' class="task-item"' : ''}>${itemHtml}${continuations.join('')}</li>`);
  }
  return { html: `<${tag}>${items.join('')}</${tag}>`, next: i };
}

export function renderMarkdown(body, options = {}) {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const reserved = new Set([...body.matchAll(/<a\s+id=["']([^"']+)["']\s*>\s*<\/a>/gi)].map(m => m[1]));
  const slugger = createSlugger(reserved);
  const headings = [];
  const out = [];
  let i = 0;
  let skippedH1 = options.skipFirstH1 === false;
  let previousRenderedHeadingLevel = 1;
  const canonicalCounts = new Map();
  const canonicalUsed = new Set(reserved);
  const context = { checkCounter: 0, checkPrefix: String(options.topicId || 'T25').toLowerCase() };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})\s*([^\s]*)\s*$/);
    if (fence) {
      const marker = fence[1];
      const lang = fence[2] || 'text';
      const code = [];
      i += 1;
      while (i < lines.length && !new RegExp(`^\\s{0,3}${marker[0]}{${marker.length},}\\s*$`).test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      const codeText = `${code.join('\n')}\n`;
      out.push(lang === 'mermaid' ? renderMermaid(codeText) : renderCodeBlock(lang, codeText));
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const sourceLevel = heading[1].length;
      const level = options.normalizeHeadingJumps === true
        ? Math.min(sourceLevel, previousRenderedHeadingLevel + 1)
        : sourceLevel;
      const inline = heading[2];
      const plain = headingPlainText(inline).replace(/<[^>]+>/g, '').trim();
      const id = slugger(plain);
      const canonicalBase = canonicalLinkBaseSlug(plain) || 'secao';
      let canonicalN = canonicalCounts.get(canonicalBase) || 0;
      let canonicalId = canonicalN === 0 ? canonicalBase : `${canonicalBase}-${canonicalN}`;
      canonicalCounts.set(canonicalBase, canonicalN + 1);
      headings.push({ level, text: plain, id, line: i + 1 });
      if (sourceLevel === 1 && !skippedH1) {
        skippedH1 = true;
      } else {
        const alias = options.canonicalAliases === true && canonicalId !== id && !canonicalUsed.has(canonicalId)
          ? `<a aria-hidden="true" class="anchor-alias" id="${escapeAttribute(canonicalId)}"></a>`
          : '';
        canonicalUsed.add(canonicalId);
        out.push(`${alias}<h${level}${sourceLevel === 1 ? ' class="chapter-title"' : ''} id="${escapeAttribute(id)}">${renderInline(inline)}</h${level}>`);
        previousRenderedHeadingLevel = level;
      }
      i += 1;
      continue;
    }

    if (/^\s{0,3}(?:[-*_]\s*){3,}$/.test(line)) {
      out.push('<hr>'); i += 1; continue;
    }

    if (line.includes('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const head = splitTableRow(line);
      const delimiter = splitTableRow(lines[i + 1]);
      const rightAligned = delimiter.map(cell => /:$/.test(cell));
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i])); i += 1;
      }
      const thead = `<thead><tr>${head.map((c,n) => `<th${rightAligned[n] ? ' class="numeric-right"' : ''}>${renderInline(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows.map(row => `<tr>${head.map((_, n) => `<td${rightAligned[n] ? ' class="numeric-right"' : ''}>${renderInline(row[n] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
      out.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    if (/^\s{0,3}>/.test(line)) {
      const q = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        q.push(lines[i].replace(/^\s{0,3}>\s?/, '')); i += 1;
      }
      const inner = renderMarkdown(q.join('\n'), { ...options, skipFirstH1:false }).html;
      out.push(`<blockquote>${inner}</blockquote>`);
      continue;
    }

    const list = renderList(lines, i, context);
    if (list) { out.push(list.html); i = list.next; continue; }

    if (/^\s*</.test(line)) {
      if (/^\s*<a\s+id=["'][^"']+["']><\/a>\s*$/i.test(line)) {
        const anchors = [];
        while (i < lines.length && /^\s*<a\s+id=["'][^"']+["']><\/a>\s*$/i.test(lines[i])) {
          anchors.push(lines[i].trim());
          i += 1;
        }
        out.push(`<p>${anchors.join('\n')}</p>`);
      } else if (/^\s*<details\b/i.test(line)) {
        const open = line.trim();
        i += 1;
        const inside = [];
        while (i < lines.length && !/<\/details>\s*$/i.test(lines[i])) { inside.push(lines[i]); i += 1; }
        if (i < lines.length) i += 1;
        let summary = '';
        if (inside.length && /^\s*<summary\b/i.test(inside[0])) summary = inside.shift().trim();
        const nested = renderMarkdown(inside.join('\n'), { ...options, skipFirstH1:false }).html;
        out.push(`${open}${summary}${nested}</details>`);
      } else {
        out.push(line); i += 1;
      }
      continue;
    }

    // Paragraph: consume until blank or next block start.
    const para = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines, i)) {
      para.push(lines[i]); i += 1;
    }
    const html = para.map((x, idx) => {
      const hard = /\s{2}$/.test(x);
      const rendered = renderInline(x.trimEnd());
      return idx === para.length - 1 ? rendered : `${rendered}${hard ? '<br >' : ' '}`;
    }).join('');
    out.push(`<p>${html}</p>`);
  }

  let html = out.join('\n');
  let keyCounter = 0;
  html = html.replace(new RegExp(`data-check-key="${context.checkPrefix}-check-\\d+"`, 'g'), () => {
    keyCounter += 1;
    return `data-check-key="${context.checkPrefix}-check-${String(keyCounter).padStart(3, '0')}"`;
  });
  return { html, headings };
}
