from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import google.generativeai as genai
import re
import logging
import json
import tempfile
import os
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash-lite")

try:
    client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
    db = client.vidnote
    videos_collection = db.videos
    logging.info("Connected to MongoDB successfully")
except Exception as e:
    logging.error(f"Failed to connect to MongoDB: {e}")
    raise


def extract_video_id(url):
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    logging.debug(
        f"Extracted video ID: {match.group(1) if match else 'None'} from URL: {url}"
    )
    return match.group(1) if match else None


def get_video_metadata(url):
    """Extract video metadata using yt-dlp"""
    try:
        cmd = [
            "yt-dlp",
            "--print",
            "%(title)s",
            "--print",
            "%(thumbnail)s",
            "--print",
            "%(duration)s",
            "--print",
            "%(upload_date)s",
            "--print",
            "%(uploader)s",
            "--user-agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "--extractor-args",
            "youtube:player-client=web",
            "--no-check-certificates",
            url,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        lines = result.stdout.strip().split("\n")

        return {
            "title": lines[0] if len(lines) > 0 else "Unknown Title",
            "thumbnail": lines[1] if len(lines) > 1 else "",
            "duration": int(lines[2]) if len(lines) > 2 and lines[2].isdigit() else 0,
            "upload_date": lines[3] if len(lines) > 3 else "",
            "uploader": lines[4] if len(lines) > 4 else "Unknown Uploader",
        }
    except subprocess.CalledProcessError as e:
        logging.warning(f"Could not extract video metadata: {e.stderr}")
        video_id = extract_video_id(url)
        return {
            "title": f"Video {video_id}" if video_id else "Unknown Title",
            "thumbnail": (
                f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                if video_id
                else ""
            ),
            "duration": 0,
            "upload_date": "",
            "uploader": "Unknown Uploader",
        }


def get_transcript_fallback(url):
    """Fallback method using youtube-transcript-api"""
    try:
        video_id = extract_video_id(url)
        if not video_id:
            raise ValueError("Could not extract video ID from URL")

        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = " ".join([item["text"] for item in transcript_list])

        logging.info(
            f"Successfully extracted transcript using youtube-transcript-api for video {video_id}"
        )
        return transcript_text

    except Exception as e:
        logging.error(f"Fallback transcript extraction failed: {e}")
        raise


def get_transcript_ytdlp(url):
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, "subtitle.json")
        cmd = [
            "yt-dlp",
            "--write-auto-sub",
            "--sub-lang",
            "en",
            "--skip-download",
            "--sub-format",
            "json3",
            "-o",
            os.path.join(tmpdir, "%(id)s"),
            url,
        ]

        try:
            result = subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            logging.debug(f"yt-dlp stdout: {result.stdout}")
        except subprocess.CalledProcessError as e:
            logging.error(f"yt-dlp failed with stderr: {e.stderr}")
            cmd_alt = [
                "yt-dlp",
                "--write-auto-sub",
                "--sub-lang",
                "en",
                "--skip-download",
                "--sub-format",
                "json3",
                "--user-agent",
                "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                "-o",
                os.path.join(tmpdir, "%(id)s"),
                url,
            ]
            try:
                subprocess.run(
                    cmd_alt,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
            except subprocess.CalledProcessError as e2:
                logging.error(f"Alternative yt-dlp also failed: {e2.stderr}")
                raise

        video_id = extract_video_id(url)
        subtitle_file = os.path.join(tmpdir, f"{video_id}.en.json3")

        if not os.path.exists(subtitle_file):
            raise FileNotFoundError("Subtitle file not generated.")

        with open(subtitle_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        transcript = []
        for event in data.get("events", []):
            if "segs" in event:
                for seg in event["segs"]:
                    transcript.append(seg.get("utf8", "").strip())

        return " ".join(transcript)


def generate_notes_chunk(text):
    prompt = (
        "You're an AI assistant tasked with creating detailed, clear, and well-structured study notes "
        "from YouTube video transcripts.\n\n"
        "For the following transcript segment, generate notes that:\n"
        "- Are organized in paragraphs, not bullet points.\n"
        "- Include key concepts, explanations, and examples.\n"
        "- Skip fillers, greetings, and timestamps.\n"
        "- Write in a friendly and easy-to-understand manner as if explaining to a peer.\n\n"
        "Transcript segment:\n" + text
    )
    response = model.generate_content(prompt)
    return response.text.strip() if hasattr(response, "text") else None


@app.route("/summary", methods=["GET"])
def summarize_youtube_video():
    url = request.args.get("url")
    logging.debug(f"Received URL: {url}")

    if not url:
        return jsonify({"error": "Missing YouTube URL"}), 400

    try:
        video_id = extract_video_id(url)
        if video_id:
            existing_video = videos_collection.find_one({"video_id": video_id})
            if existing_video:
                logging.info(f"Video {video_id} already exists in database")
                return jsonify(
                    {
                        "notes": existing_video.get("summary", ""),
                        "transcript": existing_video.get("transcript", ""),
                        "video_id": str(existing_video["_id"]),
                        "title": existing_video.get("title", ""),
                        "from_cache": True,
                    }
                )

        metadata = get_video_metadata(url)

        transcript_text = None
        try:
            transcript_text = get_transcript_ytdlp(url)
        except Exception as e:
            logging.warning(f"yt-dlp failed, trying fallback method: {e}")
            try:
                transcript_text = get_transcript_fallback(url)
            except Exception as fallback_error:
                logging.error(
                    f"Both transcript extraction methods failed: {fallback_error}"
                )
                return (
                    jsonify(
                        {
                            "error": "Could not extract transcript from this video. It may not have captions available."
                        }
                    ),
                    404,
                )

        if not transcript_text:
            return jsonify({"error": "Transcript not found or empty"}), 404

        logging.debug(f"Transcript length: {len(transcript_text)} characters")

        chunk_size = 12000
        if len(transcript_text) > chunk_size:
            chunks = [
                transcript_text[i : i + chunk_size]
                for i in range(0, len(transcript_text), chunk_size)
            ]
            chunk_notes = []

            for idx, chunk in enumerate(chunks):
                logging.debug(f"Processing chunk {idx + 1}/{len(chunks)}")
                notes = generate_notes_chunk(chunk)
                if notes:
                    chunk_notes.append(notes)
                else:
                    logging.warning(f"Empty notes for chunk {idx + 1}")

            final_notes = "\n\n".join(chunk_notes)
        else:
            final_notes = generate_notes_chunk(transcript_text)

        if not final_notes:
            return jsonify({"error": "Notes generation failed"}), 500

        video_document = {
            "video_id": video_id,
            "url": url,
            "title": metadata["title"],
            "thumbnail": metadata["thumbnail"],
            "duration": metadata["duration"],
            "upload_date": metadata["upload_date"],
            "uploader": metadata["uploader"],
            "transcript": transcript_text,
            "summary": final_notes,
            "user_notes": "",
            "highlighted_segments": [],
            "created_at": datetime.utcnow(),
            "last_edited": datetime.utcnow(),
            "tags": [],
        }

        try:
            result = videos_collection.insert_one(video_document)
            logging.info(f"Saved video to MongoDB with ID: {result.inserted_id}")

            return jsonify(
                {
                    "notes": final_notes,
                    "transcript": transcript_text,
                    "video_id": str(result.inserted_id),
                    "title": metadata["title"],
                    "from_cache": False,
                }
            )

        except Exception as db_error:
            logging.error(f"Failed to save to database: {db_error}")
            return jsonify(
                {
                    "notes": final_notes,
                    "transcript": transcript_text,
                    "warning": "Content generated but not saved to database",
                }
            )

    except subprocess.CalledProcessError as e:
        logging.error(f"yt-dlp failed: {e.stderr.decode()}")
        return jsonify({"error": "yt-dlp failed. Try another video."}), 500
    except FileNotFoundError as fe:
        logging.error(str(fe))
        return (
            jsonify({"error": "Transcript not available or subtitle file not found"}),
            404,
        )
    except Exception as e:
        logging.exception("Unexpected error during notes generation")
        return jsonify({"error": str(e)}), 500


@app.route("/videos", methods=["GET"])
def get_all_videos():
    """Get all saved videos for the dashboard"""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        search_query = request.args.get("search", "")

        logging.debug(
            f"Fetching videos: page={page}, limit={limit}, search='{search_query}'"
        )

        query = {}
        if search_query:
            query = {
                "$or": [
                    {"title": {"$regex": search_query, "$options": "i"}},
                    {"uploader": {"$regex": search_query, "$options": "i"}},
                    {"summary": {"$regex": search_query, "$options": "i"}},
                ]
            }

        total_count = videos_collection.count_documents(query)
        logging.debug(f"Total videos found: {total_count}")

        videos = list(
            videos_collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )

        logging.debug(f"Retrieved {len(videos)} videos from database")

        formatted_videos = []
        for video in videos:
            try:
                formatted_video = {
                    "id": str(video["_id"]),
                    "video_id": video.get("video_id", ""),
                    "url": video.get("url", ""),
                    "title": video.get("title", "Unknown Title"),
                    "thumbnail": video.get("thumbnail", ""),
                    "duration": video.get("duration", 0),
                    "uploader": video.get("uploader", "Unknown"),
                    "created_at": (
                        video.get("created_at").isoformat()
                        if video.get("created_at")
                        else ""
                    ),
                    "tags": video.get("tags", []),
                }
                formatted_videos.append(formatted_video)
                logging.debug(
                    f"Formatted video: {video.get('title', 'Unknown')} (ID: {formatted_video['id']})"
                )
            except Exception as format_error:
                logging.error(
                    f"Error formatting video {video.get('_id', 'unknown')}: {format_error}"
                )
                continue

        response_data = {
            "videos": formatted_videos,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

        logging.debug(f"Returning {len(formatted_videos)} formatted videos")
        return jsonify(response_data)

    except Exception as e:
        logging.exception("Error fetching videos from database")
        return jsonify({"error": str(e)}), 500


@app.route("/video/<video_id>", methods=["GET"])
def get_video_by_id(video_id):
    """Get a specific video by ID"""
    try:
        logging.debug(f"Fetching video with ID: {video_id}")

        if not ObjectId.is_valid(video_id):
            logging.error(f"Invalid video ID format: {video_id}")
            return jsonify({"error": "Invalid video ID format"}), 400

        video = videos_collection.find_one({"_id": ObjectId(video_id)})

        if not video:
            logging.error(f"Video not found with ID: {video_id}")
            return jsonify({"error": "Video not found"}), 404

        logging.debug(f"Found video: {video.get('title', 'Unknown')} (ID: {video_id})")

        formatted_video = {
            "id": str(video["_id"]),
            "video_id": video.get("video_id", ""),
            "url": video.get("url", ""),
            "title": video.get("title", "Unknown Title"),
            "thumbnail": video.get("thumbnail", ""),
            "duration": video.get("duration", 0),
            "uploader": video.get("uploader", "Unknown"),
            "transcript": video.get("transcript", ""),
            "summary": video.get("summary", ""),
            "user_notes": video.get("user_notes", ""),
            "highlighted_segments": video.get("highlighted_segments", []),
            "created_at": (
                video.get("created_at").isoformat() if video.get("created_at") else ""
            ),
            "last_edited": (
                video.get("last_edited").isoformat() if video.get("last_edited") else ""
            ),
            "tags": video.get("tags", []),
        }

        logging.debug(f"Returning formatted video data for: {formatted_video['title']}")
        return jsonify(formatted_video)

    except Exception as e:
        logging.exception(f"Error fetching video {video_id} from database")
        return jsonify({"error": str(e)}), 500


@app.route("/video/<video_id>", methods=["DELETE"])
def delete_video(video_id):
    """Delete a specific video"""
    try:
        result = videos_collection.delete_one({"_id": ObjectId(video_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Video not found"}), 404

        return jsonify({"message": "Video deleted successfully"})

    except Exception as e:
        logging.exception("Error deleting video from database")
        return jsonify({"error": str(e)}), 500


@app.route("/video/<video_id>/tags", methods=["POST"])
def update_video_tags(video_id):
    """Update tags for a video"""
    try:
        data = request.get_json()
        tags = data.get("tags", [])

        result = videos_collection.update_one(
            {"_id": ObjectId(video_id)}, {"$set": {"tags": tags}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Video not found"}), 404

        return jsonify({"message": "Tags updated successfully"})

    except Exception as e:
        logging.exception("Error updating video tags")
        return jsonify({"error": str(e)}), 500


@app.route("/video/<video_id>/notes", methods=["PUT"])
def update_user_notes(video_id):
    """Update user notes for a video"""
    try:
        data = request.get_json()
        user_notes = data.get("user_notes", "")

        result = videos_collection.update_one(
            {"_id": ObjectId(video_id)},
            {"$set": {"user_notes": user_notes, "last_edited": datetime.utcnow()}},
        )

        if result.matched_count == 0:
            return jsonify({"error": "Video not found"}), 404

        return jsonify({"message": "User notes updated successfully"})

    except Exception as e:
        logging.exception("Error updating user notes")
        return jsonify({"error": str(e)}), 500


@app.route("/video/<video_id>/notes", methods=["GET"])
def get_user_notes(video_id):
    """Get user notes for a video"""
    try:
        video = videos_collection.find_one(
            {"_id": ObjectId(video_id)}, {"user_notes": 1, "last_edited": 1}
        )

        if not video:
            return jsonify({"error": "Video not found"}), 404

        return jsonify(
            {
                "user_notes": video.get("user_notes", ""),
                "last_edited": (
                    video.get("last_edited").isoformat()
                    if video.get("last_edited")
                    else ""
                ),
            }
        )

    except Exception as e:
        logging.exception("Error fetching user notes")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
