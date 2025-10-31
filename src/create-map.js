import * as L from './leaflet-src.esm.js';
import { tfAPI, defaultLocation, defaultZoom, defaultLayer } from './config.js';
import placeSearch from './search.js';
import plotTrack from './plot-track.js';
import plotRoute from './plot-route.js';
import loadGPX from './load-gpx.js';
import findLocation from './location.js';
import fullScreen from './fullscreen.js';

export default function createMap() {
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { id: 'osm',
      attribution: 'Map data &copy;  <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const outdoors = L.tileLayer(`https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${tfAPI}`,
    { id: 'outdoors',
      attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const cycle = L.tileLayer(`https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${tfAPI}`,
    { id: 'cycle',
      attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const sea =  L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    { id: 'sea',
      attribution: 'Map data: &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors' });
  const transport =  L.tileLayer(`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${tfAPI}`,
    { id: 'transport',
      attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const topo =  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    { id: 'topo',
      attribution: 'Map data &copy; <a href=https://opentopomap.org//">OpenTopoMap</a>',
      maxZoom: 21 });
  const google =  L.tileLayer('https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&s=&y={y}&z={z}',
    { id: 'streets',
      attribution: '<a href="https://mapbox.com/about/maps" class="mapbox-wordmark" target="_blank">Mapbox</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
      maxZoom: 21 });

  const baseMaps = {
    Openstreetmap: osm,
    Outdoors: outdoors,
    Cycle: cycle,
    Transport: transport,
    Topographic: topo,
    Google: google
  };
  const overLayers = {
    Openseamap: sea,
  };

  /* If local storage contains centre and zoom, default values if not */
  const args = JSON.parse(sessionStorage.getItem('vars'));
  let centre, zoom, lat, lng, layer;
  if (args) {
    ({ lat, lng, zoom, layer} = args);
    centre = [lat, lng];
  } else {
    centre = defaultLocation;
    zoom = defaultZoom;
    layer =  defaultLayer;
  }
  const layerId = baseMaps[Object.keys(baseMaps).find(key => baseMaps[key].options.id === layer)];

  const map = new L.Map('map', {
    center: centre,
    zoom: zoom,
    layers: layerId
  });

  // add layer control
  L.control.layers(baseMaps, overLayers).addTo(map);

  // Listen for base layer change
  map.on('baselayerchange', function (e) {
    layer = e.layer;
  });

  // Set cursors
  onmousedown = () => {
    document.getElementById('map').style.cursor = 'grabbing';
  }
  onmouseup = () => {
    document.getElementById('map').style.cursor = 'grab';
  }
  // Add plugin buttons
  placeSearch().addTo(map);
  findLocation().addTo(map);
  plotTrack().addTo(map);
  plotRoute().addTo(map);
  loadGPX().addTo(map);
  fullScreen().addTo(map);
  
  // Reload button
  L.Control.Reload = L.Control.extend({
    onAdd(map) {
      const reloadButton = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom reload');
      reloadButton.setAttribute('title', 'Reload map at this location and zoom');

      L.DomEvent.on(reloadButton, 'click contextmenu mousedown mousewheel dblclick', L.DomEvent.stopPropagation);

      L.DomEvent.on(reloadButton, 'click', () => {
        const centre = map.getCenter();
        const zoom = map.getZoom();

        sessionStorage.setItem('vars', `{"lat": ${centre.lat}, "lng": ${centre.lng}, "zoom": ${zoom}, "layer": "${layer.options.id}"}`);

        window.location.reload();
      });
      return reloadButton;
    },
  });

  L.control.reload = (option) => {
    return new L.Control.Reload(option);
  };
  L.control.reload({ position: 'topleft' }).addTo(map);

  function getGeoData(e) {
    const infoPopup = L.popup();
    infoPopup
      .setLatLng(e.latlng)
      .setContent(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}<br /><button class="button" id="geo">What's here?</button>`)
      .openOn(map);
    document.getElementById('geo').onclick = () => {
      geoDataRequest(e);
      map.closePopup(infoPopup);
    };
  }
  map.on('contextmenu', getGeoData);

  function geoDataRequest(e) {
    fetch(`https://nominatim.openstreetmap.org/?addressdetails=1&q=${e.latlng.lat},${e.latlng.lng}&format=json&limit=1`)
      .then(response => response.json())
      .then(geoLabel => {
        L.popup()
          .setContent(`<a href="https://duckduckgo.com/?q=${geoLabel[0].display_name}" target="_blank">${geoLabel[0].display_name}</a>`)
          .setLatLng([geoLabel[0].lat, geoLabel[0].lon])
          .openOn(map);
      })
  }
}
