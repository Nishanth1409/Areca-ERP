const QUEUE_KEY = "areca-offline-queue";

export type OfflineAction =
  | { type: "attendance"; payload: Record<string, unknown> }
  | { type: "loan"; payload: Record<string, unknown> }
  | { type: "repayment"; payload: Record<string, unknown> }
  | { type: "transaction"; payload: Record<string, unknown> };

export function enqueueOffline(action: OfflineAction) {
  const current = getOfflineQueue();
  current.push(action);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
}

export function getOfflineQueue(): OfflineAction[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
