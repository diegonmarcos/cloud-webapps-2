import axios from 'axios';
import { IArtist, IAlbum, TheAudioDBArtist, TheAudioDBAlbum } from '../types';

const API_KEY = '2'; // TheAudioDB public test API key
const BASE_URL = `https://www.theaudiodb.com/api/v1/json/${API_KEY}`;

// Helper to fetch data and handle errors
async function fetchData<T>(url: string): Promise<T | null> {
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching from TheAudioDB: ${url}`, error);
    return null;
  }
}

// Mappers to convert TheAudioDB types to our generic IMusicItem types
export function mapTheAudioDBArtistToIMusicItem(theAudioDBArtist: TheAudioDBArtist): IArtist {
  return {
    id: theAudioDBArtist.idArtist,
    name: theAudioDBArtist.strArtist,
    image: theAudioDBArtist.strArtistFanart || theAudioDBArtist.strArtistThumb, // Prefer fanart if available
    thumbnail: theAudioDBArtist.strArtistThumb,
    description: theAudioDBArtist.strBiographyEN,
    type: 'artist',
    genre: theAudioDBArtist.strGenre,
    country: theAudioDBArtist.strCountry,
    mood: theAudioDBArtist.strMood,
    style: theAudioDBArtist.strStyle,
    website: theAudioDBArtist.strWebsite,
    facebook: theAudioDBArtist.strFacebook,
    twitter: theAudioDBArtist.strTwitter,
    bio: theAudioDBArtist.strBiographyEN,
    bornYear: theAudioDBArtist.intBornYear,
    diedYear: theAudioDBArtist.intDiedYear,
  };
}

export function mapTheAudioDBAlbumToIMusicItem(theAudioDBAlbum: TheAudioDBAlbum): IAlbum {
  return {
    id: theAudioDBAlbum.idAlbum,
    name: theAudioDBAlbum.strAlbum,
    artistName: theAudioDBAlbum.strArtist,
    image: theAudioDBAlbum.strAlbumThumb,
    thumbnail: theAudioDBAlbum.strAlbumThumb,
    description: theAudioDBAlbum.strDescriptionEN,
    type: 'album',
    releaseYear: theAudioDBAlbum.intYearReleased,
    genre: theAudioDBAlbum.strGenre,
    sales: theAudioDBAlbum.intSales,
    score: theAudioDBAlbum.intScore,
    review: theAudioDBAlbum.strReview,
  };
}

// TheAudioDB API functions
export async function searchArtistByName(name: string): Promise<IArtist[]> {
  const url = `${BASE_URL}/search.php?s=${encodeURIComponent(name)}`;
  const data = await fetchData<{ artists: TheAudioDBArtist[] }>(url);
  return data?.artists?.map(mapTheAudioDBArtistToIMusicItem) || [];
}

export async function getArtistDiscography(artistId: string): Promise<IAlbum[]> {
  const urlWithId = `${BASE_URL}/album.php?i=${encodeURIComponent(artistId)}`;
  const data = await fetchData<{ album: TheAudioDBAlbum[] }>(urlWithId);
  return data?.album?.map(mapTheAudioDBAlbumToIMusicItem) || [];
}
