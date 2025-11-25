import { Control, DomUtil, DomEvent, DivIcon, LayerGroup, Polyline, Marker } from './leaflet-src.esm.js';

Control.LoadGPX = Control.extend({
      options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom load-gpx button');
      button.title = 'Load a GPX file';

      DomEvent.on(button, 'click contextmenu mousedown mousewheel dblclick', DomEvent.stopPropagation);

      // Create an invisible file input
      const fileInput = DomUtil.create('input', '', button);
      fileInput.type = 'file';
      fileInput.accept = '.gpx';
      fileInput.style.display = 'none';

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
        const resetWindow = (options) => {
          return new Control.ResetWindow(options);
        };
        resetWindow({ position: 'topright' }).addTo(map);

        let alt = null;
        const coords = [];
        let lngth = 0;
        let tags;
        const unit = localStorage.getItem('dist') === 'km' ? 'Km' : 'miles';
        const factor = unit === 'km' ? 1.609344 : 1;
        let el;

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

        function distance(lat1, lon1, lat2, lon2) {
          if ((lat1 === lat2) && (lon1 === lon2)) {
            return 0;
          }
          const radlat1 = (Math.PI * lat1) / 180;
          const radlat2 = (Math.PI * lat2) / 180;
          const theta = lon1 - lon2;
          const radtheta = (Math.PI * theta) / 180;
          let dist = (Math.sin(radlat1) * Math.sin(radlat2)) + (Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta));
          if (dist > 1) {
            dist = 1;
          }
          dist = Math.acos(dist);
          dist = (dist * 180) / Math.PI;
          dist = dist * 60 * 1.1515;
          return dist;
        }

        const name = gpxFile.getElementsByTagName('name')[0].innerHTML;
        const hasAlts = gpxFile.getElementsByTagName('ele').length;
        const trkpts = gpxFile.getElementsByTagName(tags);
        for (let i = 0; i < trkpts.length; i++) {
          const lat = Number(trkpts[i].getAttribute('lat'));
          const lng = Number(trkpts[i].getAttribute('lon'));
          if (hasAlts) {
            try {
              alt = Number(trkpts[i].getElementsByTagName('ele')[0].innerHTML);
            }
            catch(err) {
              console.log(err);
            }
          }
          const latlng = { lat, lng, alt };
          coords.push(latlng);
          if (i > 0) {
            lngth += distance(coords[i].lat, coords[i].lng, coords[i - 1].lat, coords[i - 1].lng);
          }
        }

        const layerGroup = new LayerGroup().addTo(map);

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
            .then( elevation => {
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
          const reader = new FileReader();
          reader.onload = () => {
            const parser = new DOMParser();
            const gpx = parser.parseFromString(reader.result, 'text/xml');
            loadGPX(gpx);
          };
          reader.readAsText(file);
        };
      };
      return button;
    }
  });

export default (options) => {
  return new Control.LoadGPX(options);
};
