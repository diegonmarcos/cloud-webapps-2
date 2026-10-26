export interface IMusicItem {
  id: string; // Unique identifier
  name: string;
  image?: string; // URL for image
  thumbnail?: string; // URL for thumbnail
  description?: string; // Short description or bio
  type?: 'artist' | 'album' | 'track';
  // Add other common properties as needed
}

export interface IArtist extends IMusicItem {
  type: 'artist';
  genre?: string;
  country?: string;
  mood?: string;
  style?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  bio?: string;
  bornYear?: string;
  diedYear?: string;
}

export interface IAlbum extends IMusicItem {
  type: 'album';
  artistName: string;
  releaseYear?: string;
  genre?: string;
  sales?: string;
  score?: string;
  review?: string;
}

export interface ITrack extends IMusicItem {
  type: 'track';
  albumName: string;
  artistName: string;
  duration?: string; // e.g., "3:45" or in milliseconds
  youtubeUrl?: string;
  lyrics?: string;
}

// TheAudioDB specific types (can be mapped to general types)
export interface TheAudioDBArtist {
  idArtist: string;
  strArtist: string;
  strArtistAlternate: string;
  strArtistThumb: string; // Thumbnail
  strArtistFanart: string; // Larger image
  strBiographyEN: string;
  strGenre: string;
  strCountry: string;
  strWebsite: string;
  strFacebook: string;
  strTwitter: string;
  intBornYear: string;
  intDiedYear: string;
  strMood: string;
  strStyle: string;
  // ... many other fields
}

export interface TheAudioDBAlbum {
  idAlbum: string;
  idArtist: string;
  strAlbum: string;
  strArtist: string;
  intYearReleased: string;
  strAlbumThumb: string;
  strGenre: string;
  strDescriptionEN: string;
  intSales: string;
  intScore: string;
  strReview: string;
  // ... many other fields
}

export interface TheAudioDBTrack {
  idTrack: string;
  idAlbum: string;
  idArtist: string;
  strTrack: string;
  strAlbum: string;
  strArtist: string;
  strGenre: string;
  strDescriptionEN: string;
  strMusicVid: string; // YouTube URL
  intDuration: string; // in milliseconds
  // ... many other fields
}
