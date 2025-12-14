#!/usr/bin/env python3
"""
Duplicate Detection and Removal Script for Master Playlist Index

This script:
1. Analyzes master_playlist_index.csv for duplicate songs
2. Removes duplicates based on priority rules
3. Fixes Friday Noon "The Rooftop" by removing traditional world music
4. Generates cleaned CSV and gap report for replacements
"""

import csv
import json
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Set

# Seed idea mapping for determining best playlist fit
SEED_IDEAS = {
    ("Monday", "9:00 – 10:30am", "The Awakening"): {
        "description": "Photosynthesis - Gentle, organic growth",
        "keywords": ["acoustic", "organic", "gentle", "woodwind", "guitar"],
    },
    ("Monday", "10:30am – Noon", "The Forest Path"): {
        "description": "Steady Growth - Repetitive, organic patterns",
        "keywords": ["organic", "repetitive", "steady", "nature"],
    },
    ("Monday", "Noon – 2:00pm", "The Village Green"): {
        "description": "Communal Warmth - Sunny, optimistic community",
        "keywords": ["indie", "folk", "pop", "sunny", "upbeat"],
    },
    ("Monday", "2:00 – 5:00pm", "The Long Drive"): {
        "description": "Momentum into Expansion - Motorik beats, cinematic",
        "keywords": ["motorik", "driving", "electronic", "expansive", "cinematic"],
    },
    ("Tuesday", "9:00 – 10:30am", "The Observatory"): {
        "description": "The Blank Canvas - Vast, atmospheric, serious",
        "keywords": ["ambient", "atmospheric", "post-rock", "cinematic"],
    },
    ("Tuesday", "10:30am – Noon", "The Strategy"): {
        "description": "Complex Systems - Jazz-fusion, intricate electronics",
        "keywords": ["jazz", "fusion", "complex", "electronic", "intricate"],
    },
    ("Tuesday", "Noon – 2:00pm", "The Global Bazaar"): {
        "description": "Intersection of Culture - Rhythmic, worldly",
        "keywords": ["world", "rhythmic", "global", "cultural", "international"],
    },
    ("Tuesday", "2:00 – 5:00pm", "The Collaboratory"): {
        "description": "The Engine Room - Driving funk, Afrobeat, precision electronics",
        "keywords": ["funk", "afrobeat", "electronic", "driving", "energetic"],
    },
    ("Friday", "Noon – 2:00pm", "The Rooftop"): {
        "description": "Sunshine & Grooves - Nu-Disco, vocal-heavy, funky",
        "keywords": ["nu-disco", "electronic", "vocal", "funky", "melodic house"],
    },
    ("Saturday", "Noon – 2:00pm", "The Global Bazaar"): {
        "description": "The Source - Traditional instruments, NO electronics",
        "keywords": ["traditional", "acoustic", "world", "flamenco", "son cubano", "kora"],
    },
}

# Day priority (Monday = highest priority)
DAY_PRIORITY = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6,
}

# Time priority (earlier = higher priority)
TIME_PRIORITY = {
    "9:00 – 10:30am": 1,
    "10:00am – Noon": 1.5,
    "10:30am – Noon": 2,
    "Noon – 2:00pm": 3,
    "2:00 – 5:00pm": 4,
}


def read_master_playlist(csv_path: str) -> List[Dict]:
    """Read the master playlist CSV"""
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def identify_duplicates(rows: List[Dict]) -> Dict[Tuple[str, str], List[Dict]]:
    """
    Identify duplicate song+artist combinations
    Returns dict mapping (song, artist) to list of occurrences
    """
    song_locations = defaultdict(list)

    for row in rows:
        key = (row['Song Name'], row['Artist'])
        song_locations[key].append(row)

    # Filter to only duplicates (appearing more than once)
    duplicates = {k: v for k, v in song_locations.items() if len(v) > 1}

    return duplicates


def calculate_priority(row: Dict) -> Tuple[int, int]:
    """
    Calculate priority for a song occurrence
    Returns (day_priority, time_priority) - lower is better
    """
    day = row['Day']
    time = row['Time']

    day_pri = DAY_PRIORITY.get(day, 99)
    time_pri = TIME_PRIORITY.get(time, 99)

    return (day_pri, time_pri)


