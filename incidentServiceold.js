// Real data integration bypass via proxy for RSS
const CORS_PROXY = "https://api.allorigins.win/get?url=";
const RSS_FEED_URL = "https://tengrinews.kz/news.rss"; 

export const ALMATY_LOCATIONS = [
  { name: "Район Медеу", coords: [43.1575, 77.0590], area: "Медеуский р-н", keys: ['медеу', 'достык'] },
  { name: "Центральный парк", coords: [43.2585, 76.9427], area: "Бостандыкский р-н", keys: ['парк', 'гоголя'] },
  { name: "Абая пр. / Толе би", coords: [43.2590, 76.9180], area: "Алмалинский р-н", keys: ['абая', 'толе би'] },
  { name: "Район Самал", coords: [43.2374, 76.9629], area: "Медеуский р-н", keys: ['самал', 'аль-фараби'] },
  { name: "Атакент", coords: [43.2300, 76.9130], area: "Наурызбайский р-н", keys: ['атакент', 'тимирязева'] },
  { name: "Рынок 'Барахолка'", coords: [43.2767, 76.9397], area: "Турксибский р-н", keys: ['барахолка', 'северное'] }
];

const determineLocation = (text) => {
  const lowerText = text.toLowerCase();
  for (const loc of ALMATY_LOCATIONS) {
    for (const key of loc.keys) {
      if (lowerText.includes(key)) {
        // Apply slight GPS jitter so points don't stack directly on each other perfectly
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        return { 
          name: loc.name, 
          area: loc.area, 
          coords: [loc.coords[0] + latOffset, loc.coords[1] + lngOffset] 
        };
      }
    }
  }
  // Fallback to absolute center
  return { 
    name: "Городская сводка", 
    area: "Алматы", 
    coords: [43.2389 + (Math.random() - 0.5) * 0.05, 76.8897 + (Math.random() - 0.5) * 0.05] 
  };
};

const determineCategoryAndColor = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('дтп') || lower.includes('авари') || lower.includes('сбил')) return { cat: 'ДТП', color: 'var(--color-danger)' };
  if (lower.includes('пожар') || lower.includes('огонь') || lower.includes('горит')) return { cat: 'Пожар', color: 'var(--color-warning)' };
  if (lower.includes('задержа') || lower.includes('суд') || lower.includes('полиц') || lower.includes('краж')) return { cat: 'Преступление', color: '#9b59b6' };
  return { cat: 'Событие / ЧП', color: '#3498db' };
};

export const fetchRealIncidents = async (options = {}) => {
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_FEED_URL)}`, { signal: options.signal });
    const data = await response.json();
    
    // Parse the XML String
    const parser = new DOMParser();
    const xml = parser.parseFromString(data.contents, "text/xml");
    const items = Array.from(xml.querySelectorAll("item")).slice(0, 12); // Grab fresh 12 stories
    
    const incidents = items.map((item, i) => {
      const title = item.querySelector("title")?.textContent || "Нет заголовка";
      const description = item.querySelector("description")?.textContent || "Нет описания";
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      
      const timeObj = new Date(pubDate);
      const timeStr = isNaN(timeObj) ? new Date().toLocaleTimeString().slice(0,5) : timeObj.toLocaleTimeString().slice(0,5);

      const locInfo = determineLocation(title + " " + description);
      const visuals = determineCategoryAndColor(title);

      return {
        id: `real-inc-${i}`,
        title: visuals.cat, // Use generic cat for the header
        category: visuals.cat,
        color: visuals.color,
        locationName: locInfo.name,
        area: locInfo.area,
        coords: locInfo.coords,
        time: timeStr,
        description: title // Show the real news headline as the detailed text
      };
    });

    return incidents.length > 0 ? incidents : null;
  } catch (error) {
    console.error("RSS Parsing failed:", error);
    return null;
  }
};
