// node --test tests/ — the pure half of the legal multi-source player.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as C from '../src/lib/sources-core.mjs'

const raw = JSON.parse(readFileSync(new URL('../src/data/sources.json', import.meta.url), 'utf8'))
const deny = JSON.parse(readFileSync(new URL('../src/data/legal-denylist.json', import.meta.url), 'utf8')).denylist
const decl = C.parseSources(raw, deny)
test('denylist: separate file, sources pass it', () => { assert.ok(deny.length >= 10); assert.equal(raw.denylist, undefined) })
const ranges = (...p) => ({ length: p.length, start: (i) => p[i][0], end: (i) => p[i][1] })

test('source list: parses, orders, keeps only known kinds', () => {
  assert.ok(decl.sources.length >= 8)
  assert.deepEqual(decl.sources.map((s) => s.order), decl.sources.map((s) => s.order).slice().sort((a, b) => a - b))
  for (const k of ['library', 'local', 'providers', 'trailer', 'catalogue', 'torrent']) assert.ok(decl.sources.some((s) => s.kind === k), k)
  assert.ok(decl.sources.every((s) => s.name && Array.isArray(s.settings)))
})
test('source list: rejects bad kind, duplicate ids, denied domains, disabled filtered', () => {
  assert.throws(() => C.parseSources({ sources: [{ id: 'x', kind: 'pirate' }] }), /unknown kind/)
  assert.throws(() => C.parseSources({ sources: [{ id: 'a', kind: 'local' }, { id: 'a', kind: 'local' }] }), /duplicate/)
  assert.throws(() => C.parseSources({ denylist: ['vid' + 'src'], sources: [{ id: 'v', kind: 'catalogue', search: 'https://' + 'vid' + 'src.cc/{query}' }] }), /denied/)
  assert.throws(() => C.parseSources({}), /array/)
  assert.equal(C.parseSources({ sources: [{ id: 'a', kind: 'local', enabled: false }] }).sources.length, 0)
})
test('source list: no credential is committed', () => {
  assert.doesNotMatch(JSON.stringify(raw), /api_key=[0-9a-f]{16}|X-Plex-Token=[A-Za-z0-9]{10}|"token"\s*:\s*"[^"]/)
})

test('ID conversion: IMDb -> TMDB via /find, preferring the asked type', async () => {
  const res = { movie_results: [{ id: 603, title: 'The Matrix', release_date: '1999-03-30' }], tv_results: [{ id: 1399, name: 'Game of Thrones', first_air_date: '2011-04-17' }] }
  assert.deepEqual(C.tmdbFromFind(res, 'movie'), { tmdbId: 603, mediaType: 'movie', title: 'The Matrix', year: '1999' })
  assert.deepEqual(C.tmdbFromFind(res, 'series'), { tmdbId: 1399, mediaType: 'tv', title: 'Game of Thrones', year: '2011' })
  assert.deepEqual(C.tmdbFromFind({ movie_results: [], tv_results: [{ id: 7 }] }, 'movie'), { tmdbId: 7, mediaType: 'tv', title: '', year: '' })
  assert.equal(C.tmdbFromFind({ movie_results: [], tv_results: [] }, 'movie'), null)
  assert.equal(C.findUrl('tt0133093', 'K'), 'https://api.themoviedb.org/3/find/tt0133093?external_source=imdb_id&api_key=K')
  let asked
  const r = await C.imdbToTmdb(async (u) => { asked = u; return res }, 'tt0133093', 'movie', 'K')
  assert.equal(r.tmdbId, 603); assert.match(asked, /\/find\/tt0133093/)
  assert.equal(await C.imdbToTmdb(async () => res, 'nope', 'movie', 'K'), null)
  assert.equal(await C.tmdbToImdb(async (u) => (assert.match(u, /\/tv\/1399\/external_ids/), { imdb_id: 'tt0944947' }), 1399, 'series', 'K'), 'tt0944947')
})

