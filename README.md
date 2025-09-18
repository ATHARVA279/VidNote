# VidNote

A video summarization application that uses AI to generate notes from YouTube videos.

## Setup Instructions

### Prerequisites

- Node.js and npm
- Python 3.7+
- MongoDB (local installation or MongoDB Atlas account)
- yt-dlp (for video transcript extraction)
- Google Gemini API key

### MongoDB Setup

Choose one of the following options:

#### Option 1: Local MongoDB Installation

1. Install MongoDB Community Edition from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically after installation
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`
3. Use connection string: `mongodb://localhost:27017/vidnote`

#### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user and get the connection string
4. Use connection string format: `mongodb+srv://username:password@cluster.mongodb.net/vidnote`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_uri_here
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

3. Start the Flask server:

```bash
python server.py
```

Or use the npm script from the root directory:

```bash
npm run server
```

### Running the Application

1. Start the backend server (Flask will run on https://vidnote.onrender.com)
2. Start the frontend development server (Vite will run on http://localhost:5173)
3. Open your browser and navigate to the frontend URL

## Features

- YouTube video URL input
- Automatic transcript extraction using yt-dlp
- AI-powered note generation using Google's Gemini AI
- MongoDB storage for saved summaries
- Dashboard to view and search saved videos
- Clean, organized study notes output
- Responsive web interface

## API Endpoints

- `GET /summary?url=<youtube_url>` - Generate and save notes from a YouTube video
- `GET /videos` - Retrieve all saved videos with pagination and search
- `GET /video/<id>` - Get specific video details including transcript and summary
- `DELETE /video/<id>` - Delete a saved video
- `POST /video/<id>/tags` - Update tags for a video
- `PUT /video/<id>/notes` - Save user notes and highlighted segments
- `GET /video/<id>/notes` - Retrieve user notes and highlighted segments
