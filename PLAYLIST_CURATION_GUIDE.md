# Playlist Duplicate Removal & Track Suggestion System

Complete guide for using the automated playlist curation system.

## Overview

This system helps you:
1. **Remove duplicates** from your master playlist index
2. **Fix playlist mismatches** (e.g., Friday Noon had wrong music genre)
3. **Generate AI-powered track suggestions** using Spotify's recommendation engine
4. **Interactively curate** replacements to fill gaps

## System Components

### 1. New Spotify MCP Tools (TypeScript)

Located in `/src/suggestions.ts`, these tools extend your Spotify MCP server:

#### `getTrackAudioFeatures`
Analyze track characteristics to understand vibe/mood.
```typescript
// Returns: tempo, energy, valence, danceability, acousticness, instrumentalness, speechiness, loudness
```

#### `getRecommendations` ⭐ (CORE TOOL)
Get AI-powered track recommendations based on audio features and seeds.
```typescript
// Input: seed_tracks, seed_artists, seed_genres, audio feature filters (min/max/target)
// Output: List of recommended tracks matching criteria
```

#### `getRelatedArtists`
Find similar artists for exploration.
```typescript
// Input: artistId
// Output: List of related artists with genres, popularity
```

#### `getGenreSeeds`
Get list of valid genre seeds for recommendations.
```typescript
// Output: Array of available genres (e.g., "ambient", "jazz-fusion", "idm")
```

**Status:** ✅ Built and compiled successfully

### 2. Duplicate Removal Script (`remove_duplicates.py`)

Analyzes and cleans your playlist index.

**What it does:**
- Identifies all duplicate song+artist combinations
- Removes duplicates (keeps best occurrence based on seed idea fit)
- Fixes Friday Noon "The Rooftop" (removes traditional world music, keeps only electronic)
- Generates gap report for playlists needing more tracks

**Usage:**
```bash
python3 remove_duplicates.py
```

**Output files:**
- `master_playlist_index_cleaned.csv` - Cleaned playlist (527 tracks, down from 589)
- `tracks_needed.json` - Gap analysis showing which playlists need tracks
- `duplicate_removal_report.json` - Detailed removal report

**Results from your data:**
- ✅ Removed 62 tracks total
  - 41 duplicate songs
  - 21 traditional world music from Friday Noon
- ✅ Friday Noon "The Rooftop" now has only electronic/Nu-Disco (20 tracks)
- ✅ Saturday Noon "The Global Bazaar" retains all traditional world music

### 3. Track Suggestion Script (`suggest_replacements.py`)

Generates AI-powered track suggestions using Spotify MCP tools.

**What it does:**
- Loads cleaned playlist and gap report
- For each playlist needing tracks:
  - Determines audio feature targets based on seed idea
  - Calls `getRecommendations` MCP tool with appropriate filters
  - Ranks suggestions by fit
  - Filters out tracks already in any playlist

**Usage:**
```bash
python3 suggest_replacements.py
```

**Note:** Currently shows placeholders for MCP calls. To get actual suggestions, use the MCP tools via Claude Code (see "Manual Suggestion Workflow" below).

**Output files:**
- `replacement_suggestions.json` - AI-generated track suggestions with rankings

### 4. Interactive Curation Tool (`curate_replacements.py`)

Interactive CLI for reviewing and accepting track suggestions.

**What it does:**
- Shows each playlist with gaps
- Allows you to:
  - ✅ Add tracks manually
  - ⏭️ Skip to next playlist
  - 💾 Save progress and quit anytime
- Generates final curated CSV

**Usage:**
```bash
python3 curate_replacements.py
```

**Output files:**
- `master_playlist_index_final.csv` - Final curated playlist

## Current Status

### ✅ Completed:
1. **All 4 MCP tools** created and compiled successfully
2. **Duplicate removal** executed successfully:
   - 589 original tracks → 527 cleaned tracks
   - All duplicates removed
   - Friday Noon corrected (only electronic music)
3. **Gap analysis** complete: 7 playlists identified needing tracks
4. **Python scripts** created for suggestion and curation

### 📋 Playlists Needing Tracks (Below 20 minimum):

| Playlist | Day/Time | Current | Need | Seed Idea |
|----------|----------|---------|------|-----------|
| The Observatory | Tuesday 9:00-10:30am | 11 | 19 | Blank Canvas - atmospheric, serious |
| The Strategy | Tuesday 10:30am-Noon | 13 | 17 | Complex Systems - jazz-fusion |
| The Scaffold | Wednesday 10:30am-Noon | 15 | 15 | Modular Logic - hypnotic IDM |
| The Prologue | Thursday 9:00-10:30am | 11 | 19 | Intimacy - solo piano, quiet |
| The Rising Action | Thursday 10:30am-Noon | 11 | 19 | Cinematic Swell - orchestral |
| The Innovation Lab | Friday 9:00-10:30am | 12 | 18 | Playful Tech - glitchy, optimistic |
| The Flow State | Friday 10:30am-Noon | 12 | 18 | Warm Drive - lo-fi house |

## Manual Suggestion Workflow (Using MCP Tools via Claude Code)

Since the MCP tools are now available, you can use them directly to get track suggestions:

### Example: Finding tracks for "The Observatory"

1. **Get audio features from existing tracks** (to understand the vibe):
```
Use getTrackAudioFeatures with track IDs from the playlist
```

