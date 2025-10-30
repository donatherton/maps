import * as L from './leaflet-src.esm.js';

L.Control.FullScreen = L.Control.extend({
    options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom fullscreen');
      button.title = 'Fullscreen';

      L.DomEvent.on(button, 'click contextmenu mousedown mousewheel dblclick', L.DomEvent.stopPropagation);

      button.onclick = () => {
        const isInFullScreen = (document.fullscreenElement && document.fullscreenElement)
          || (document.webkitFullscreenElement && document.webkitFullscreenElement)
          || (document.mozFullScreenElement && document.mozFullScreenElement)
          || (document.msFullscreenElement && document.msFullscreenElementnull);

        const docElm = document.getElementById('map');
        if (!isInFullScreen) {
          if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
          } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
          } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
          } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
          }
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      };
      return button;
    }
  });
const fullScreen = function (options) {
  return new L.Control.FullScreen(options);
};

export default fullScreen;
