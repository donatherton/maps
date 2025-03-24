const staticMaps = "weather-v1"
const assets = [
  "/",
  "/index.html",
  "/config.js",
  "leaflet.css",
  "/css/donmaps-style.css",
  "/src/Chart.min.js",
  "/src/leaflet.js",
  "/mapInit.js",
  "/images/24.png",
  "/images/crosshairs.svg",
  "/images/edit-icon.png",
  "/images/fullscreen.png",
  "/images/layers.png",
  "/images/layers-2x.png",
  "/images/loader.gif",
  "/images/location.png",
  "/images/location.svg",
  "/images/marker-end-icon-2x.png",
  "/images/marker-icon.png",
  "/images/marker-icon-1.png",
  "/images/marker-icon-2.png",
  "/images/marker-shadow.png",
  "/images/marker-start-icon-2x.png",
  "/images/marker-via-icon-2x.png",
  "/images/pin-icon-end.png",
  "/images/pin-icon-start.png",
  "/images/pin-shadow.png",
  "/images/routing-icon.png",
  "/images/routing_icon.png",
  "/images/search-icon.png",
  "/images/search-icon-mobile.png",
  "/images/track.odg",
  "/images/upload-icon.odg",
  "/images/view-refresh.png",
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticMaps).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})
