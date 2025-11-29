import { Control, DomUtil, DomEvent } from './leaflet-src.esm.js';

Control.Prefs = Control.extend({
  options: {
    position: 'topright',
  },
  // onRemove(map) {

  // },
  onAdd(map) {
    const button = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom button');
    button.id = 'prefs-button';
    button.innerHTML = '<span style="font-size:10px; font-weight:bold; margin: 2px">Prefs</span>';
    button.title = 'Set preferences';
    // button.style.height = 'auto';
    // button.style.minHeight = '30px';

    function stopEventPropagation(elem) {
      DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick touchmove', DomEvent.stopPropagation);
    }

    let prefsWindow;

    stopEventPropagation(button);

    DomEvent.on(button, 'click', () => {
      if (!prefsWindow) {
        prefsWindow = DomUtil.create('div', '', button);
        prefsWindow.id = 'prefsWindow';
        prefsWindow.style.width = '200px';
        prefsWindow.style.height = 'auto';
        prefsWindow.style.padding = '10px';
        prefsWindow.style.position = 'relative';
        prefsWindow.style.top = '0px';

        stopEventPropagation(prefsWindow);

        const units = [localStorage.getItem('dist'), localStorage.getItem('height')];
        units[0] ||= 'km';
        units[1] ||= 'm';

        let k, miles, metres, ft = '';
        units[0] === 'km' ? k = 'checked' : miles = 'checked';
        units[1] === 'm' ? metres = 'checked' : ft = 'checked';

        prefsWindow.innerHTML = 
          `<p><strong>Distance</strong></p>
          <form id="units">
          <label><input type="radio" value="km" name="dist" ${k}>Km</label>
          <label><input type="radio" value="miles" name="dist" ${miles}>Miles</label>
          </form>
          <form id="height">
          <p><strong>Height</strong></p>
          <label><input type="radio" value="m" name="height" ${metres}>Metres</label>
          <label><input type="radio" value="ft" name="height" ${ft}>Feet</label>
          <p><label><input type="checkbox" id="userDefaultLocation">Save current location and map as default?</label></p>
          </form>
          <button id="close">Close</button>`;

        DomEvent.on(map, 'click', () => {
          closePrefs();
        });
        DomEvent.on(prefsWindow, 'click', e => {
          if (e.target.id === 'close') {
            closePrefs();
          } else if (e.target.id === 'userDefaultLocation' && e.target.checked === true) {
            const centre = map.getCenter();
            let mapLayer = sessionStorage.getItem('layerId');
            mapLayer ||= 'osm';
            localStorage.setItem('userDefaultLocation', `{"lat": ${centre.lat}, "lng": ${centre.lng}, "zoom": ${map.getZoom()}, "layerId": "${mapLayer}"}`);
          } else if (e.target.name === 'dist' || e.target.name === 'height') {
              localStorage.setItem(e.target.name, e.target.value);
          }
        });

        function closePrefs() {
          if (prefsWindow) {
            DomUtil.remove(prefsWindow);
            prefsWindow = null;
          }
        }
      }
    })
    return button;
  },
});

export default options => new Control.Prefs(options);

