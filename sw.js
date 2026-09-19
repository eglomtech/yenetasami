/* ============================================================
   Service Worker — የኔታ ሳሙኤል
   Caches the app shell immediately, then caches everything else
   (pages, audio, icons) the first time it's requested, so the
   app keeps working fully offline after the user's first visit.
   ============================================================ */
const CACHE_NAME = "yeneta-samuel-v1";

/* Core files needed to boot the app offline. */
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* Known audio files referenced by the app — pre-cached on install
   on a best-effort basis (missing ones are simply skipped, they
   won't block installation). Anything not listed here still gets
   cached automatically the first time the user plays it. */
const AUDIO_FILES = [
  "././audio/ሠራዋት ዘሐዋርያት.wav",
  "./audio/serawit melaktihu (like naile).wav",
  "./audio/እግዚኦ መሀረነ ክርስቶስ.wav",
  "./audio/egzio yared.wav",
  "./audio/qidase-05-selestu.mp3",
  "./audio/qidase-06-atnatewos.mp3",
  "./audio/qidase-07-baselyos.mp3",
  "./audio/qidase-08-gorgoryos.mp3",
  "./audio/qidase-09-epifanyos.mp3",
  "./audio/qidase-10-afework.mp3",
  "./audio/qidase-11-qerlos.mp3",
  "./audio/qidase-12-yaeqob.mp3",
  "./audio/qidase-13-dioskoros.mp3",
  "./audio/qidase-14-gorgoryos2.mp3",
  "./audio/hymn-wudase-maryam.mp3",
  "./audio/hymn-melkea-maryam.mp3",
  "./audio/hymn-anqetse-berhan.mp3",
  "./audio/hymn-melkea-selassie.mp3",
  "./audio/hymn-tselote-haymanot.mp3",
  "./audio/hymn-egzio-meharene.mp3",
  "./audio/hymn-tefeshi-maryam.mp3",
  "./audio/hymn-astebqueot.mp3",
  "./audio/hymn-mezmure-dawit.mp3",
  "./audio/hymn-ezl.mp3",
  "./audio/ሰዐታት ይትባረክ.wav",
  "./audio/ሰዐታት ሃሌሉያ.wav",
  "./audio/mehreteke esebh.wav",
  "./audio/egene leke egzio.wav",
  "./audio/ሰዐታት ጸልዩ.wav",
  "./audio/ሰዐታት ቅዱስ.wav",
  "./audio/ሰዐታት ቅዱስ 2.wav",
  "./audio/ሰዐታት ግነዩ.wav",
  "./audio/theseleyu.wav",
  "./audio/thseleyu.wav",
  "./audio/theseleyu (2).wav"
].map(p => encodeURI(p));

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // App shell must succeed.
      await cache.addAll(APP_SHELL);
      // Audio is best-effort — don't fail install if a file is missing.
      await Promise.allSettled(AUDIO_FILES.map((url) => cache.add(url)));
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // Cache same-origin successful responses for next time (offline use).
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        // Offline and not cached yet — fall back to the app shell for
        // navigations so the app still opens.
        if (req.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        throw err;
      }
    })()
  );
});
