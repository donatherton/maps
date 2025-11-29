import  { CircleMarker, Control, DomEvent, DomUtil } from './leaflet-src.esm.js';

Control.FindLocation = Control.extend({
    options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom location-button button');
      button.title = 'Get your current location';
      
      DomEvent.on(button, 'click contextmenu mousedown mousewheel dblclick', DomEvent.stopPropagation);

      let i = true;
      let id;
      let mark;
      button.onclick = () => {
        if (i) {
          if (navigator.geolocation) {
            button.style.backgroundColor = 'red';
            i = false;
            mark = new CircleMarker([0, 0]).addTo(map);
            id = navigator.geolocation.watchPosition(position => {
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              mark.setLatLng([lat, lon]);
              map.setView([lat, lon]);
            },

            () => {
              alert("Can't find you");
            },

              { enableHighAccuracy: true, timeout: 50000 });
          } else alert('No geolocation');
        } else {
          if (mark) {
            if (map.hasLayer(mark)) map.removeLayer(mark);
          }

          navigator.geolocation.clearWatch(id);
          button.style.backgroundColor = 'white';
          i = true;
        }
      };

      return button;
    },
  });

export default options => new Control.FindLocation(options);
