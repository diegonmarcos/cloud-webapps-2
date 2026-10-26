#!/usr/bin/env node
/**
 * Script to fetch all movie data from OMDB and save locally
 * Run: node scripts/fetch-movie-data.js
 * Flags: --force  Re-fetch all movies (skip incremental cache)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.OMDB_API_KEY || '2d299e69';
const FORCE = process.argv.includes('--force');

// All movie IDs from the app — keys match ViewType values
const ALL_IDS = {
  home: [
    'tt3566834', 'tt12299608', 'tt31193180', 'tt10954718', 'tt27714946',
    'tt14107334', 'tt7181546', 'tt20969586', 'tt11655566', 'tt10676052',
    'tt14539740', 'tt21064584', 'tt14921174', 'tt6263850', 'tt13622970', 'tt10146532'
  ],
  series2025: [
    'tt26669477', 'tt14452776', 'tt21216156', 'tt5753856', 'tt14681924',
    'tt13622776', 'tt11280740', 'tt2560140', 'tt14688458', 'tt6468322',
    'tt1190634', 'tt9253284', 'tt9288030', 'tt14452590', 'tt12809988'
  ],
  ghibli: [
    'tt0245429', 'tt0096283', 'tt0212205', 'tt0119698', 'tt0097814',
    'tt0092067', 'tt0087544', 'tt0104652', 'tt0095327', 'tt2013293',
    'tt0876563', 'tt1568921'
  ],
  european: [
    'tt0211915', 'tt0118799', 'tt0095765', 'tt0082096', 'tt0317248',
    'tt0405094', 'tt0381681', 'tt1255953', 'tt2278388', 'tt0986264',
    'tt0338013', 'tt0467406', 'tt0120663', 'tt0101414', 'tt0113247'
  ],
  newnoirs: [
    'tt0114369', 'tt0209144', 'tt0169547', 'tt0144084', 'tt0137523',
    'tt0110912', 'tt0266697', 'tt1853728', 'tt0816692', 'tt1130884',
    'tt0482571', 'tt0993846', 'tt2267998', 'tt7286456', 'tt1950186'
  ],
  scifi: [
    'tt0816692', 'tt0133093', 'tt0062622', 'tt0083658', 'tt0078748',
    'tt0090605', 'tt0088763', 'tt0103064', 'tt0076759', 'tt0080684',
    'tt0117731', 'tt0181689', 'tt0470752', 'tt1856101', 'tt0499549',
    'tt1392190', 'tt2543164', 'tt1160419', 'tt15239678', 'tt0118929'
  ],
  staffpicks: [
    'tt0111161', 'tt0068646', 'tt0468569', 'tt0108052', 'tt0167260',
    'tt0110912', 'tt0137523', 'tt0109830', 'tt0080684', 'tt0133093',
    'tt0099685', 'tt0816692', 'tt0120737', 'tt0073486', 'tt1375666'
  ],
  epics: [
    'tt0056172', 'tt0052618', 'tt0112573', 'tt0172495', 'tt0167260',
    'tt0120737', 'tt0167261', 'tt0108052', 'tt0120815', 'tt0816692',
    'tt1375666', 'tt0082971', 'tt0047396', 'tt0033467', 'tt0043014'
  ],
  thrillers: [
    'tt0102926', 'tt0114369', 'tt0081505', 'tt0078748', 'tt0054215',
    'tt0209144', 'tt0482571', 'tt1130884', 'tt0114814', 'tt0110413',
    'tt0071562', 'tt0068646', 'tt0099685', 'tt0105236', 'tt0317248'
  ],
  epicseries: [
    'tt0903747', 'tt0306414', 'tt0141842', 'tt0944947', 'tt5491994',
    'tt0804503', 'tt1475582', 'tt0386676', 'tt0098904', 'tt0108778',
    'tt2356777', 'tt2861424', 'tt4574334', 'tt0475784', 'tt7366338',
    'tt0412142', 'tt0185906', 'tt5180504', 'tt2442560', 'tt8111088',
    'tt1856010', 'tt0413573', 'tt0460649', 'tt1520211', 'tt0773262'
  ],
  oscars2025: [
    'tt28607951', 'tt8999762', 'tt11563598', 'tt20215234', 'tt15239678',
    'tt20221436', 'tt14745616', 'tt23055660', 'tt17526714', 'tt1262426'
  ],
  oscars2024: [
    'tt15398776', 'tt23561236', 'tt17009710', 'tt1517268', 'tt14849194',
    'tt5537002', 'tt5535276', 'tt13238346', 'tt14230458', 'tt7160372'
  ],
  oscars2023: [
    'tt6710474', 'tt1016150', 'tt1630029', 'tt11813216', 'tt3704428',
    'tt14208870', 'tt14444726', 'tt1745960', 'tt7322224', 'tt13669038'
  ],
  oscars2022: [
    'tt10366460', 'tt12789558', 'tt11286314', 'tt14039582', 'tt1160419',
    'tt9620288', 'tt11271038', 'tt7740496', 'tt10293406', 'tt3581652'
  ],
  oscars2021: [
    'tt9770150', 'tt10272386', 'tt9784798', 'tt10618286', 'tt10633456',
    'tt9620292', 'tt5363618', 'tt1070874'
  ],
  oscars2020: [
    'tt6751668', 'tt8579674', 'tt1950186', 'tt1302006', 'tt2584384',
    'tt7286456', 'tt3281548', 'tt7653254', 'tt7131622'
  ],
  spielberg: [
    'tt0108052', 'tt0120815', 'tt0082971', 'tt0107290', 'tt0078723',
    'tt0083866', 'tt0116209', 'tt0093779', 'tt0118607', 'tt0102057'
  ],
  scorsese: [
    'tt0407887', 'tt0099685', 'tt0081398', 'tt0075314', 'tt0112641',
    'tt1663202', 'tt1302006', 'tt0364569', 'tt0070379', 'tt0319061'
  ],
  eastwood: [
    'tt0105695', 'tt0327056', 'tt0405159', 'tt1205489', 'tt0064116',
    'tt0060196', 'tt0066999', 'tt0097576', 'tt0107206', 'tt1057500'
  ],
  kubrick: [
    'tt0081505', 'tt0062622', 'tt0066921', 'tt0093058', 'tt0057012',
    'tt0120663', 'tt0069293', 'tt0056193', 'tt0055630', 'tt0049406'
  ],
  nolan: [
    'tt1375666', 'tt0468569', 'tt0816692', 'tt0209144', 'tt0482571',
    'tt1345836', 'tt0372784', 'tt5013056', 'tt6723592', 'tt15398776'
  ],
  tarantino: [
    'tt0110912', 'tt0105236', 'tt0266697', 'tt0378194', 'tt0361748',
    'tt1853728', 'tt3460252', 'tt7131622', 'tt0116367', 'tt0119396'
  ],
  streep: [
    'tt0079522', 'tt0084707', 'tt1454029', 'tt0477348', 'tt0093822',
    'tt0082979', 'tt0112579', 'tt0118749', 'tt1020072', 'tt1663662'
  ],
  nicholson: [
    'tt0073486', 'tt0118799', 'tt0086425', 'tt0071315', 'tt0081505',
    'tt0099348', 'tt0112573', 'tt0361748', 'tt0338135', 'tt0093773'
  ],
  alpacino: [
    'tt0068646', 'tt0071562', 'tt0099685', 'tt0110413', 'tt0071315',
    'tt0072890', 'tt0057565', 'tt0119217', 'tt0087089', 'tt0099348'
  ],
  deniro: [
    'tt0071562', 'tt0081398', 'tt0075314', 'tt0099685', 'tt0112641',
    'tt0119217', 'tt1302006', 'tt0088944', 'tt0082979', 'tt0317248'
  ],
  hanks: [
    'tt0109830', 'tt0107818', 'tt0108160', 'tt0120815', 'tt0112384',
    'tt0120689', 'tt0162222', 'tt0338751', 'tt0096463', 'tt0862846'
  ],
  dicaprio: [
    'tt1663202', 'tt1375666', 'tt0407887', 'tt0993846', 'tt3659388',
    'tt1130884', 'tt0363163', 'tt1355644', 'tt0119217', 'tt5537002'
  ],
  // === PRESTIGE SERIES ===
  prestige20m: [
    'tt7631058',  // The Rings of Power
    'tt9794044',  // Citadel
    'tt4574334',  // Stranger Things
    'tt9253284',  // Andor
    'tt13157618', // Secret Invasion
    'tt2640044',  // Masters of the Air
    'tt9140560',  // WandaVision
    'tt9140554',  // Loki
    'tt12262202', // The Acolyte
    'tt18335752', // 1923
    'tt0374463',  // The Pacific
    'tt11198330', // House of the Dragon
    'tt13016388', // 3 Body Problem
    'tt11280740'  // Severance
  ],
  prestigepre22: [
    'tt0374463',  // The Pacific
    'tt0108757',  // ER
    'tt9140560',  // WandaVision
    'tt0185906',  // Band of Brothers
    'tt0108778',  // Friends
    'tt8111088',  // The Mandalorian
    'tt7203552',  // The Morning Show
    'tt7949218',  // See
    'tt0944947',  // Game of Thrones
    'tt4786824',  // The Crown
    'tt0475784'   // Westworld
  ],
  prestigetier2: [
    'tt4592410',  // The Get Down
    'tt7462410',  // Wheel of Time
    'tt0384766',  // Rome
    'tt13668894', // The Book of Boba Fett
    'tt11126994', // Arcane
    'tt1190634',  // The Boys
    'tt3186130',  // Vinyl
    'tt5180504',  // The Witcher
    'tt7660850',  // Succession
    'tt2431438',  // Sense8
    'tt2189461'   // Marco Polo
  ]
};

// Get unique IDs
const uniqueIds = [...new Set(Object.values(ALL_IDS).flat())];
console.log(`Total unique movies: ${uniqueIds.length}`);

async function fetchMovie(id) {
  return new Promise((resolve, reject) => {
    const url = `https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function downloadPoster(url, filename) {
  if (!url || url === 'N/A') return null;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(filename, () => {});
        return downloadPoster(res.headers.location, filename).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {});
      reject(err);
    });
  });
}

async function main() {
  // Vite root is src/, so public dir is src/public/
  const posterDir = path.join(__dirname, '../src/public/posters');
  const dataDir = path.join(__dirname, '../src/data');

  // Create directories
  if (!fs.existsSync(posterDir)) fs.mkdirSync(posterDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Load existing data for incremental mode
  const moviesPath = path.join(dataDir, 'movies.json');
  let movieData = {};
  if (!FORCE && fs.existsSync(moviesPath)) {
    try {
      movieData = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));
      console.log(`Loaded ${Object.keys(movieData).length} existing movies (incremental mode)`);
    } catch (e) {
      console.log('Could not parse existing movies.json, starting fresh');
      movieData = {};
    }
  }

  let fetched = 0;
  let skipped = 0;

  for (let i = 0; i < uniqueIds.length; i++) {
    const id = uniqueIds[i];
    const posterFile = `${id}.jpg`;
    const posterPath = path.join(posterDir, posterFile);

    // Incremental: skip if already have data + poster
    if (!FORCE && movieData[id] && fs.existsSync(posterPath)) {
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${uniqueIds.length}] Fetching ${id}...`);

    try {
      const movie = await fetchMovie(id);

      if (movie.Response === 'True') {
        // Download poster
        if (movie.Poster && movie.Poster !== 'N/A') {
          try {
            await downloadPoster(movie.Poster, posterPath);
            console.log(`  Downloaded poster for ${movie.Title}`);
          } catch (e) {
            console.log(`  Failed to download poster: ${e.message}`);
          }
        }

        movieData[id] = {
          imdbID: movie.imdbID,
          Title: movie.Title,
          Year: movie.Year,
          Type: movie.Type,
          Poster: `posters/${posterFile}`,
          imdbRating: movie.imdbRating,
          Plot: movie.Plot,
          Genre: movie.Genre,
          Director: movie.Director,
          Actors: movie.Actors,
          Runtime: movie.Runtime
        };
        fetched++;
      } else {
        console.log(`  Error: ${movie.Error}`);
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.log(`  Error fetching ${id}: ${e.message}`);
    }
  }

  // Save movie data
  fs.writeFileSync(moviesPath, JSON.stringify(movieData, null, 2));

  // Save categorized lists (only IDs that were successfully fetched)
  const categories = {};
  for (const [category, ids] of Object.entries(ALL_IDS)) {
    categories[category] = ids.filter(id => movieData[id]);
  }

  fs.writeFileSync(
    path.join(dataDir, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );

  console.log(`\nDone! Fetched: ${fetched}, Skipped: ${skipped}, Total: ${Object.keys(movieData).length} movies.`);
}

main().catch(console.error);
