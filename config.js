function hashStore() {
  const hash = {
		orsHash: '5b3ce3597851110001cf624831f2d1f9129542dfbd9a148cd579f14b',
	// Thunderforest
		tfHash: '7ed505f1f5c74490a48dd43c46fee729',
		defaultLocation: [50.157876, -5.072937],
		defaultZoom: 14,
		layer: 'osm',
		orsDefaults: {
			profile: 'foot-walking',
			preference: 'shortest',
		}
	}
  return () => {
    return hash;
  };
};
const getHash = hashStore()