test('provider mapping: categories, order, logos, deep links, region', () => {
  const res = { results: { ES: {
    link: 'https://www.themoviedb.org/movie/603/watch?locale=ES',
    flatrate: [{ provider_id: 337, provider_name: 'Disney Plus', logo_path: '/d.jpg', display_priority: 2 }, { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priority: 1 }],
    rent: [{ provider_id: 99999, provider_name: 'Shop', logo_path: '/s.jpg' }],
    ads: [{ provider_id: 73, provider_name: 'Tubi', logo_path: '/t.jpg' }]
  } } }
  const g = C.mapProviders(res, 'es', 'The Matrix', decl.providerLinks)
  assert.deepEqual(g.map((x) => x.category), ['flatrate', 'ads', 'rent'])
  assert.deepEqual(g[0].services.map((s) => s.name), ['Netflix', 'Disney Plus'])
  assert.equal(g[0].services[0].link, 'https://www.netflix.com/search?q=The%20Matrix')
  assert.equal(g[0].services[0].logo, 'https://image.tmdb.org/t/p/w92/n.jpg')
  assert.equal(g[1].services[0].link, 'https://tubitv.com/search/The%20Matrix')
  assert.equal(g[2].services[0].link, res.results.ES.link, 'unknown provider -> TMDB region page')
  assert.equal(g[1].label, 'Free with ads')
  assert.deepEqual(C.mapProviders(res, 'US', 'x', {}), [])
})

test('trailer: official YouTube Trailer wins', () => {
  const t = C.pickTrailer({ results: [
    { site: 'YouTube', type: 'Featurette', key: 'aaaaaaaaaaa', official: true },
    { site: 'Vimeo', type: 'Trailer', key: 'bbbbbbbbbbb', official: true },
    { site: 'YouTube', type: 'Trailer', key: 'ccccccccccc', official: false },
    { site: 'YouTube', type: 'Trailer', key: 'm8e-FF8MsqU', official: true, name: 'Official Trailer' }] })
  assert.equal(t.key, 'm8e-FF8MsqU'); assert.equal(t.embed, 'https://www.youtube-nocookie.com/embed/m8e-FF8MsqU?autoplay=1')
  assert.equal(C.pickTrailer({ results: [{ site: 'YouTube', type: 'Clip', key: 'ddddddddddd' }] }), null)
})

test('Internet Archive: search URL, title/year match, playable file, torrent', () => {
  const arch = decl.sources.find((s) => s.id === 'archive'), tor = decl.sources.find((s) => s.id === 'archive-torrent')
  assert.match(C.archiveSearchUrl(arch, 'Nosferatu'), /^https:\/\/archive\.org\/advancedsearch\.php\?q=title%3A\(Nosferatu\)%20AND%20mediatype%3Amovies/)
  const res = { response: { docs: [{ identifier: 'nos-1979', title: 'Nosferatu', year: 1979 }, { identifier: 'nosferatu-1922', title: 'Nosferatu (1922)', year: 1922 }, { identifier: 'other', title: 'Metropolis' }] } }
  assert.equal(C.matchArchive(res, 'Nosferatu', '1922'), 'nosferatu-1922')
  assert.equal(C.matchArchive(res, 'Metropolis', '1927'), 'other')
  assert.equal(C.matchArchive(res, 'Alien', '1979'), null)
  assert.equal(C.archivePlayable({ metadata: { identifier: 'nosferatu-1922' }, files: [{ name: 'a.ogv' }, { name: 'Nosferatu 1922.mp4', format: 'h.264' }] }), 'https://archive.org/download/nosferatu-1922/Nosferatu%201922.mp4')
  assert.equal(C.archiveTorrentUrl(tor, 'nosferatu-1922'), 'https://archive.org/download/nosferatu-1922/nosferatu-1922_archive.torrent')
  const tr = C.archiveTorrentResults(res, tor)
  assert.ok(tr.every((r) => r.badge === 'Internet Archive' && r.torrent.endsWith('_archive.torrent')))
})

test('libraries: Jellyfin / Emby / Plex query and stream URLs', () => {
  const jf = decl.sources.find((s) => s.id === 'jellyfin'), em = decl.sources.find((s) => s.id === 'emby')
  const cfg = { url: 'https://jf.example/', token: 'T' }
  assert.equal(C.jellyfinSearchUrl(jf, cfg, 'tt1'), 'https://jf.example/Items?Recursive=true&IncludeItemTypes=Movie,Series&Fields=ProviderIds&AnyProviderIdEquals=imdb.tt1&api_key=T')
  assert.match(C.jellyfinSearchUrl(em, cfg, 'tt1'), /^https:\/\/jf\.example\/emby\/Items\?/)
  assert.equal(C.jellyfinMatch(jf, cfg, { Items: [{ Id: 'x1', Name: 'M', Type: 'Movie', ProviderIds: { Imdb: 'tt1' } }] }, 'tt1').url, 'https://jf.example/Videos/x1/stream?static=true&api_key=T')
  assert.equal(C.jellyfinMatch(jf, cfg, { Items: [{ Id: 'x2', ProviderIds: { Imdb: 'tt9' } }] }, 'tt1'), null)
  assert.equal(C.plexSearchUrl(cfg, 'tt1'), 'https://jf.example/library/all?guid=imdb%3A%2F%2Ftt1&X-Plex-Token=T')
  assert.equal(C.plexMatch(cfg, { MediaContainer: { Metadata: [{ title: 'M', Media: [{ Part: [{ key: '/library/parts/5/file.mkv' }] }] }] } }).url, 'https://jf.example/library/parts/5/file.mkv?X-Plex-Token=T')
  assert.equal(C.plexMatch(cfg, { MediaContainer: {} }), null)
})

