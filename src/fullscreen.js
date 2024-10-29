'use strict'
L.Control.FullScreen = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd(map) {
    const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom fullscreen');
    button.setAttribute('title', 'Fullscreen');

    button.style.backgroundColor = 'white';
    button.style.backgroundSize = '25px 25px';
    button.style.width = '25px';
    button.style.height = '25px';
    button.style.cursor = 'pointer';

    button.onclick = function () {
      const isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null)
		|| (document.webkitFullscreenElement && document.webkitFullscreenElement !== null)
		|| (document.mozFullScreenElement && document.mozFullScreenElement !== null)
		|| (document.msFullscreenElement && document.msFullscreenElement !== null);

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
    L.DomEvent
      .on(button, 'click', L.DomEvent.stopPropagation);
    return button;
  },
});
L.control.fullScreen = function (options) {
  return new L.Control.FullScreen(options);
};
L.control.fullScreen({

}).addTo(map);
