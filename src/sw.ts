/// <reference lib="webworker" />

import "dexie-cloud-addon/service-worker";
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event: ExtendableMessageEvent) => {
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});
