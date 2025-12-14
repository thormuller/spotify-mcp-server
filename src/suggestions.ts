import { z } from 'zod';
import type { SpotifyHandlerExtra, tool } from './types.js';
import { handleSpotifyRequest } from './utils.js';

// Tool 1: Get audio features for tracks
const getTrackAudioFeatures: tool<{
  trackIds: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
}> = {
  name: 'getTrackAudioFeatures',
  description:
    'Get audio features (tempo, energy, valence, danceability, etc.) for one or more tracks',
  schema: {
    trackIds: z
      .union([z.string(), z.array(z.string())])
      .describe('A single track ID or array of track IDs'),
  },
  handler: async (args, _extra: SpotifyHandlerExtra) => {
    const { trackIds } = args;

    try {
      const result = await handleSpotifyRequest(async (spotifyApi) => {
        if (typeof trackIds === 'string') {
          return await spotifyApi.tracks.audioFeatures(trackIds);
        } else {
          return await spotifyApi.tracks.audioFeatures(trackIds);
        }
      });

      // Format the audio features nicely
      let formattedOutput = '';
      if (Array.isArray(result)) {
        formattedOutput = result
          .map((features, i) => {
            if (!features) return `${i + 1}. No features available`;
            return `${i + 1}. Track ID: ${features.id}
  Tempo: ${features.tempo.toFixed(1)} BPM
  Energy: ${features.energy.toFixed(2)} (0-1)
  Valence: ${features.valence.toFixed(2)} (0-1, happiness)
  Danceability: ${features.danceability.toFixed(2)} (0-1)
  Acousticness: ${features.acousticness.toFixed(2)} (0-1)
  Instrumentalness: ${features.instrumentalness.toFixed(2)} (0-1)
  Speechiness: ${features.speechiness.toFixed(2)} (0-1)
  Liveness: ${features.liveness.toFixed(2)} (0-1)
  Loudness: ${features.loudness.toFixed(1)} dB
  Key: ${features.key} (0-11)
  Mode: ${features.mode === 1 ? 'Major' : 'Minor'}
  Time Signature: ${features.time_signature}/4`;
          })
          .join('\n\n');
      } else {
        formattedOutput = `Track ID: ${result.id}
Tempo: ${result.tempo.toFixed(1)} BPM
Energy: ${result.energy.toFixed(2)} (0-1)
Valence: ${result.valence.toFixed(2)} (0-1, happiness)
Danceability: ${result.danceability.toFixed(2)} (0-1)
Acousticness: ${result.acousticness.toFixed(2)} (0-1)
Instrumentalness: ${result.instrumentalness.toFixed(2)} (0-1)
Speechiness: ${result.speechiness.toFixed(2)} (0-1)
Liveness: ${result.liveness.toFixed(2)} (0-1)
Loudness: ${result.loudness.toFixed(1)} dB
Key: ${result.key} (0-11)
Mode: ${result.mode === 1 ? 'Major' : 'Minor'}
Time Signature: ${result.time_signature}/4`;
      }

      return {
        content: [
          {
            type: 'text',
            text: `# Audio Features\n\n${formattedOutput}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching audio features: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },
};

// Tool 2: Get recommendations based on seeds and audio feature targets
const getRecommendations: tool<{
  seed_tracks: z.ZodOptional<z.ZodArray<z.ZodString>>;
  seed_artists: z.ZodOptional<z.ZodArray<z.ZodString>>;
  seed_genres: z.ZodOptional<z.ZodArray<z.ZodString>>;
  limit: z.ZodOptional<z.ZodNumber>;
  market: z.ZodOptional<z.ZodString>;
  target_acousticness: z.ZodOptional<z.ZodNumber>;
  target_danceability: z.ZodOptional<z.ZodNumber>;
  target_energy: z.ZodOptional<z.ZodNumber>;
  target_instrumentalness: z.ZodOptional<z.ZodNumber>;
  target_liveness: z.ZodOptional<z.ZodNumber>;
  target_loudness: z.ZodOptional<z.ZodNumber>;
  target_popularity: z.ZodOptional<z.ZodNumber>;
  target_speechiness: z.ZodOptional<z.ZodNumber>;
  target_tempo: z.ZodOptional<z.ZodNumber>;
  target_valence: z.ZodOptional<z.ZodNumber>;
  min_acousticness: z.ZodOptional<z.ZodNumber>;
  min_danceability: z.ZodOptional<z.ZodNumber>;
  min_energy: z.ZodOptional<z.ZodNumber>;
  min_instrumentalness: z.ZodOptional<z.ZodNumber>;
  min_liveness: z.ZodOptional<z.ZodNumber>;
  min_loudness: z.ZodOptional<z.ZodNumber>;
  min_popularity: z.ZodOptional<z.ZodNumber>;
  min_speechiness: z.ZodOptional<z.ZodNumber>;
  min_tempo: z.ZodOptional<z.ZodNumber>;
  min_valence: z.ZodOptional<z.ZodNumber>;
  max_acousticness: z.ZodOptional<z.ZodNumber>;
  max_danceability: z.ZodOptional<z.ZodNumber>;
  max_energy: z.ZodOptional<z.ZodNumber>;
  max_instrumentalness: z.ZodOptional<z.ZodNumber>;
  max_liveness: z.ZodOptional<z.ZodNumber>;
  max_loudness: z.ZodOptional<z.ZodNumber>;
  max_popularity: z.ZodOptional<z.ZodNumber>;
  max_speechiness: z.ZodOptional<z.ZodNumber>;
  max_tempo: z.ZodOptional<z.ZodNumber>;
  max_valence: z.ZodOptional<z.ZodNumber>;
}> = {
  name: 'getRecommendations',
  description:
    'Get track recommendations based on seed tracks/artists/genres and optional audio feature filters',
  schema: {
    seed_tracks: z
      .array(z.string())
      .max(5)
      .optional()
      .describe('Up to 5 seed track IDs'),
    seed_artists: z
      .array(z.string())
      .max(5)
      .optional()
      .describe('Up to 5 seed artist IDs'),
    seed_genres: z
      .array(z.string())
      .max(5)
      .optional()
      .describe('Up to 5 seed genres (see getGenreSeeds for valid genres)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of recommendations (1-100, default: 20)'),
    market: z
      .string()
      .length(2)
      .optional()
      .describe('ISO 3166-1 alpha-2 country code (e.g., US, GB)'),
    // Target audio features (ideal values)
    target_acousticness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target acousticness (0-1)'),
    target_danceability: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target danceability (0-1)'),
    target_energy: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target energy level (0-1)'),
    target_instrumentalness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target instrumentalness (0-1)'),
    target_liveness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target liveness (0-1)'),
    target_loudness: z.number().optional().describe('Target loudness in dB'),
    target_popularity: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Target popularity (0-100)'),
    target_speechiness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target speechiness (0-1)'),
    target_tempo: z.number().optional().describe('Target tempo in BPM'),
    target_valence: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Target valence/positivity (0-1)'),
    // Min audio features (minimum values)
    min_acousticness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum acousticness (0-1)'),
    min_danceability: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum danceability (0-1)'),
    min_energy: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum energy level (0-1)'),
    min_instrumentalness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum instrumentalness (0-1)'),
    min_liveness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum liveness (0-1)'),
    min_loudness: z.number().optional().describe('Minimum loudness in dB'),
    min_popularity: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Minimum popularity (0-100)'),
    min_speechiness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum speechiness (0-1)'),
    min_tempo: z.number().optional().describe('Minimum tempo in BPM'),
    min_valence: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Minimum valence/positivity (0-1)'),
    // Max audio features (maximum values)
    max_acousticness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum acousticness (0-1)'),
    max_danceability: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum danceability (0-1)'),
    max_energy: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum energy level (0-1)'),
    max_instrumentalness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum instrumentalness (0-1)'),
    max_liveness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum liveness (0-1)'),
    max_loudness: z.number().optional().describe('Maximum loudness in dB'),
    max_popularity: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Maximum popularity (0-100)'),
    max_speechiness: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum speechiness (0-1)'),
    max_tempo: z.number().optional().describe('Maximum tempo in BPM'),
    max_valence: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Maximum valence/positivity (0-1)'),
  },
  handler: async (args, _extra: SpotifyHandlerExtra) => {
    const {
      seed_tracks,
      seed_artists,
      seed_genres,
      limit = 20,
      ...otherParams
    } = args;

    // Validate at least one seed is provided
    const totalSeeds =
      (seed_tracks?.length || 0) +
      (seed_artists?.length || 0) +
      (seed_genres?.length || 0);
    if (totalSeeds === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: At least one seed (track, artist, or genre) is required',
          },
        ],
      };
    }

    if (totalSeeds > 5) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Total number of seeds cannot exceed 5',
          },
        ],
      };
    }

    try {
      const result = await handleSpotifyRequest(async (spotifyApi) => {
        return await spotifyApi.recommendations.get({
          seed_tracks,
          seed_artists,
          seed_genres,
          limit,
          ...otherParams,
        });
      });

      const formattedOutput = result.tracks
        .map((track, i) => {
          const artists = track.artists.map((a) => a.name).join(', ');
          const durationMin = Math.floor(track.duration_ms / 60000);
          const durationSec = ((track.duration_ms % 60000) / 1000).toFixed(0);
          return `${i + 1}. "${track.name}" by ${artists}
   Album: ${track.album.name}
   Duration: ${durationMin}:${durationSec.padStart(2, '0')}
   Popularity: ${track.popularity}/100
   Track ID: ${track.id}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# Recommendations (${result.tracks.length} tracks)\n\n${formattedOutput}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching recommendations: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },
};

// Tool 3: Get related artists
const getRelatedArtists: tool<{
  artistId: z.ZodString;
}> = {
  name: 'getRelatedArtists',
  description: 'Get artists similar to a given artist',
  schema: {
    artistId: z.string().describe('The Spotify ID of the artist'),
  },
  handler: async (args, _extra: SpotifyHandlerExtra) => {
    const { artistId } = args;

    try {
      const result = await handleSpotifyRequest(async (spotifyApi) => {
        return await spotifyApi.artists.relatedArtists(artistId);
      });

      const formattedOutput = result.artists
        .map((artist, i) => {
          const genres = artist.genres.join(', ');
          return `${i + 1}. ${artist.name}
   Genres: ${genres || 'None specified'}
   Popularity: ${artist.popularity}/100
   Followers: ${artist.followers.total.toLocaleString()}
   Artist ID: ${artist.id}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# Related Artists (${result.artists.length} artists)\n\n${formattedOutput}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching related artists: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },
};

// Tool 4: Get available genre seeds
const getGenreSeeds: tool<Record<string, never>> = {
  name: 'getGenreSeeds',
  description:
    'Get list of available genre seeds for use with the getRecommendations tool',
  schema: {},
  handler: async (_args, _extra: SpotifyHandlerExtra) => {
    try {
      const result = await handleSpotifyRequest(async (spotifyApi) => {
        return await spotifyApi.recommendations.genreSeeds();
      });

      const formattedOutput = result.genres.join(', ');

      return {
        content: [
          {
            type: 'text',
            text: `# Available Genre Seeds (${result.genres.length} genres)\n\n${formattedOutput}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching genre seeds: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },
};

export const suggestionTools = [
  getTrackAudioFeatures,
  getRecommendations,
  getRelatedArtists,
  getGenreSeeds,
];
