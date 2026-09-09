import { openDB } from "idb";
export interface PendingFieldReport {
  clientId: string;
  ownerId: string;
  deviceTimestamp: string;
  status: "PENDING_SYNC" | "SYNCING" | "ACTION_REQUIRED";
  payload: Record<string, unknown>;
  lastError?: string;
}
const db = () =>
  openDB("project-agap-offline", 2, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("reports")) {
        const s = d.createObjectStore("reports", { keyPath: "clientId" });
        s.createIndex("by-status", "status");
      }
      if (!d.objectStoreNames.contains("packs"))
        d.createObjectStore("packs", { keyPath: "barangayId" });
    },
  });
const changed = () => window.dispatchEvent(new Event("agap-sync"));
export async function cacheOfflinePack(key: string, data: unknown) {
  await (
    await db()
  ).put("packs", { barangayId: key, savedAt: new Date().toISOString(), data });
}
export async function readOfflinePack<T = any>(
  key: string,
): Promise<{ savedAt: string; data: T } | undefined> {
  return (await db()).get("packs", key);
}
export async function queueFieldReport(
  payload: Record<string, unknown>,
  ownerId: string,
) {
  const clientId = crypto.randomUUID();
  const deviceTimestamp = new Date().toISOString();
  const item: PendingFieldReport = {
    clientId,
    ownerId,
    deviceTimestamp,
    status: "PENDING_SYNC",
    payload: { ...payload, clientId, deviceTimestamp },
  };
  await (await db()).put("reports", item);
  changed();
  return item;
}
export async function pendingReports(
  ownerId?: string,
): Promise<PendingFieldReport[]> {
  return (await (await db()).getAll("reports")).filter(
    (r: PendingFieldReport) => r.ownerId === ownerId,
  );
}
let activeSync: Promise<void> | null = null;
export function syncPendingReports(ownerId: string): Promise<void> {
  if (activeSync) return activeSync;
  activeSync = sync(ownerId).finally(() => {
    activeSync = null;
    changed();
  });
  return activeSync;
}
async function sync(ownerId: string) {
  if (!navigator.onLine) return;
  const database = await db();
  const items = (await pendingReports(ownerId)).filter(
    (r) => r.status !== "ACTION_REQUIRED",
  );
  for (const item of items) {
    await database.put("reports", { ...item, status: "SYNCING" });
    changed();
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ records: [item.payload] }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? "Synchronization failed");
      const entry = result.data.results[0];
      if (entry?.status === "SYNCED")
        await database.delete("reports", item.clientId);
      else
        await database.put("reports", {
          ...item,
          status: "ACTION_REQUIRED",
          lastError:
            "Conflicting server record. Ask an LGU reviewer to resolve it.",
        });
    } catch (e) {
      await database.put("reports", {
        ...item,
        status: "PENDING_SYNC",
        lastError: String(e),
      });
      throw e;
    }
  }
  await cacheOfflinePack(`sync:${ownerId}`, {
    lastSyncAt: new Date().toISOString(),
  });
}
export async function clearResolvedLocalConflict(clientId: string) {
  const database = await db();
  await database.delete("reports", clientId);
  changed();
}
