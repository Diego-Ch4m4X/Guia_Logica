export function splitFrontMatter(source) {
  if (!source.startsWith('---\n')) throw new Error('Front Matter opening delimiter missing');
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('Front Matter closing delimiter missing');
  return { frontMatter: source.slice(4, end), body: source.slice(end + 5) };
}

function stripQuotes(value) {
  const s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function indentation(line) {
  const m = line.match(/^\s*/);
  return m ? m[0].length : 0;
}

function nextNonBlank(lines, start) {
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].trim() && !lines[i].trimStart().startsWith('#')) return i;
  }
  return -1;
}

function parseBlock(lines, start, indent) {
  const first = nextNonBlank(lines, start);
  if (first < 0 || indentation(lines[first]) < indent) return { value: {}, next: start };
  const isArray = lines[first].slice(indent).startsWith('- ');
  const value = isArray ? [] : {};
  let i = start;

  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith('#')) { i += 1; continue; }
    const currentIndent = indentation(raw);
    if (currentIndent < indent) break;
    if (currentIndent > indent) throw new Error(`Unexpected indentation at YAML line ${i + 1}`);
    const text = raw.slice(indent);

    if (isArray) {
      if (!text.startsWith('- ')) break;
      const item = text.slice(2).trim();
      value.push(stripQuotes(item));
      i += 1;
      continue;
    }

    const colon = text.indexOf(':');
    if (colon < 0) throw new Error(`Invalid YAML mapping at line ${i + 1}`);
    const key = stripQuotes(text.slice(0, colon).trim());
    const rest = text.slice(colon + 1).trim();
    if (Object.prototype.hasOwnProperty.call(value, key)) throw new Error(`Duplicate YAML key: ${key}`);
    if (rest) {
      value[key] = stripQuotes(rest);
      i += 1;
      continue;
    }

    const childIndex = nextNonBlank(lines, i + 1);
    if (childIndex < 0 || indentation(lines[childIndex]) <= indent) {
      value[key] = {};
      i += 1;
      continue;
    }
    const childIndent = indentation(lines[childIndex]);
    const child = parseBlock(lines, i + 1, childIndent);
    value[key] = child.value;
    i = child.next;
  }
  return { value, next: i };
}

export function parseYamlSubset(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const first = nextNonBlank(lines, 0);
  if (first < 0) return {};
  return parseBlock(lines, first, indentation(lines[first])).value;
}

export function parseDocument(source) {
  const { frontMatter, body } = splitFrontMatter(source);
  return { metadata: parseYamlSubset(frontMatter), body };
}

export function topicIdFromFilename(name) {
  const match = name.match(/^(T\d{2})_.+_v(\d+\.\d+\.\d+)\.md$/);
  if (!match) throw new Error(`Invalid topic filename: ${name}`);
  return { id: match[1], version: match[2], number: Number(match[1].slice(1)) };
}
