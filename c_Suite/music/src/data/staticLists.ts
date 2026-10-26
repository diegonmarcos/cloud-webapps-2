import { IMusicItem, IArtist, IAlbum, ITrack } from '../types';

// Placeholder images for when API doesn't provide them or for generic items
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150'; // Generic placeholder

// --- Rolling Stone Magazine Lists (examples, not exhaustive) ---

export const rollingStoneTopSongs: Partial<ITrack>[] = [
  { name: 'Like a Rolling Stone', artistName: 'Bob Dylan', image: PLACEHOLDER_IMAGE },
  { name: 'Satisfaction', artistName: 'The Rolling Stones', image: PLACEHOLDER_IMAGE },
  { name: 'Imagine', artistName: 'John Lennon', image: PLACEHOLDER_IMAGE },
  { name: 'What\'s Going On', artistName: 'Marvin Gaye', image: PLACEHOLDER_IMAGE },
  { name: 'Respect', artistName: 'Aretha Franklin', image: PLACEHOLDER_IMAGE },
  { name: 'Good Vibrations', artistName: 'The Beach Boys', image: PLACEHOLDER_IMAGE },
  { name: 'Johnny B. Goode', artistName: 'Chuck Berry', image: PLACEHOLDER_IMAGE },
  { name: 'Hey Jude', artistName: 'The Beatles', image: PLACEHOLDER_IMAGE },
  { name: 'Smells Like Teen Spirit', artistName: 'Nirvana', image: PLACEHOLDER_IMAGE },
  { name: 'One', artistName: 'U2', image: PLACEHOLDER_IMAGE },
];

export const rollingStoneTopAlbums: Partial<IAlbum>[] = [
  { name: 'Sgt. Pepper\'s Lonely Hearts Club Band', artistName: 'The Beatles', image: PLACEHOLDER_IMAGE },
  { name: 'Pet Sounds', artistName: 'The Beach Boys', image: PLACEHOLDER_IMAGE },
  { name: 'Revolver', artistName: 'The Beatles', image: PLACEHOLDER_IMAGE },
  { name: 'Highway 61 Revisited', artistName: 'Bob Dylan', image: PLACEHOLDER_IMAGE },
  { name: 'Rubber Soul', artistName: 'The Beatles', image: PLACEHOLDER_IMAGE },
  { name: 'What\'s Going On', artistName: 'Marvin Gaye', image: PLACEHOLDER_IMAGE },
  { name: 'Exile on Main St.', artistName: 'The Rolling Stones', image: PLACEHOLDER_IMAGE },
  { name: 'London Calling', artistName: 'The Clash', image: PLACEHOLDER_IMAGE },
  { name: 'Blonde on Blonde', artistName: 'Bob Dylan', image: PLACEHOLDER_IMAGE },
  { name: 'The Beatles (White Album)', artistName: 'The Beatles', image: PLACEHOLDER_IMAGE },
];

export const rollingStoneTopShows: Partial<IArtist>[] = [
  { name: 'Led Zeppelin', image: PLACEHOLDER_IMAGE, description: 'Iconic rock band known for their powerful live performances.' },
  { name: 'Queen', image: PLACEHOLDER_IMAGE, description: 'Legendary band with Freddie Mercury\'s charismatic stage presence.' },
  { name: 'Pink Floyd', image: PLACEHOLDER_IMAGE, description: 'Known for their elaborate and visually stunning concerts.' },
  { name: 'The Who', image: PLACEHOLDER_IMAGE, description: 'Energetic and destructive live shows.' },
  { name: 'Bruce Springsteen', image: PLACEHOLDER_IMAGE, description: 'The Boss delivers marathon, high-energy concerts.' },
];

// --- Genre Sections ---

export const jazzSection: Partial<IArtist>[] = [
  { name: 'Miles Davis', image: PLACEHOLDER_IMAGE },
  { name: 'John Coltrane', image: PLACEHOLDER_IMAGE },
  { name: 'Billie Holiday', image: PLACEHOLDER_IMAGE },
  { name: 'Louis Armstrong', image: PLACEHOLDER_IMAGE },
  { name: 'Ella Fitzgerald', image: PLACEHOLDER_IMAGE },
];

export const rockSection: Partial<IArtist>[] = [
  { name: 'Queen', image: PLACEHOLDER_IMAGE },
  { name: 'Led Zeppelin', image: PLACEHOLDER_IMAGE },
  { name: 'The Rolling Stones', image: PLACEHOLDER_IMAGE },
  { name: 'AC/DC', image: PLACEHOLDER_IMAGE },
  { name: 'Guns N\' Roses', image: PLACEHOLDER_IMAGE },
];

export const punkSection: Partial<IArtist>[] = [
  { name: 'The Ramones', image: PLACEHOLDER_IMAGE },
  { name: 'Sex Pistols', image: PLACEHOLDER_IMAGE },
  { name: 'The Clash', image: PLACEHOLDER_IMAGE },
  { name: 'Green Day', image: PLACEHOLDER_IMAGE },
  { name: 'Misfits', image: PLACEHOLDER_IMAGE },
];

export const alternativeRockSection: Partial<IArtist>[] = [
  { name: 'Nirvana', image: PLACEHOLDER_IMAGE },
  { name: 'Radiohead', image: PLACEHOLDER_IMAGE },
  { name: 'Red Hot Chili Peppers', image: PLACEHOLDER_IMAGE },
  { name: 'Pearl Jam', image: PLACEHOLDER_IMAGE },
  { name: 'R.E.M.', image: PLACEHOLDER_IMAGE },
];

export const classicSection: Partial<IArtist>[] = [
  { name: 'Wolfgang Amadeus Mozart', image: PLACEHOLDER_IMAGE, description: 'Classical Composer' },
  { name: 'Ludwig van Beethoven', image: PLACEHOLDER_IMAGE, description: 'Classical Composer' },
  { name: 'Johann Sebastian Bach', image: PLACEHOLDER_IMAGE, description: 'Classical Composer' },
  { name: 'Pyotr Ilyich Tchaikovsky', image: PLACEHOLDER_IMAGE, description: 'Classical Composer' },
  { name: 'Frédéric Chopin', image: PLACEHOLDER_IMAGE, description: 'Classical Composer' },
];

export const mantrasSection: Partial<IMusicItem>[] = [
  { name: 'Om Mani Padme Hum', description: 'Buddhist Mantra', image: PLACEHOLDER_IMAGE },
  { name: 'Gayatri Mantra', description: 'Vedic Mantra', image: PLACEHOLDER_IMAGE },
  { name: 'Lokah Samastah Sukhino Bhavantu', description: 'Sanskrit Mantra', image: PLACEHOLDER_IMAGE },
  { name: 'Om Shanti Om', description: 'Peace Mantra', image: PLACEHOLDER_IMAGE },
];

export const brasilidadesSection: Partial<ITrack>[] = [
  { name: 'Garota de Ipanema', artistName: 'Tom Jobim & Vinicius de Moraes', image: PLACEHOLDER_IMAGE },
  { name: 'Chega de Saudade', artistName: 'João Gilberto', image: PLACEHOLDER_IMAGE },
  { name: 'Águas de Março', artistName: 'Elis Regina & Tom Jobim', image: PLACEHOLDER_IMAGE },
  { name: 'Mas Que Nada', artistName: 'Jorge Ben Jor', image: PLACEHOLDER_IMAGE },
  { name: 'O Leãozinho', artistName: 'Caetano Veloso', image: PLACEHOLDER_IMAGE },
];
