export default function saveGpx(coords) {
  if (!coords || coords.length < 1) return; 
  let gpxTrack = '';
  let el; // Is there elevation data?
  coords.forEach(coord => {
    coord.alt ? el = `<ele>${coord.alt}</ele>` : el = '';
    gpxTrack += `<trkpt lat="${coord.lat}" lon="${coord.lng}">${el}</trkpt>\n`;
  });

  const gpx = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n
    <gpx xmlns="http://www.topografix.com/GPX/1/1"  creator="DonMaps" version=
    "1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation=
    "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n
    <trk>\n<name>gpx-track</name>\n<trkseg>\n${gpxTrack}</trkseg>\n</trk>\n</gpx>`;

  const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = URL.createObjectURL(new Blob([gpx], {
      type: 'text/csv;encoding:utf-8',
    }));
    a.download = 'gpx-track.gpx';
    a.click();
    document.body.removeChild(a);
  }