def determine_best_occurrence(occurrences: List[Dict]) -> Dict:
    """
    Determine which occurrence of a duplicate to keep
    Priority: Best seed match > Earlier day > Earlier time
    """
    # For now, use simple day+time priority
    # TODO: Could enhance with seed idea matching
    return min(occurrences, key=calculate_priority)


def is_traditional_world_music(row: Dict) -> bool:
    """
    Determine if a track is traditional world music (acoustic, no electronics)
    Based on artist and track characteristics
    """
    # Artists known for traditional acoustic world music
    traditional_artists = {
        "Cesária Evora", "Buena Vista Social Club", "Ali Farka Touré",
        "Toumani Diabaté", "Rodrigo y Gabriela", "Pink Martini",
        "Oumou Sangaré", "Souad Massi", "Yasmin Levy", "Gipsy Kings",
        "Paco de Lucía", "Fatoumata Diawara", "Blick Bassy",
        "Gurrumul", "Lila Downs", "Natalia Lafourcade",
        "Gaby Moreno", "Ibrahim Ferrer", "Vicente Amigo",
        "Ballaké Sissoko", "Orchestra Baobab",
    }

    artist = row['Artist']

    # Check if artist is in traditional list
    for trad_artist in traditional_artists:
        if trad_artist in artist:
            return True

    return False


def is_electronic_melodic_house(row: Dict) -> bool:
    """
    Determine if a track is electronic/melodic house/nu-disco
    Based on artist characteristics
    """
    electronic_artists = {
        "Acid Pauli", "Bedouin", "Be Svendsen", "Viken Arman",
        "Satori", "Sofi Tukker", "Monolink", "Jan Blomqvist",
        "Bob Moses", "WhoMadeWho", "RÜFÜS DU SOL", "Vintage Culture",
        "John Summit",
    }

    artist = row['Artist']

    # Check if artist is in electronic list
    for elec_artist in electronic_artists:
        if elec_artist in artist:
            return True

    return False


def remove_duplicates_and_fix_friday(rows: List[Dict]) -> Tuple[List[Dict], Dict]:
    """
    Remove all duplicates and fix Friday Noon playlist
    Returns (cleaned_rows, removal_report)
    """
    # Track songs to keep
    songs_to_keep = set()  # Set of (song, artist) tuples
    cleaned_rows = []
    removal_report = {
        "duplicates_removed": [],
        "friday_noon_removed": [],
        "total_removed": 0,
    }

    # Step 1: Identify duplicates
    duplicates = identify_duplicates(rows)

    # Step 2: Determine which occurrences to keep for duplicates
    for (song, artist), occurrences in duplicates.items():
        best = determine_best_occurrence(occurrences)
        best_key = (best['Day'], best['Time'], best['Playlist Name'])

        for occ in occurrences:
            occ_key = (occ['Day'], occ['Time'], occ['Playlist Name'])
            if occ_key == best_key:
                songs_to_keep.add((song, artist, occ_key))
                removal_report["duplicates_removed"].append({
                    "song": song,
                    "artist": artist,
                    "kept_in": f"{best['Day']} {best['Time']} - {best['Playlist Name']}",
                    "removed_from": [f"{o['Day']} {o['Time']} - {o['Playlist Name']}"
                                   for o in occurrences if o != best],
                })
                break

    # Step 3: Process all rows
    for row in rows:
        song = row['Song Name']
        artist = row['Artist']
        playlist_key = (row['Day'], row['Time'], row['Playlist Name'])

        # Friday Noon special handling
        if (row['Day'] == 'Friday' and
            row['Time'] == 'Noon – 2:00pm' and
            row['Playlist Name'] == 'The Rooftop'):

            # Keep only electronic melodic house, remove traditional world music
            if is_traditional_world_music(row):
                removal_report["friday_noon_removed"].append({
                    "song": song,
                    "artist": artist,
                    "reason": "Traditional world music - doesn't fit Nu-Disco seed idea",
                })
                continue
            elif is_electronic_melodic_house(row):
                # Keep it
                cleaned_rows.append(row)
                continue

        # For duplicates, only keep the best occurrence
        if (song, artist) in [(s, a) for s, a, _ in songs_to_keep]:
            if (song, artist, playlist_key) in songs_to_keep:
                cleaned_rows.append(row)
            # else: skip this occurrence
        else:
            # Not a duplicate, keep it
            cleaned_rows.append(row)

    removal_report["total_removed"] = len(rows) - len(cleaned_rows)

    return cleaned_rows, removal_report


