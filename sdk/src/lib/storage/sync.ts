import type { SyncStrategy } from "./utils-storage.js";
import { STORAGE_EVENT } from "./storageclient.svelte.js";

type SyncHandler = (key: string) => Promise<void>;

interface QueueEntry {
	key: string;
	execute: () => Promise<void>;
	timeout?: ReturnType<typeof setTimeout>;
}

const outboundHandlers = new Set<SyncHandler>();
const inboundHandlers = new Set<SyncHandler>();

export const registerSyncHandler = (
	direction: "in" | "out",
	handler: SyncHandler,
): (() => void) => {
	const handlers = direction === "in" ? inboundHandlers : outboundHandlers;
	handlers.add(handler);
	return () => handlers.delete(handler);
};

const outboundQueue = new Map<string, QueueEntry>();

export const enqueueSyncOut = (key: string, strategy: SyncStrategy): void => {
	if (!strategy) return;

	const execute = async () => {
		const handlers = Array.from(outboundHandlers);
		if (handlers.length === 0) return;

		const results = await Promise.allSettled(handlers.map((h) => h(key)));
		results.forEach((result, i) => {
			if (result.status === "rejected") {
				console.error(`Outbound sync handler ${i} failed for ${key}:`, result.reason);
			}
		});
	};

	if (strategy.mode === "immediate") {
		const entry: QueueEntry = { key, execute };
		outboundQueue.set(key, entry);
		execute().finally(() => {
			if (outboundQueue.get(key) === entry) {
				outboundQueue.delete(key);
			}
		});
	} else {
		const existing = outboundQueue.get(key);
		if (existing?.timeout) clearTimeout(existing.timeout);

		const timeout = setTimeout(() => {
			const entry = outboundQueue.get(key);
			if (entry) {
				outboundQueue.delete(key);
				entry.execute();
			}
		}, strategy.debounceMs);

		outboundQueue.set(key, { key, execute, timeout });
	}
};

export const getQueuedKeys = (): string[] => Array.from(outboundQueue.keys());

export const executeSync = async (
	dir?: "in" | "out" | undefined,
	keys?: string[],
): Promise<void> => {
	const directions = dir === undefined ? (["in", "out"] as const) : [dir];

	for (const direction of directions) {
		if (direction === "out") {
			const keysToFlush = keys || Array.from(outboundQueue.keys());
			const entries: QueueEntry[] = [];

			for (const key of keysToFlush) {
				const entry = outboundQueue.get(key);
				if (entry) {
					if (entry.timeout) clearTimeout(entry.timeout);
					outboundQueue.delete(key);
					entries.push(entry);
				}
			}

			await Promise.allSettled(entries.map((e) => e.execute()));
		} else {
			const handlers = Array.from(inboundHandlers);
			if (handlers.length === 0) continue;

			const keysToSync = keys || getAllStorageKeys();
			const results = await Promise.allSettled(
				keysToSync.flatMap((key) => handlers.map((h) => h(key))),
			);

			results.forEach((result, i) => {
				if (result.status === "rejected") {
					console.error(`Inbound sync failed (handler ${i}):`, result.reason);
				}
			});
		}
	}
};

const getAllStorageKeys = (): string[] => {
	const keys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) keys.push(key);
	}
	return keys;
};

let eventListenerCleanup: (() => void) | undefined;

export const initSync = (getSyncStrategy: (key: string) => SyncStrategy): (() => void) => {
	eventListenerCleanup?.();

	const listener = (event: CustomEvent<{ key: string; value: string | undefined }>) => {
		const { key } = event.detail;
		const strategy = getSyncStrategy(key);
		enqueueSyncOut(key, strategy);
	};

	window.addEventListener(STORAGE_EVENT, listener as EventListener);

	const cleanup = () => {
		window.removeEventListener(STORAGE_EVENT, listener as EventListener);
	};

	eventListenerCleanup = cleanup;
	return cleanup;
};

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		eventListenerCleanup?.();
		for (const entry of outboundQueue.values()) {
			if (entry.timeout) clearTimeout(entry.timeout);
		}
		outboundQueue.clear();
		outboundHandlers.clear();
		inboundHandlers.clear();
	});
}
