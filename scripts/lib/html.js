export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeAttribute(value) {
  return escapeHtml(value);
}

export function applyTemplate(template, values) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) throw new Error(`Missing template value: ${key}`);
    return String(values[key]);
  });
}

export function extractSlot(template, name) {
  const re = new RegExp(`<!-- SLOT:${name}:BEGIN -->([\\s\\S]*?)<!-- SLOT:${name}:END -->`);
  const match = template.match(re);
  if (!match) throw new Error(`Template slot not found: ${name}`);
  return match[1].trim();
}