2. **Get recommendations**:
```
Use getRecommendations with:
  seed_genres: ["ambient", "post-rock", "drone"]
  target_energy: 0.4
  min_energy: 0.3
  max_energy: 0.5
  target_valence: 0.4
  min_valence: 0.3
  max_valence: 0.5
  target_tempo: 85
  min_tempo: 70
  max_tempo: 100
  target_instrumentalness: 0.9
  min_instrumentalness: 0.8
  limit: 50
```

3. **Explore related artists** (optional):
```
Use getRelatedArtists with artist IDs from existing tracks
Then search their top tracks
```

### Audio Feature Targets by Playlist

#### The Observatory (Blank Canvas - atmospheric)
- Energy: 0.3-0.5 (target: 0.4)
- Valence: 0.3-0.5 (target: 0.4)
- Tempo: 70-100 BPM (target: 85)
- Instrumentalness: 0.8+ (target: 0.9)
- Genres: ambient, post-rock, drone

#### The Strategy (Complex Systems - jazz-fusion)
- Energy: 0.5-0.7 (target: 0.6)
- Valence: 0.4-0.6 (target: 0.5)
- Tempo: 90-130 BPM (target: 110)
- Danceability: ~0.5
- Instrumentalness: ~0.7
- Genres: jazz, jazz-fusion, electronic

#### The Scaffold (Modular Logic - IDM)
- Energy: 0.5-0.7 (target: 0.6)
- Valence: 0.4-0.6 (target: 0.5)
- Tempo: 120-140 BPM (target: 130)
- Danceability: ~0.6
- Instrumentalness: 0.8+ (target: 0.9)
- Genres: idm, electronica, minimal-techno

#### The Prologue (Intimacy - solo piano)
- Energy: 0.2-0.4 (target: 0.3)
- Valence: 0.4-0.6 (target: 0.5)
- Tempo: 60-80 BPM (target: 70)
- Acousticness: 0.7+ (target: 0.8)
- Instrumentalness: 0.6+ (target: 0.75)
- Genres: piano, classical, modern-classical

#### The Rising Action (Cinematic Swell)
- Energy: 0.5-0.7 (target: 0.6)
- Valence: 0.5-0.7 (target: 0.6)
- Tempo: 80-110 BPM (target: 95)
- Acousticness: ~0.5
- Instrumentalness: ~0.8
- Genres: chamber-pop, orchestral, soundtrack

#### The Innovation Lab (Playful Tech)
- Energy: 0.6-0.8 (target: 0.7)
- Valence: 0.7-0.9 (target: 0.8)
- Tempo: 120-140 BPM (target: 130)
- Danceability: ~0.7
- Instrumentalness: ~0.65
- Genres: glitch, electronica, future-bass

#### The Flow State (Warm Drive - lo-fi house)
- Energy: 0.6-0.7 (target: 0.65)
- Valence: 0.5-0.7 (target: 0.6)
- Tempo: 110-130 BPM (target: 120)
- Danceability: 0.6+ (target: 0.7)
- Instrumentalness: ~0.6
- Genres: house, deep-house, minimal-techno

## Recommended Workflow

### Option A: Automated (When MCP Integration Complete)
1. Run `remove_duplicates.py` ✅ (already done)
2. Run `suggest_replacements.py` (needs MCP protocol integration)
3. Review `replacement_suggestions.json`
4. Run `curate_replacements.py` to accept/reject suggestions
5. Get `master_playlist_index_final.csv`

### Option B: Manual (Using MCP Tools via Claude Code) ⭐ RECOMMENDED
1. ✅ `remove_duplicates.py` already run - you have clean data
2. For each playlist needing tracks, ask Claude Code:
   ```
   Use getRecommendations to find tracks for [PLAYLIST NAME]
   with these criteria: [paste audio feature targets from above]
   ```
3. Review suggestions, pick your favorites
4. Either:
   - Manually add to CSV, OR
   - Use `curate_replacements.py` to add interactively

## Files Generated

| File | Description | Status |
|------|-------------|--------|
| `master_playlist_index_cleaned.csv` | Cleaned playlist, duplicates removed | ✅ Created (527 tracks) |
| `tracks_needed.json` | Gap analysis report | ✅ Created (7 playlists) |
| `duplicate_removal_report.json` | Detailed removal log | ✅ Created |
| `replacement_suggestions.json` | AI-generated suggestions | 🔲 Template created |
| `master_playlist_index_final.csv` | Final curated playlist | 🔲 Not yet created |

## Success Criteria

- ✅ Zero duplicate songs across entire week
- ✅ Friday Noon contains only Nu-Disco/electronic (no traditional world music)
- ✅ Saturday Noon contains only traditional instruments (all world music intact)
- 🔲 Each playlist maintains 20-40 tracks (7 playlists still below 20)
- 🔲 Audio features match seed idea targets
- ✅ Artist diversity maintained (no artist appears >2x in same playlist)
- ✅ All playlists align with PlaylistSeedsByDay.md principles

## Next Steps

You have two options:

### Recommended: Use MCP Tools via Claude Code
Since the MCP tools are built and working, the fastest path is to:
1. Ask me (Claude) to use `getRecommendations` for each playlist
2. I'll give you 20-50 suggestions per playlist matching the exact vibe
3. You pick which tracks to add
4. Update the CSV manually or use the curation tool

### Alternative: Enhance Python Scripts
If you want fully automated suggestions, you could:
1. Implement MCP protocol communication in `suggest_replacements.py`
2. Have it automatically call the tools and parse results
3. Run the full automated pipeline

**What would you like to do next?**
