import { Polyline, latLng } from './leaflet-src.esm.js';

function geodesicPoly() {
  return Polyline.extend({
    setLatLngs(latlngs) {
      this._setLatLngs(geodesicConvertLines(latlngs));
      return this.redraw();
    },
  });
}

function geodesicConvertLine(startLatlng, endLatlng, convertedPoints) {
  const R = 6378137; // Earth radius in meters (doesn't have to be exact)
  const maxlength = 5000; // Meters before splitting
  const toRadians = Math.PI / 180;
  const toDegrees = 180 / Math.PI;
  let f;
  let A;
  let B;
  let x;
  let y;
  let z;
  let fLat;
  let fLng;

  const dLng = Math.abs(endLatlng.lng - startLatlng.lng) * toRadians;
  const lat1 = startLatlng.lat * toRadians;
  const lat2 = endLatlng.lat * toRadians;
  const lng1 = startLatlng.lng * toRadians;
  const lng2 = endLatlng.lng * toRadians;

  // http://en.wikipedia.org/wiki/Great-circle_distance
  const d = Math.atan2(Math.sqrt((Math.cos(lat2) * Math.sin(dLng)) ** 2 + (Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)) ** 2 ), Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng));

  const segments = Math.ceil(d * R / maxlength);
  for (let i = 1; i <= segments; i++) {
    f = i / segments;
    A = Math.sin((1 - f) * d) / Math.sin(d);
    B = Math.sin(f * d) / Math.sin(d);
    x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    z = A * Math.sin(lat1)                  + B * Math.sin(lat2);
    fLat = toDegrees * Math.atan2(z, Math.sqrt((x ** 2) + (y ** 2)));
    fLng = toDegrees * Math.atan2(y, x);

    convertedPoints.push(latLng([fLat, fLng]));
  }
}

function geodesicConvertLines(latlngs) {
  if (latlngs.length) {
    const geodesiclatlngs = [];
    for (let i = 0; i < latlngs.length; i++) {
      if (Array.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
        return;
      }

      latlngs[i] = latLng(latlngs[i]);
    }

    geodesiclatlngs.push(latlngs[0]);
    for (let i = 0; i < latlngs.length - 1; i++) {
      geodesicConvertLine(latlngs[i], latlngs[i + 1], geodesiclatlngs);
    }

    return geodesiclatlngs;
  }
}

const GeodesicPolyline = geodesicPoly();

export default (latlngs, options) => new GeodesicPolyline(latlngs, options);
