/**
 * FLIP helper: for each item that was in the list before and is still there, how far (in px)
 * it has to be pushed back so it appears to start where it was. Items that did not move, or
 * are new, get nothing.
 */
export function flipDeltas(
  before: Map<string, number>,
  after: Map<string, number>,
): Map<string, number> {
  const deltas = new Map<string, number>()
  for (const [id, top] of after) {
    const previous = before.get(id)
    if (previous !== undefined && previous !== top) deltas.set(id, previous - top)
  }
  return deltas
}
