import os
import shutil
import tempfile
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yt_dlp

app = FastAPI(title="VaultDL API")

# standard browser UA to avoid bot blocks
DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"


# --- CORS CONFIGURATION ---
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://poc-vaultdl.onrender.com",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# --- FFMPEG & COOKIE SETUP ---
FFMPEG_PATH = shutil.which("ffmpeg")
FFMPEG_LOCATION = os.path.dirname(FFMPEG_PATH) if FFMPEG_PATH else None

# Path for cookies (Render Secret Files are placed in /etc/secrets/)
COOKIE_PATH = "cookies.txt" if os.path.exists("cookies.txt") else "/etc/secrets/cookies.txt"
HAS_COOKIES = os.path.exists(COOKIE_PATH)

class InfoRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format_id: str

def stream_and_cleanup(file_path: str, temp_dir: str):
    """Generator to stream file chunks and delete the temp folder after completion."""
    try:
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                while chunk := f.read(1024 * 1024): # 1MB chunks
                    yield chunk
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

# --- ROUTES ---

@app.get("/")
@app.head("/")
async def health_check():
    """Health check endpoint for Render monitoring."""
    return {
        "status": "online", 
        "message": "VaultDL API is running",
        "cookies_detected": HAS_COOKIES
    }

@app.post("/api/info")
async def get_info(request: InfoRequest):
    # We remove 'format': 'best' here to avoid "Requested format is not available" errors.
    # We want the full list of metadata so we can filter it ourselves.
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'extract_flat': False,
        'user_agent': DEFAULT_USER_AGENT,
    }
    
    if HAS_COOKIES:
        ydl_opts['cookiefile'] = COOKIE_PATH
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)
            
            raw_formats = info.get('formats', [])
            processed_formats = []
            
            # Use a set to avoid duplicate resolutions
            seen_resolutions = set()
            
            # Sort formats by resolution (highest first)
            sorted_formats = sorted(
                [f for f in raw_formats if f.get('height')], 
                key=lambda x: x.get('height', 0), 
                reverse=True
            )

            for f in sorted_formats:
                height = f.get('height')
                # We want video formats with a height >= 720
                if height and height >= 720 and f.get('vcodec') != 'none':
                    res_label = f"{height}p"
                    if res_label not in seen_resolutions:
                        processed_formats.append({
                            "format_id": f.get('format_id'),
                            "resolution": res_label,
                            "ext": f.get('ext', 'mp4'),
                            "note": f.get('format_note', 'HD'),
                            "type": "video"
                        })
                        seen_resolutions.add(res_label)

            # Add an MP3 option (Best Audio) as a fallback/default
            processed_formats.append({
                "format_id": "bestaudio/best",
                "resolution": "Best Audio",
                "ext": "mp3",
                "note": "192kbps",
                "type": "audio"
            })

            return {
                "title": info.get('title', 'Video'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "formats": processed_formats[:6] # Keep the UI clean
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

@app.post("/api/download")
async def download_media(request: DownloadRequest):
    temp_dir = tempfile.mkdtemp()
    output_template = os.path.join(temp_dir, f"{uuid.uuid4()}.%(ext)s")
    
    is_audio = "audio" in request.format_id or "bestaudio" in request.format_id
    
    ydl_opts = {
        'format': request.format_id,
        'outtmpl': output_template,
        'ffmpeg_location': FFMPEG_LOCATION,
        'quiet': True,
        'noplaylist': True,
        'user_agent': DEFAULT_USER_AGENT,
    }

    if HAS_COOKIES:
        ydl_opts['cookiefile'] = COOKIE_PATH

    if is_audio:
        ydl_opts.update({
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=True)
            filename = ydl.prepare_filename(info)
            
            if is_audio:
                filename = filename.rsplit('.', 1)[0] + ".mp3"
            
            # Ensure we find the file even if extension changed during processing
            if not os.path.exists(filename):
                files = os.listdir(temp_dir)
                if files:
                    filename = os.path.join(temp_dir, files[0])
                else:
                    raise FileNotFoundError("FFmpeg processing failed to generate output.")

            display_name = f"{info.get('title', 'download')}.{'mp3' if is_audio else 'mp4'}"

            return StreamingResponse(
                stream_and_cleanup(filename, temp_dir),
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename=\"{display_name}\""}
            )

    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Render provides the PORT env var, defaults to 10000 for Docker
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