test('local files: id first, then title + year', () => {
  const files = ['Movies/The Matrix (1999).mkv', 'Movies/Matrix Reloaded 2003.mp4', 'x/tt0062622.mp4', 'notes.txt']
  assert.equal(C.matchLocalFile(files, '2001: A Space Odyssey', '1968', 'tt0062622'), 'x/tt0062622.mp4')
  assert.equal(C.matchLocalFile(files, 'The Matrix', '1999'), 'Movies/The Matrix (1999).mkv')
  assert.equal(C.matchLocalFile(files, 'The Matrix', '2021'), null)
  assert.equal(C.driveFileUrl({ url: 'https://d/' }, '/a b/c.mp4'), 'https://d/a%20b/c.mp4')
})

test('buffering: modes, ahead-of-playhead, ready rule, offline', () => {
  assert.deepEqual(C.BUFFER_MODES.map((m) => m.id), ['30s', '2m', '10m', 'full', 'offline'])
  assert.equal(C.bufferPolicy('2m').ahead, 120)
  assert.equal(C.bufferPolicy('bogus').id, '30s')
  assert.equal(C.bufferedAhead(ranges([0, 10], [20, 95]), 30), 65)
  assert.equal(C.bufferedAhead(ranges([0, 10]), 30), 0)
  assert.equal(C.readyToPlay(C.bufferPolicy('10m'), 29, 0, 7200), false)
  assert.equal(C.readyToPlay(C.bufferPolicy('10m'), 30, 0, 7200), true)
  assert.equal(C.readyToPlay(C.bufferPolicy('30s'), 5, 95, 100), true, 'near the end, what is left is enough')
  assert.equal(C.readyToPlay(C.bufferPolicy('offline'), 1e9, 0, 100), false, 'offline never streams')
})

test('torrents: magnet / .torrent only, denied indexes blocked, biggest video picked', () => {
  assert.equal(C.parseTorrentInput('magnet:?xt=urn:btih:08ADA5A7A6183AAE1E09D831DF6748D566095A10&dn=Sintel').infoHash, '08ada5a7a6183aae1e09d831df6748d566095a10')
  assert.equal(C.parseTorrentInput('https://archive.org/download/x/x_archive.torrent').kind, 'torrent')
  assert.match(C.parseTorrentInput('magnet:?dn=x').error, /info hash/)
  assert.match(C.parseTorrentInput('https://example.org/movie').error, /Not a magnet/)
  assert.match(C.parseTorrentInput('https://' + 'thepirate' + 'bay.org/x.torrent', decl.denylist).error, /blocked/)
  assert.equal(C.pickTorrentVideo([{ name: 'a.mp4', length: 5 }, { name: 'b.mp4', length: 9 }, { name: 'c.srt', length: 99 }]).name, 'b.mp4')
})

test('probe: only sources that have the title; failures reported, not thrown', async () => {
  const title = { imdbId: 'tt0013442', tmdbId: 653, type: 'movie', title: 'Nosferatu', year: '1922' }
  const cfg = { tmdb_key: 'K', region: 'US', jellyfin: { url: 'https://jf', token: 'T' }, plex: { url: 'https://px', token: 'T' } }
  const get = async (u) => {
    if (u.includes('jf/Items')) return { Items: [{ Id: 'j', Name: 'Nosferatu', ProviderIds: { Imdb: 'tt0013442' } }] }
    if (u.includes('px/')) throw new Error('HTTP 401')
    if (u.includes('/videos')) return { results: [] }
    if (u.includes('/watch/providers')) return { results: { US: { link: 'L', free: [{ provider_id: 73, provider_name: 'Tubi', logo_path: '/t' }] } } }
    if (u.includes('advancedsearch')) return { response: { docs: [{ identifier: 'nosferatu-1922', title: 'Nosferatu', year: 1922 }] } }
    if (u.includes('/metadata/')) return { metadata: { identifier: 'nosferatu-1922' }, files: [{ name: 'n.mp4', format: 'h.264' }] }
    return {}
  }
  const seen = []
  const r = await C.probeAll(decl, title, cfg, get, (x) => seen.push(x.source.id))
  const has = r.filter((x) => x.ok).map((x) => x.source.id)
  assert.deepEqual(has.sort(), ['archive', 'archive-torrent', 'jellyfin', 'watch'])
  assert.match(r.find((x) => x.source.id === 'plex').error, /401/)
  assert.equal(seen.length, decl.sources.length)
})

