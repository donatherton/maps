'use strict';
import { Control, DomUtil, DomEvent, DivIcon, latLng, LayerGroup, Polyline, Marker } from './leaflet-src.esm.js';

/**
 * Leaflet control for loading GPX files.
 * @type {Object}
 */
Control.LoadGPX = Control.extend({
      options: {
      position: 'topleft',
    },

    /**
     * Creates the control button and handles GPX file loading.
     * @param {Object} map - The Leaflet map instance
     * @returns {HTMLElement} The control button element
     */
    onAdd(map) {
      const button = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom load-gpx button');
      button.title = 'Load a GPX file';

      DomEvent.on(button, 'click contextmenu mousedown mousewheel dblclick', DomEvent.stopPropagation);

      // Create an invisible file input
      const fileInput = DomUtil.create('input', '', button);
      fileInput.type = 'file';
      fileInput.accept = '.gpx';
      fileInput.style.display = 'none';

      /**
       * Parses and displays a GPX file on the map.
       * @param {Document} gpxFile - The parsed GPX XML document
       * @returns {void}
       */
      function loadGPX(gpxFile) {
        Control.ResetWindow = Control.extend({
          onAdd(map) {
            const resetButton = DomUtil.create('button', 'button');
            resetButton.id = 'reset';
            resetButton.style.width = 'auto';
            resetButton.style.height = '30px';
            resetButton.innerText = 'Reset';

            DomEvent.on(resetButton, 'click contextmenu mousedown mousewheel dblclick touchmove', DomEvent.stopPropagation);

            DomEvent.on(resetButton, 'click', () => {
            if (el) el.remove();
            map
              .removeControl(resetButton)
              .removeLayer(layerGroup)
            document.getElementById('plotter').disabled = false;
            document.getElementById('ors-router').disabled = false;
          });
            return resetButton;
          },
        });
        const resetWindow = options => new Control.ResetWindow(options);
        resetWindow({ position: 'topright' }).addTo(map);

        let alt = null;
        const coords = [];
        let lngth = 0;
        let tags;
        const unit = localStorage.getItem('dist') === 'km' ? 'Km' : 'miles';
        const factor = unit === 'miles' ? 0.00062137 : 0.001;
        let el;

        const layerGroup = new LayerGroup().addTo(map);

        const startIcon = new DivIcon({
          className: 'starticon',
          iconSize: [15, 15],
          popupAnchor: [2, -6], // point from which the popup should open relative to the iconAnc
        });
        const endIcon = new DivIcon({
          className: 'endicon',
          iconSize: [15, 15],
          popupAnchor: [2, -6], // point from which the popup should open relative to the iconAnc
        });

        if (gpxFile.getElementsByTagName('trk').length > 0) {
          tags = 'trkpt';
        } else if (gpxFile.getElementsByTagName('rte').length > 0) {
          tags = 'rtept';
        } else {
          alert("Sorry, this file can't be loaded");
        }

        /**
         * Calculates the distance between two points using the Haversine formula.
         * @param {number} lat1 - Latitude of first point in degrees
         * @param {number} lon1 - Longitude of first point in degrees
         * @param {number} lat2 - Latitude of second point in degrees
         * @param {number} lon2 - Longitude of second point in degrees
         * @returns {number} Distance in miles
         */
        function distance(lat1, lon1, lat2, lon2) {
          if ((lat1 === lat2) && (lon1 === lon2)) {
            return 0;
          }

          return latLng([lat1, lon1]).distanceTo(latLng([lat2, lon2]));

          // const radlat1 = (Math.PI * lat1) / 180;
          // const radlat2 = (Math.PI * lat2) / 180;
          // const theta = lon1 - lon2;
          // const radtheta = (Math.PI * theta) / 180;
          // let dist = (Math.sin(radlat1) * Math.sin(radlat2)) + (Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta));
          // if (dist > 1) {
          //   dist = 1;
          // }

          // dist = Math.acos(dist);
          // dist = (dist * 180) / Math.PI;
          // dist = dist * 60 * 1.1515;
          //return dist;
        }

        const nameEl = gpxFile.getElementsByTagName('name')[0];
        const name = nameEl ? nameEl.innerHTML : 'Unnamed Track';
        const hasAlts = gpxFile.getElementsByTagName('ele').length;
        const trkpts = gpxFile.getElementsByTagName(tags);
        for (let i = 0; i < trkpts.length; i++) {
          const lat = Number(trkpts[i].getAttribute('lat'));
          const lng = Number(trkpts[i].getAttribute('lon'));
          if (hasAlts) {
            try {
              alt = Number(trkpts[i].getElementsByTagName('ele')[0].innerHTML);
            } catch (err) {
              console.error(err);
            }
          }

          const latlng = { lat, lng, alt };
          coords.push(latlng);
          if (i > 0) {
            lngth += distance(coords[i].lat, coords[i].lng, coords[i - 1].lat, coords[i - 1].lng);
          }
        }

        const popupText = `<p>${name}</p><p>${(lngth * factor).toFixed(3)} ${unit}</p>`;

        const polyline = new Polyline(coords).setStyle({
          color: 'red',
        }).addTo(layerGroup).bindPopup(popupText);

        map.fitBounds(polyline.getBounds());

        new Marker(coords[0], {
          icon: startIcon,
        }).addTo(layerGroup).bindPopup(popupText);
        new Marker(coords[coords.length - 1], {
          icon: endIcon,
        }).addTo(layerGroup).bindPopup(popupText);

        // Elevation diagram
        if (hasAlts) {
          import('./elevation.js')
            .then(elevation => {
            el = elevation.default();
            el.addTo(map);
            el.addData(coords, map);
           });
        }
      }

      button.onclick = () => {
        fileInput.click();
        fileInput.onchange = () => {
          const file = fileInput.files[0];
          if (!file) {
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const parser = new DOMParser();
            const gpx = parser.parseFromString(reader.result, 'text/xml');
            loadGPX(gpx);
          };
          reader.onerror = () => {
            alert('Error reading file');
          };
          reader.readAsText(file);
        };
      };

      return button;
    },
  });

/**
 * Creates a new LoadGPX control instance.
 * @param {Object} options - Leaflet control options
 * @returns {Control.LoadGPX} The LoadGPX control instance
 */
export default options => new Control.LoadGPX(options);
