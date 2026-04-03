// Precise map tracing vectors for Almaty to prevent intersecting buildings.
// Plotted carefully to stay rigidly inside the road polygons of dark-matter maps.

export const ALMATY_ROAD_VECTORS = {
  alfarabi: [
    [43.1970, 76.8400], [43.2030, 76.8500], [43.2081, 76.8623],
    [43.2120, 76.8790], [43.2145, 76.8975], [43.2170, 76.9100],
    [43.2185, 76.9180], [43.2201, 76.9365], [43.2215, 76.9450],
    [43.2250, 76.9580], [43.2268, 76.9642]
  ],
  abay: [
    [43.2388, 76.8845], [43.2380, 76.8920], [43.2385, 76.9050],
    [43.2395, 76.9150], [43.2405, 76.9300], [43.2415, 76.9400],
    [43.2425, 76.9500], [43.2435, 76.9575]
  ],
  seifullin: [
    [43.2201, 76.9365], [43.2250, 76.9370], [43.2300, 76.9380],
    [43.2415, 76.9400], [43.2550, 76.9300], [43.2650, 76.9200],
    [43.2750, 76.9100]
  ],
  dostyk: [
    [43.2100, 76.9625], [43.2150, 76.9630], [43.2200, 76.9635],
    [43.2268, 76.9642], [43.2350, 76.9600], [43.2435, 76.9575],
    [43.2570, 76.9600], [43.2650, 76.9650]
  ],
  rozybakieva: [
    [43.2145, 76.8975], [43.2250, 76.8990], [43.2385, 76.9050],
    [43.2540, 76.9100]
  ],
  tolebi: [
    [43.2510, 76.8665], [43.2530, 76.8900], [43.2540, 76.9100],
    [43.2550, 76.9300], [43.2560, 76.9500], [43.2570, 76.9600]
  ],
  saina: [
    [43.1970, 76.8400], [43.2100, 76.8500], [43.2250, 76.8650],
    [43.2388, 76.8845], [43.2510, 76.8665]
  ],
  nazarbayev: [
    [43.2215, 76.9450], [43.2300, 76.9470], [43.2425, 76.9500],
    [43.2560, 76.9500]
  ]
};

// Advanced interpolator algorithm to slice these precise roads into hundreds of micro-segments
// that can be individually colored to replicate 2GIS's dynamic traffic jams
export const interpolateRoad = (waypoints, subSteps = 5) => {
  const segments = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    for (let j = 0; j < subSteps; j++) {
      const lat1 = p1[0] + (p2[0] - p1[0]) * (j / subSteps);
      const lng1 = p1[1] + (p2[1] - p1[1]) * (j / subSteps);
      const lat2 = p1[0] + (p2[0] - p1[0]) * ((j + 1) / subSteps);
      const lng2 = p1[1] + (p2[1] - p1[1]) * ((j + 1) / subSteps);
      segments.push([[lat1, lng1], [lat2, lng2]]);
    }
  }
  return segments;
};
