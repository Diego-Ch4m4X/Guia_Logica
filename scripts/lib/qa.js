export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function unique(values) {
  return new Set(values).size === values.length;
}
