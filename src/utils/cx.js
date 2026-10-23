/** Joins class names, skipping falsy values: cx('a', cond && 'b') */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}
