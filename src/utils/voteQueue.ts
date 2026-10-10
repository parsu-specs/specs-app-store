/**
 * Per-app serialized work queue for vote toggles.
 *
 * Rapid clicks used to race: the pending-guard dropped intent (clicks during
 * flight vanished, so the final heart disagreed with what the user tapped),
 * and the card + detail views toggled concurrently, double-flipping the
 * server while each optimistically flipped once from the same base. Queuing
 * makes every click toggle exactly once, in order, on both surfaces — final
 * state always equals click parity, and the heart always matches the server.
 * Chains never reject and entries are dropped when drained (no leak).
 */
const chains = new Map<string, Promise<void>>();

export function enqueueVote(appId: string, task: () => Promise<void>): Promise<void> {
  const prev = chains.get(appId) ?? Promise.resolve();
  const next = prev.then(task, task).then(
    () => undefined,
    () => undefined,
  );
  chains.set(appId, next);
  void next.finally(() => {
    if (chains.get(appId) === next) chains.delete(appId);
  });
  return next;
}
