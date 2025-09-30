const MAPS_STATIC = "maps-v1"
const assets = [
  "/donmaps-pwa/",
  "/donmaps-pwa/index.html",
  "/donmaps-pwa/config.js",
  "/donmaps-pwa/leaflet.css",
  "/donmaps-pwa/css/donmaps-style.css",
  "/donmaps-pwa/src/Chart.min.js",
  "/donmaps-pwa/src/leaflet.js",
  "/donmaps-pwa/src/mapInit.js",
  "/donmaps-pwa/images/24.png",
  "/donmaps-pwa/images/crosshairs.svg",
  "/donmaps-pwa/images/edit-icon.png",
  "/donmaps-pwa/images/fullscreen.png",
  "/donmaps-pwa/images/layers.png",
  "/donmaps-pwa/images/layers-2x.png",
  "/donmaps-pwa/images/loader.gif",
  "/donmaps-pwa/images/location.png",
  "/donmaps-pwa/images/location.svg",
  "/donmaps-pwa/images/marker-end-icon-2x.png",
  "/donmaps-pwa/images/marker-icon.png",
  "/donmaps-pwa/images/marker-icon-1.png",
  "/donmaps-pwa/images/marker-icon-2.png",
  "/donmaps-pwa/images/marker-shadow.png",
  "/donmaps-pwa/images/marker-start-icon-2x.png",
  "/donmaps-pwa/images/marker-via-icon-2x.png",
  "/donmaps-pwa/images/pin-icon-end.png",
  "/donmaps-pwa/images/pin-icon-start.png",
  "/donmaps-pwa/images/pin-shadow.png",
  "/donmaps-pwa/images/routing-icon.png",
  "/donmaps-pwa/images/routing_icon.png",
  "/donmaps-pwa/images/search-icon.png",
  "/donmaps-pwa/images/search-icon-mobile.png",
  "/donmaps-pwa/images/track.odg",
  "/donmaps-pwa/images/upload-icon.odg",
  "/donmaps-pwa/images/view-refresh.png",
]

self.addEventListener('install', (event) => {
  console.log('ServiceWorker installing');
  event.waitUntil(
    caches.open(MAPS_STATIC)
    .then(cache => cache.addAll(assets))
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})
