// Indian digit grouping (₹1,25,000) by integer string manipulation. Intl/toLocaleString are
// avoided on purpose: their output depends on the ICU build of the runtime.

export function formatRupees(n: number): string {
  if (!Number.isSafeInteger(n)) {
    throw new Error(`formatRupees expects a whole-number integer, got ${n}`)
  }
  const digits = String(n).replace('-', '')
  const lastThree = digits.slice(-3)
  let rest = digits.slice(0, -3)
  const groups: string[] = []
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2))
    rest = rest.slice(0, -2)
  }
  if (rest) groups.unshift(rest)
  const grouped = [...groups, lastThree].join(',')
  return `${n < 0 ? '-' : ''}₹${grouped}`
}
