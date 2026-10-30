import { writable } from 'svelte/store';

export interface MapCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  maps: MapItem[];
}

export interface MapItem {
  id: string;
  name: string;
  description: string;
}

export const mapCategories: MapCategory[] = [
  {
    id: 'cultural',
    name: 'Cultural Maps',
    description: 'Languages, religions, and civilizations',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    maps: [
      { id: 'languages', name: 'World Languages', description: 'Language families and distribution' },
      { id: 'religions', name: 'World Religions', description: 'Major religions by region' },
      { id: 'ethnicities', name: 'Ethnic Groups', description: 'Major ethnic distributions' },
      { id: 'alphabets', name: 'Writing Systems', description: 'Scripts and alphabets worldwide' },
      { id: 'civilizations', name: 'Historical Civilizations', description: 'Ancient empires and kingdoms' }
    ]
  },
  {
    id: 'language',
    name: 'Language Maps',
    description: 'Linguistic families and dialects',
    icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
    maps: [
      { id: 'indo-european', name: 'Indo-European', description: 'IE language family tree' },
      { id: 'sino-tibetan', name: 'Sino-Tibetan', description: 'Chinese and Tibetan languages' },
      { id: 'afroasiatic', name: 'Afroasiatic', description: 'Semitic, Berber, Cushitic' },
      { id: 'niger-congo', name: 'Niger-Congo', description: 'Bantu and West African' },
      { id: 'austronesian', name: 'Austronesian', description: 'Pacific and Southeast Asian' },
      { id: 'endangered', name: 'Endangered Languages', description: 'Languages at risk of extinction' }
    ]
  },
  {
    id: 'terrain',
    name: 'Terrain Maps',
    description: 'Physical geography and landforms',
    icon: 'M3 17l6-6 4 4 8-8M14 7h7v7',
    maps: [
      { id: 'elevation', name: 'Elevation', description: 'Global topography and relief' },
      { id: 'mountains', name: 'Mountain Ranges', description: 'Major peaks and ranges' },
      { id: 'rivers', name: 'River Systems', description: 'Major rivers and watersheds' },
      { id: 'deserts', name: 'Deserts', description: 'Arid regions worldwide' },
      { id: 'forests', name: 'Forests', description: 'Forest types and coverage' },
      { id: 'tectonic', name: 'Tectonic Plates', description: 'Plate boundaries and activity' }
    ]
  },
  {
    id: 'climate',
    name: 'Climate Maps',
    description: 'Weather patterns and climate zones',
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
    maps: [
      { id: 'koppen', name: 'Köppen Climate', description: 'Climate classification zones' },
      { id: 'temperature', name: 'Temperature', description: 'Average temperatures' },
      { id: 'precipitation', name: 'Precipitation', description: 'Rainfall and snowfall' },
      { id: 'ocean-currents', name: 'Ocean Currents', description: 'Major ocean circulation' },
      { id: 'wind-patterns', name: 'Wind Patterns', description: 'Trade winds and jet streams' }
    ]
  },
  {
    id: 'political',
    name: 'Political Maps',
    description: 'Countries, borders, and governance',
    icon: 'M3 21V3h18v18H3zM9 3v18M3 9h18M3 15h18',
    maps: [
      { id: 'countries', name: 'Countries', description: 'Current national boundaries' },
      { id: 'territories', name: 'Territories', description: 'Dependencies and disputed areas' },
      { id: 'capitals', name: 'Capital Cities', description: 'National capitals' },
      { id: 'timezones', name: 'Time Zones', description: 'Global time zone divisions' },
      { id: 'historical-borders', name: 'Historical Borders', description: 'Borders through history' }
    ]
  },
  {
    id: 'population',
    name: 'Population Maps',
    description: 'Demographics and human settlement',
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    maps: [
      { id: 'density', name: 'Population Density', description: 'People per square km' },
      { id: 'cities', name: 'Major Cities', description: 'Urban centers by population' },
      { id: 'growth', name: 'Population Growth', description: 'Growth rates by country' },
      { id: 'migration', name: 'Migration Patterns', description: 'Human movement flows' },
      { id: 'urbanization', name: 'Urbanization', description: 'Urban vs rural populations' }
    ]
  },
  {
    id: 'economic',
    name: 'Economic Maps',
    description: 'Trade, resources, and development',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    maps: [
      { id: 'gdp', name: 'GDP by Country', description: 'Gross domestic product' },
      { id: 'trade-routes', name: 'Trade Routes', description: 'Major shipping lanes' },
      { id: 'resources', name: 'Natural Resources', description: 'Oil, gas, minerals' },
      { id: 'agriculture', name: 'Agriculture', description: 'Farming and crops' },
      { id: 'internet', name: 'Internet Connectivity', description: 'Global internet access' }
    ]
  },
  {
    id: 'historical',
    name: 'Historical Maps',
    description: 'Maps through time',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    maps: [
      { id: 'ancient-world', name: 'Ancient World (3000 BCE)', description: 'Early civilizations' },
      { id: 'roman-empire', name: 'Roman Empire (117 CE)', description: 'Maximum extent' },
      { id: 'medieval', name: 'Medieval World (1200 CE)', description: 'Kingdoms and empires' },
      { id: 'colonial', name: 'Colonial Era (1914)', description: 'European empires' },
      { id: 'cold-war', name: 'Cold War (1960)', description: 'East vs West' },
      { id: 'world-wars', name: 'World War Fronts', description: 'WWI and WWII' }
    ]
  },
  {
    id: 'environmental',
    name: 'Environmental Maps',
    description: 'Ecosystems and conservation',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    maps: [
      { id: 'biomes', name: 'Biomes', description: 'Major ecosystem types' },
      { id: 'protected-areas', name: 'Protected Areas', description: 'National parks and reserves' },
      { id: 'deforestation', name: 'Deforestation', description: 'Forest loss over time' },
      { id: 'biodiversity', name: 'Biodiversity Hotspots', description: 'Species-rich regions' },
      { id: 'pollution', name: 'Air Quality', description: 'Global pollution levels' }
    ]
  }
];

// Currently selected category
export const selectedCategory = writable<string | null>(null);

// Currently selected map
export const selectedMap = writable<string | null>(null);
