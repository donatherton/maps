const assets = [
  "./",
  "./index.html",
  "./leaflet.css",
  "./css/donmaps-style.css",
  "./src/Chart.min.js",
  "./src/config.js",
  "./src/create-map.js",
  "./src/elevation.js",
  "./src/fullscreen.js",
  "./src/leaflet-src.esm.js",
  "./src/leaflet-src.esm.js.map",
  "./src/load-gpx.js",
  "./src/location.js",
  "./src/main.js",
  "./src/plot-route.js",
  "./src/plot-track.js",
  "./src/save-gpx.js",
  "./src/search.js",
  "./images/24.png",
  "./images/crosshairs.svg",
  "./images/edit-icon.png",
  "./images/fullscreen.png",
  "./images/layers.png",
  "./images/layers-2x.png",
  "./images/loader.gif",
  "./images/location.png",
  "./images/location.svg",
  "./images/marker-end-icon-2x.png",
  "./images/marker-icon.png",
  "./images/marker-icon-1.png",
  "./images/marker-icon-2.png",
  "./images/marker-shadow.png",
  "./images/marker-start-icon-2x.png",
  "./images/marker-via-icon-2x.png",
  "./images/pin-icon-end.png",
  "./images/pin-icon-start.png",
  "./images/pin-shadow.png",
  "./images/routing-icon.png",
  "./images/routing_icon.png",
  "./images/search-icon.png",
  "./images/search-icon-mobile.png",
  "./images/track.odg",
  "./images/upload-icon.odg",
  "./images/view-refresh.png",
]

self.addEventListener('install', (event) => {
  console.log('ServiceWorker installing');
  event.waitUntil(
    caches.open('maps-v1')
    .then(cache => cache.addAll(assets))
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request);
    })
  )
})