def analyze_gaps(cleaned_rows: List[Dict]) -> Dict:
    """
    Analyze playlists to identify which need more tracks
    Returns gap report with target counts and recommendations
    """
    # Group by playlist
    playlists = defaultdict(list)
    for row in cleaned_rows:
        key = (row['Day'], row['Time'], row['Playlist Name'])
        playlists[key].append(row)

    gap_report = {}

    # Target: 20-40 tracks per playlist, ideally 30
    MIN_TRACKS = 20
    TARGET_TRACKS = 30

    for (day, time, name), tracks in playlists.items():
        current_count = len(tracks)

        if current_count < MIN_TRACKS:
            gap_report[f"{day}_{time}_{name}".replace(" ", "_").replace("–", "to").replace(":", "")] = {
                "day": day,
                "time": time,
                "playlist_name": name,
                "current_count": current_count,
                "target_count": TARGET_TRACKS,
                "needed": TARGET_TRACKS - current_count,
                "seed_idea": SEED_IDEAS.get((day, time, name), {}).get("description", "Unknown"),
                "reference_track_ids": [],  # To be filled by Spotify search
            }

    return gap_report


def write_cleaned_csv(rows: List[Dict], output_path: str):
    """Write cleaned playlist to CSV"""
    if not rows:
        print("Warning: No rows to write!")
        return

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        fieldnames = rows[0].keys()
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    print("=" * 80)
    print("SPOTIFY PLAYLIST DUPLICATE REMOVAL")
    print("=" * 80)
    print()

    # Step 1: Read master playlist
    print("📖 Reading master_playlist_index.csv...")
    rows = read_master_playlist('master_playlist_index.csv')
    print(f"   Loaded {len(rows)} tracks")
    print()

    # Step 2: Identify duplicates before removal
    print("🔍 Analyzing duplicates...")
    duplicates = identify_duplicates(rows)
    print(f"   Found {len(duplicates)} duplicate songs")
    print()

    # Step 3: Remove duplicates and fix Friday
    print("🧹 Removing duplicates and fixing Friday Noon playlist...")
    cleaned_rows, removal_report = remove_duplicates_and_fix_friday(rows)
    print(f"   Removed {removal_report['total_removed']} tracks")
    print(f"   - {len(removal_report['duplicates_removed'])} duplicate songs")
    print(f"   - {len(removal_report['friday_noon_removed'])} tracks from Friday Noon")
    print(f"   Cleaned playlist has {len(cleaned_rows)} tracks")
    print()

    # Step 4: Write cleaned CSV
    print("💾 Writing master_playlist_index_cleaned.csv...")
    write_cleaned_csv(cleaned_rows, 'master_playlist_index_cleaned.csv')
    print("   ✓ Done")
    print()

    # Step 5: Analyze gaps
    print("📊 Analyzing playlists for gaps...")
    gap_report = analyze_gaps(cleaned_rows)
    print(f"   {len(gap_report)} playlists need additional tracks")
    print()

    # Step 6: Write gap report
    print("💾 Writing tracks_needed.json...")
    with open('tracks_needed.json', 'w', encoding='utf-8') as f:
        json.dump(gap_report, f, indent=2)
    print("   ✓ Done")
    print()

    # Step 7: Write detailed removal report
    print("💾 Writing duplicate_removal_report.json...")
    with open('duplicate_removal_report.json', 'w', encoding='utf-8') as f:
        json.dump(removal_report, f, indent=2)
    print("   ✓ Done")
    print()

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Original tracks:     {len(rows)}")
    print(f"Cleaned tracks:      {len(cleaned_rows)}")
    print(f"Tracks removed:      {removal_report['total_removed']}")
    print(f"Playlists needing tracks: {len(gap_report)}")
    print()

    if gap_report:
        print("Playlists with gaps:")
        for playlist_id, info in gap_report.items():
            print(f"  • {info['day']} {info['time']} - {info['playlist_name']}")
            print(f"    Current: {info['current_count']}, Need: {info['needed']} more")

    print()
    print("✅ Duplicate removal complete!")
    print()
    print("Next steps:")
    print("  1. Review cleaned CSV and gap report")
    print("  2. Run suggest_replacements.py to get AI suggestions")
    print("  3. Run curate_replacements.py to interactively fill gaps")


if __name__ == '__main__':
    main()
