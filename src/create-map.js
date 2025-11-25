import { Map, tileLayer, control, popup, layerGroup, marker } from './leaflet-src.esm.js';
import { orsAPI, tfAPI, defaultLocation, defaultZoom, defaultLayer } from './config.js';
import placeSearch from './search.js';
import plotTrack from './plot-track.js';
import plotRoute from './plot-route.js';
import loadGPX from './load-gpx.js';
import findLocation from './location.js';
import fullScreen from './fullscreen.js';
import prefs from './prefs.js';

export default () => {
  const osm = tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { id: 'osm',
      attribution: 'Map data &copy;  <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const outdoors = tileLayer(`https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${tfAPI}`,
    { id: 'outdoors',
      attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const cycle = tileLayer(`https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${tfAPI}`,
    { id: 'cycle',
      attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const sea =  tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    { id: 'sea',
      attribution: 'Map data: &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors' });
  const transport =  tileLayer(`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${tfAPI}`,
    { id: 'transport',
      attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  const topo =  tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    { id: 'topo',
      attribution: 'Map data &copy; <a href=https://opentopomap.org//">OpenTopoMap</a>',
      maxZoom: 21 });
  const google =  tileLayer('https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&s=&y={y}&z={z}',
    { id: 'streets',
      attribution: '<a href="https://mapbox.com/about/maps" class="mapbox-wordmark" target="_blank">Mapbox</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
      maxZoom: 21 });
  const os = tileLayer('https://{s}.os.openstreetmap.org/layer/gb_os_om_local_2020_04/{z}/{x}/{y}.png', {
      attribution: 'Contains OS data &copy; Crown copyright and database right 2020',
      maxZoom: 18,
  });


  const baseMaps = {
    Openstreetmap: osm,
    Outdoors: outdoors,
    Cycle: cycle,
    Transport: transport,
    Topographic: topo,
    Google: google,
    OS: os
  };
  const overLayers = {
    Openseamap: sea,
  };

  /* If session storage contains centre and zoom, default values if not */
  let centre, zoom;
  const centreAndZoom = JSON.parse(localStorage.getItem('userDefaultLocation'))
  let layerId;

  if (centreAndZoom) {
    centre = [centreAndZoom.lat, centreAndZoom.lng];
    zoom = centreAndZoom.zoom;
    layerId = centreAndZoom.layerId;
  } else {
    centre = defaultLocation;
    zoom = defaultZoom;
    layerId =  defaultLayer;
  }

  let layer = baseMaps[Object.keys(baseMaps).find(key => baseMaps[key].options.id === layerId)];

  const map = new Map('map', {
    center: centre,
    zoom: zoom,
    layers: layer
  });

  // add layer control
  control.layers(baseMaps, overLayers).addTo(map);

  // Listen for base layer change
  map.on('baselayerchange', function (e) {
    sessionStorage.setItem('layerId', e.layer.options.id);
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
  prefs().addTo(map);
  // Popup for geo data
  map.on('contextmenu', e => {
    const infoPopup = popup();
    infoPopup
      .setLatLng(e.latlng)
      .setContent(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}<br /><button class="button" id="geo">What's around here?</button>`)
      .openOn(map);
    document.getElementById('geo').onclick = () => {
      geoDataRequest(e);
      map.closePopup(infoPopup);
    }
  });

  let markerGroup;

  map.on('click', () => {
    if (markerGroup) markerGroup.remove();
  });

  function geoDataRequest(e) {
    if (markerGroup) markerGroup.remove();
    fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${orsAPI}&point.lon=${e.latlng.lng}&point.lat=${e.latlng.lat}&layers=address%2Cvenue`)
    .then(response => response.json())
    .then(result => {
      let coords = [];
      markerGroup = layerGroup().addTo(map);
      const geolabel = (result.features);
      geolabel.forEach(label => {
        coords = label.geometry.coordinates.reverse();
        const newMarker = marker(coords, {riseOnHover: 'true'}).addTo(markerGroup);
        var popupContent = label.properties.label;
        newMarker.bindPopup(`<a href="https://duckduckgo.com/?q=${popupContent}" target="_blank">${popupContent}</a>`);
      });
    });
  }
}