test('user sources: add / edit / enable / remove, validation, no presets shipped', () => {
  let r = C.addUserSource([], { name: 'My Jackett', type: 'torznab', url: 'http://nas:9117/api/v2.0/indexers/all/results/torznab/api', apikey: 'k' }, () => 'a')
  assert.equal(r.error, undefined); assert.equal(r.list[0].id, 'a'); assert.equal(r.list[0].enabled, true)
  r = C.addUserSource(r.list, { name: 'Feed', type: 'rss', url: 'https://feed.example/rss' }, () => 'b')
  assert.equal(r.list.length, 2)
  assert.match(C.addUserSource(r.list, { name: 'x', type: 'template', url: 'https://s.example/?q=' }).error, /\{query\}/)
  assert.match(C.addUserSource(r.list, { name: 'x', type: 'torznab', url: 'https://j' }).error, /API key/)
  assert.match(C.addUserSource(r.list, { name: '', type: 'rss', url: 'https://j' }).error, /name/)
  assert.match(C.addUserSource(r.list, { name: 'x', type: 'ftp', url: 'https://j' }).error, /type/)
  r = C.updateUserSource(r.list, 'b', { enabled: false, name: 'Feed 2' })
  assert.deepEqual(r.list.map((s) => [s.id, s.name, s.enabled]), [['a', 'My Jackett', true], ['b', 'Feed 2', false]])
  assert.match(C.updateUserSource(r.list, 'b', { url: 'nope' }).error, /URL/)
  assert.match(C.updateUserSource(r.list, 'zz', {}).error, /No such/)
  r = C.removeUserSource(r.list, 'a'); assert.deepEqual(r.list.map((s) => s.id), ['b'])
  assert.deepEqual(C.parseUserSources(JSON.stringify(r.list)).map((s) => s.id), ['b'])
  assert.deepEqual(C.parseUserSources('garbage'), [])
  assert.equal(raw.user_sources, undefined, 'sources.json ships no user-source presets')
})
test('user sources: URL template substitution and Torznab URL', () => {
  assert.equal(C.userSearchUrl({ type: 'template', url: 'https://s.example/find/{query}?x={query}' }, 'night of the living dead'), 'https://s.example/find/night%20of%20the%20living%20dead?x=night%20of%20the%20living%20dead')
  assert.equal(C.userSearchUrl({ type: 'torznab', url: 'http://j/api', apikey: 'K&1' }, 'a b'), 'http://j/api?t=search&apikey=K%261&q=a%20b')
  assert.equal(C.userSearchUrl({ type: 'torznab', url: 'http://j/api?cat=2000', apikey: 'K' }, 'x'), 'http://j/api?cat=2000&t=search&apikey=K&q=x')
  assert.equal(C.userSearchUrl({ type: 'rss', url: 'https://f/rss' }, 'x'), 'https://f/rss')
})
const TORZNAB = `<?xml version="1.0"?><rss version="2.0" xmlns:torznab="http://torznab.com/schemas/2015/feed"><channel>
<item><title>Night of the Living Dead (1968)</title><link>http://j/dl/1.torrent</link><comments>http://j/details/1</comments>
<enclosure url="http://j/dl/1.torrent" length="734003200" type="application/x-bittorrent"/>
<torznab:attr name="seeders" value="12"/><torznab:attr name="magneturl" value="magnet:?xt=urn:btih:abcdefabcdefabcdefabcdefabcdefabcdefabcd&amp;dn=notld"/></item>
<item><title><![CDATA[Other & Film]]></title><link>http://j/dl/2.torrent</link><torznab:attr name="seeders" value="40"/></item>
</channel></rss>`
const RSS = `<rss><channel><item><title>Night of the Living Dead</title><link>magnet:?xt=urn:btih:1111111111111111111111111111111111111111</link></item>
<item><title>Something Else</title><enclosure url="https://f/x.torrent" type="application/x-bittorrent"/></item></channel></rss>`
test('user sources: parse Torznab and RSS', () => {
  const t = C.parseTorrentFeed(TORZNAB)
  assert.equal(t.length, 2)
  assert.deepEqual([t[0].title, t[0].seeders, t[0].size, t[0].torrent, t[0].link], ['Night of the Living Dead (1968)', 12, 734003200, 'http://j/dl/1.torrent', 'http://j/dl/1.torrent'])
  assert.equal(t[0].magnet, 'magnet:?xt=urn:btih:abcdefabcdefabcdefabcdefabcdefabcdefabcd&dn=notld')
  assert.equal(t[1].title, 'Other & Film')
  const r = C.parseTorrentFeed(RSS)
  assert.equal(r[0].magnet, 'magnet:?xt=urn:btih:1111111111111111111111111111111111111111')
  assert.equal(r[1].torrent, 'https://f/x.torrent')
  assert.deepEqual(C.parseTorrentFeed('not xml'), [])
})
test('user sources: parallel search, enabled only, badges, RSS filtered, errors kept', async () => {
  const list = [
    { id: 'a', name: 'Jack', type: 'torznab', url: 'http://j/api', apikey: 'K', enabled: true },
    { id: 'b', name: 'Feed', type: 'rss', url: 'https://f/rss', enabled: true },
    { id: 'c', name: 'Off', type: 'rss', url: 'https://off/rss', enabled: false },
    { id: 'd', name: 'Site', type: 'template', url: 'https://s/?q={query}', enabled: true },
    { id: 'e', name: 'Down', type: 'rss', url: 'https://down/rss', enabled: true }
  ]
  const asked = []
  const getText = async (u) => { asked.push(u); if (u.startsWith('https://down')) throw new Error('HTTP 502'); return u.startsWith('http://j') ? TORZNAB : RSS }
  const { results, errors } = await C.searchUserSources(list, 'night living', getText)
  assert.ok(!asked.some((u) => u.includes('off')), 'disabled source not queried')
  assert.ok(results.every((r) => r.user && r.badge.startsWith('user source · ')))
  assert.equal(results.filter((r) => r.badge.endsWith('Feed')).length, 1, 'RSS filtered by the query')
  assert.equal(results.find((r) => r.open).open, 'https://s/?q=night%20living')
  assert.equal(results[0].seeders, 40, 'merged, most seeders first')
  assert.deepEqual(errors, [{ name: 'Down', error: 'HTTP 502' }])
  assert.deepEqual((await C.searchUserSources(list, '  ', getText)).results, [])
})

