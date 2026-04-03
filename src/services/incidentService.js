// Real data integration bypass via proxy for RSS
const RSS2JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";
const RSS_FEED_URL = "https://tengrinews.kz/news.rss"; 

export const ALMATY_LOCATIONS = [
  { name: 'пр. Аль-Фараби', area: 'Бостандыкский р-н', coords: [43.2185, 76.9180], keys: ['аль-фараби', 'саина', 'достык', 'омаровой'] },
  { name: 'пр. Абая', area: 'Алмалинский р-н', coords: [43.2405, 76.9300], keys: ['абая', 'комсомольск', 'толе би'] },
  { name: 'пр. Сейфуллина', area: 'Алмалинский р-н', coords: [43.2550, 76.9300], keys: ['сейфуллина', 'раимбека', 'ташкентск'] },
  { name: 'ул. Розыбакиева', area: 'Бостандыкский р-н', coords: [43.2250, 76.8990], keys: ['розыбакиева', 'жарокова', 'гагарина'] },
  { name: 'пр. Рыскулова', area: 'Алатауский р-н', coords: [43.2750, 76.8650], keys: ['рыскулова', 'момышулы', 'ахрименко'] },
  { name: 'пр. Назарбаева', area: 'Медеуский р-н', coords: [43.2425, 76.9500], keys: ['назарбаева', 'фурманова', 'кунаева'] },
  { name: 'ул. Ауэзова', area: 'Бостандыкский р-н', coords: [43.2350, 76.9000], keys: ['ауэзова', 'байтурсынова', 'маркова'] },
  { name: 'ВОАД', area: 'Медеуский р-н', coords: [43.2450, 76.9750], keys: ['восточн', 'воад', 'кюль-тегин'] },
  { name: 'ул. Гоголя', area: 'Алмалинский р-н', coords: [43.2590, 76.9450], keys: ['макатаева', 'гоголя', 'жибек'] },
  { name: 'пр. Суюнбая', area: 'Турксибский р-н', coords: [43.3000, 76.9550], keys: ['суюнбая', 'хмельницк', 'майлина'] },
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

const RSS_FEEDS = [
  "https://tengrinews.kz/news.rss",
  "https://www.zakon.kz/rss/rss-all.xml",
  "https://news.yandex.ru/Almaty/index.rss"
];

export const fetchRealIncidents = async (options = {}, onFeedLoaded = null) => {
  try {
    const now = Date.now();
    const uniqueItems = []; // Keep track across feeds

    const getWords = str => str.toLowerCase().replace(/[^\wа-яё]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    const isDuplicate = (title1, title2) => {
      const w1 = getWords(title1);
      const w2 = getWords(title2);
      if(w1.length === 0 || w2.length === 0) return false;
      const intersection = w1.filter(w => w2.includes(w));
      return (intersection.length / Math.min(w1.length, w2.length)) > 0.6; 
    };

    const promises = RSS_FEEDS.map(feed => 
      fetch(`${RSS2JSON_API}${encodeURIComponent(feed)}`, { signal: options.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (!data || data.status !== 'ok' || !Array.isArray(data.items)) return;
            
            const newFeedUnique = [];
            for (const item of data.items) {
               const titleStr = (item.title || '').trim();
               const text = (titleStr + ' ' + (item.description || '')).toLowerCase();
               
               // VERY lenient filtering: just require "алмат" OR "almaty" OR specific emergency words (sometimes they don't mention the city)
               if (!text.includes('алмат') && !text.includes('almaty') && !text.includes('дтп') && !text.includes('пожар') && !text.includes('чс')) continue;
               
               if (!uniqueItems.some(existing => isDuplicate(existing.title, titleStr))) {
                  uniqueItems.push(item);
                  newFeedUnique.push(item);
               }
            }
            
            if (newFeedUnique.length > 0 && onFeedLoaded) {
               const incidents = newFeedUnique.slice(0, 15).map((item, i) => {
                  const title = item.title || "Событие зафиксировано";
                  const description = item.description ? item.description.replace(/<[^>]*>?/gm, '') : title;
                  const pubDate = item.pubDate || new Date().toISOString();
                  
                  const timeObj = new Date(pubDate);
                  const timeStr = isNaN(timeObj) ? new Date().toLocaleTimeString('ru-RU').slice(0,5) : timeObj.toLocaleTimeString('ru-RU').slice(0,5);

                  const locInfo = determineLocation(title + " " + description);
                  const visuals = determineCategoryAndColor(title);

                  return {
                    id: `real-rss-${Math.random().toString(36).substr(2, 9)}`,
                    title: title.length > 55 ? title.substring(0, 55) + '...' : title, 
                    category: visuals.cat,
                    color: visuals.color,
                    severity: (visuals.cat === 'ДТП' || visuals.cat === 'Пожар') ? 'critical' : 'warning',
                    locationName: locInfo.name,
                    area: locInfo.area || 'Алматы',
                    coords: locInfo.coords,
                    time: timeStr,
                    description: description 
                  };
               });
               onFeedLoaded(incidents);
            }
        })
        .catch(() => null)
    );

    await Promise.all(promises);
    return null;
  } catch (error) {
    if (error.name !== 'AbortError') console.error("RSS Parsing failed:", error);
    return null;
  }
};
