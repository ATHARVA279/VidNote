from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import google.generativeai as genai
import re
import logging
import json
import tempfile
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

genai.configure(api_key="AIzaSyBvuAmAH_J_xjh-2pOuiobhNN6ztApksyw")
model = genai.GenerativeModel("gemini-2.0-flash-lite")

# Extract video ID from URL
def extract_video_id(url):
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    logging.debug(f"Extracted video ID: {match.group(1) if match else 'None'} from URL: {url}")
    return match.group(1) if match else None

# Fetch transcript using yt-dlp and return plain text
def get_transcript_ytdlp(url):
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, 'subtitle.json')
        cmd = [
            "yt-dlp",
            "--write-auto-sub",
            "--sub-lang", "en",
            "--skip-download",
            "--sub-format", "json3",
            "-o", os.path.join(tmpdir, "%(id)s"),
            url
        ]

        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

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

# Generate AI notes from a text chunk
def generate_notes_chunk(text):
    prompt = (
        "You're an AI assistant tasked with creating detailed, clear, and well-structured study notes "
        "from YouTube video transcripts.\n\n"
        "For the following transcript segment, generate notes that:\n"
        "- Are organized in paragraphs, not bullet points.\n"
        "- Include key concepts, explanations, and examples.\n"
        "- Skip fillers, greetings, and timestamps.\n"
        "- Write in a friendly and easy-to-understand manner as if explaining to a peer.\n\n"
        "Transcript segment:\n"
        + text
    )
    response = model.generate_content(prompt)
    return response.text.strip() if hasattr(response, 'text') else None

@app.route('/summary', methods=['GET'])
def summarize_youtube_video():
    url = request.args.get('url')
    logging.debug(f"Received URL: {url}")

    if not url:
        return jsonify({'error': 'Missing YouTube URL'}), 400

    try:
        transcript_text = get_transcript_ytdlp(url)

        if not transcript_text:
            return jsonify({'error': 'Transcript not found or empty'}), 404

        logging.debug(f"Transcript length: {len(transcript_text)} characters")

        chunk_size = 12000
        if len(transcript_text) > chunk_size:
            chunks = [transcript_text[i:i + chunk_size] for i in range(0, len(transcript_text), chunk_size)]
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
            return jsonify({'error': 'Notes generation failed'}), 500

        return jsonify({
            'notes': final_notes,
            'transcript': transcript_text
        })

    except subprocess.CalledProcessError as e:
        logging.error(f"yt-dlp failed: {e.stderr.decode()}")
        return jsonify({'error': 'yt-dlp failed. Try another video.'}), 500
    except FileNotFoundError as fe:
        logging.error(str(fe))
        return jsonify({'error': 'Transcript not available or subtitle file not found'}), 404
    except Exception as e:
        logging.exception("Unexpected error during notes generation")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
