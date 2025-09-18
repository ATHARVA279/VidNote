# VidNote

A video summarization application that uses AI to generate notes from YouTube videos.

## Setup Instructions

### Prerequisites
- Node.js and npm
- Python 3.7+
- yt-dlp (for video transcript extraction)
- Google Gemini API key

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:
1. Visit the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file

**Note:** Never commit your `.env` file to version control. Add `.env` to your `.gitignore` file.

### Frontend Setup
1. Install Node.js dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Backend Setup
1. Navigate to the Server directory:
```bash
cd Server
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory and add your API keys:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the Flask server:
```bash
python server.py
```

Or use the npm script from the root directory:
```bash
npm run server
```

### Running the Application
1. Start the backend server (Flask will run on http://localhost:5000)
2. Start the frontend development server (Vite will run on http://localhost:5173)
3. Open your browser and navigate to the frontend URL

## Features
- YouTube video URL input
- Automatic transcript extraction using yt-dlp
- AI-powered note generation using Google's Gemini AI
- Clean, organized study notes output
- Responsive web interface

## API Endpoints
- `GET /summary?url=<youtube_url>` - Generate notes from a YouTube video