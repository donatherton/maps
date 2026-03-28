'use strict';
import { Control, DomUtil, DomEvent } from './leaflet-src.esm.js';

/**
 * Leaflet control for fullscreen mode.
 * @type {Object}
 */
Control.FullScreen = Control.extend({
    options: {
      position: 'topleft',
    },

    /**
     * Creates the fullscreen toggle button.
     * @param {Object} map - The Leaflet map instance
     * @returns {HTMLElement} The control button element
     */
    onAdd(map) {
      const button = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom fullscreen button');
      button.title = 'Fullscreen';

      DomEvent.on(button, 'click contextmenu mousedown mousewheel dblclick', DomEvent.stopPropagation);

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
    },
  });

/**
 * Creates a new FullScreen control instance.
 * @param {Object} options - Leaflet control options
 * @returns {Control.FullScreen} The FullScreen control instance
 */
export default options => new Control.FullScreen(options);