test('movie config: defaults, coercion, legacy offline buffer', () => {
  const c = C.normalizeMovieConfig('{"region":"pt","buffer":"offline","torrent":{"max_conns":"9999","down_kbps":"-3","sequential":"false"},"jellyfin":{"url":" https://j "},"bogus":1}', 'en-US')
  assert.equal(c.region, 'PT'); assert.equal(c.buffer, '2m'); assert.equal(c.offline, true)
  assert.equal(c.torrent.max_conns, 500); assert.equal(c.torrent.down_kbps, 0); assert.equal(c.torrent.sequential, false)
  assert.equal(c.jellyfin.url, 'https://j'); assert.equal(c.bogus, undefined)
  assert.equal(C.normalizeMovieConfig('not json', 'fr-FR').region, 'FR')
  assert.equal(C.effectiveBuffer(c), 'offline')
  assert.ok(C.MOVIE_CONFIG.every((s) => s.fields.every((f) => C.getPath(C.defaultMovieConfig(), f.key) !== undefined)))
})
test('movie config: enable/disable sources, torrent options, seeding', () => {
  const decl = C.parseSources(raw)
  let c = C.defaultMovieConfig('en-US')
  c = C.setSourceEnabled(c, 'archive-torrent', false)
  assert.ok(!C.enabledSources(decl, c).sources.some((s) => s.id === 'archive-torrent'))
  c = C.setSourceEnabled(c, 'archive-torrent', true)
  assert.equal(C.enabledSources(decl, c).sources.length, decl.sources.length)
  c.torrent.down_kbps = 100
  assert.deepEqual(C.torrentClientOptions(c), { maxConns: 55, downloadLimit: 102400, uploadLimit: -1 })
  assert.equal(C.torrentAddOptions(c).strategy, 'sequential')
  assert.equal(C.seedingDone(c, 0.5, 10), false); assert.equal(C.seedingDone(c, 1, 0), true)
  c.torrent.seed_minutes = 1; assert.equal(C.seedingDone(c, 0, 60), true)
  c.torrent.seed_ratio = 0; assert.equal(C.seedingDone(c, 0, 0), true)
})
