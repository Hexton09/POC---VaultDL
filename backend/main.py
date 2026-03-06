# 1. Install dependencies: pip install fastapi uvicorn yt-dlp pydantic flask-cors
# 2. Run the server: uvicorn main:app --reload --port 8000

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp
import os
import shutil
import tempfile

# Locate FFmpeg: use PATH if available, otherwise fall back to the known winget install path
_FFMPEG_FALLBACK = os.path.join(
    os.environ.get("LOCALAPPDATA", ""),
    "Microsoft", "WinGet", "Packages",
    "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "ffmpeg-8.0.1-full_build", "bin"
)
FFMPEG_LOCATION = shutil.which("ffmpeg") and os.path.dirname(shutil.which("ffmpeg")) or _FFMPEG_FALLBACK

# Proxy configuration (set PROXY_URL environment variable for hosted deployments)
# If not set, will use a default free proxy (may not work)
PROXY_URL = os.environ.get("PROXY_URL", "http://113.193.192.2:8080")

app = FastAPI(title="Secure YT-DLP API")

# Security: Configure CORS to ONLY allow your React frontend's domain/IP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://poc-vaultdl.onrender.com"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # So browser JS can read the filename
)

# --- REQUEST MODELS ---
class InfoRequest(BaseModel):
    url: HttpUrl
    cookies: str = ""  # Optional: Netscape/Mozilla cookie format

class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: str  # The specific ID the user chose from the frontend (e.g., "18" or "137+bestaudio")
    cookies: str = ""  # Optional: Netscape/Mozilla cookie format


# --- ENDPOINT 1: Fetch Available Formats ---
@app.post("/api/info")
async def get_video_info(request: InfoRequest):
    """
    Fetches video metadata and a list of available formats WITHOUT downloading the video.
    """
    ydl_opts = {
        'noplaylist': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
    
    if PROXY_URL:
        ydl_opts['proxy'] = PROXY_URL
    
    if request.cookies:
        # Write cookies to a temp file
        import tempfile
        cookie_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt')
        cookie_file.write(request.cookies)
        cookie_file.close()
        ydl_opts['cookiefile'] = cookie_file.name
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # download=False means we just extract the info/metadata
            info = ydl.extract_info(str(request.url), download=False)
            
            # Clean up the format list to send to the frontend
            available_formats = []
            for f in info.get('formats', []):
                # Only include formats that actually have video or audio
                if f.get('vcodec') != 'none' or f.get('acodec') != 'none':
                    
                    has_video = f.get('vcodec') != 'none'
                    has_audio = f.get('acodec') != 'none'
                    
                    # Default format ID provided by YouTube
                    target_format_id = f.get("format_id")
                    
                    if has_video and has_audio:
                        type_label = "Video + Audio (Pre-merged)"
                    elif has_video:
                        type_label = "Video + Audio (High Quality Merge)"
                        # MAGIC HAPPENS HERE: We tell yt-dlp to grab this video AND the best audio
                        target_format_id = f"{target_format_id}+bestaudio"
                    else:
                        type_label = "Audio Only"

                    available_formats.append({
                        "format_id": target_format_id,
                        "ext": f.get("ext"),
                        "resolution": f.get("resolution") or "Audio",
                        "note": f.get("format_note") or "",
                        "type": type_label,
                        "filesize_mb": round(f.get("filesize", 0) / (1024 * 1024), 2) if f.get("filesize") else "Unknown"
                    })
                    
            # Sort formats by resolution (best to worst) just to make it look nice on the frontend
            available_formats.reverse()

            # ADD A DEDICATED BEST AUDIO (MP3) OPTION AT THE TOP
            available_formats.insert(0, {
                "format_id": "bestaudio_mp3",
                "ext": "mp3",
                "resolution": "Audio",
                "note": "Highest Quality",
                "type": "Audio Only (MP3 Extraction)",
                "filesize_mb": "Auto"
            })

            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration_string"),
                "formats": available_formats
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch info: {str(e)}. If this is a hosted deployment, YouTube may be blocking the server's IP range. Consider using a VPS or dedicated hosting instead of cloud platforms like Render.")
    finally:
        # Clean up cookie file if it was created
        if 'cookiefile' in ydl_opts:
            os.unlink(ydl_opts['cookiefile'])


# --- ENDPOINT 2: Download & Stream File to Browser ---
@app.post("/api/download")
async def trigger_download(request: DownloadRequest):
    """
    Downloads the video/audio to a temp folder, streams it directly to the
    user's browser, then deletes the temp file. Nothing is kept on the server.
    """
    url_str = str(request.url)
    format_id = request.format_id

    # Create a throwaway temp directory for this single download
    temp_dir = tempfile.mkdtemp()

    ydl_opts = {
        'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        'restrictfilenames': True,
        'noplaylist': True,
        'ffmpeg_location': FFMPEG_LOCATION,
        # Add user agent to mimic browser
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }

    if PROXY_URL:
        ydl_opts['proxy'] = PROXY_URL

    cookie_file_path = None
    if request.cookies:
        # Write cookies to a temp file
        cookie_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt')
        cookie_file.write(request.cookies)
        cookie_file.close()
        cookie_file_path = cookie_file.name
        ydl_opts['cookiefile'] = cookie_file_path

    if format_id == "bestaudio_mp3":
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else:
        ydl_opts['format'] = format_id

    # Run the download synchronously so we can stream the result back
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url_str])
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        # Log the error for debugging
        print(f"Download failed for {url_str}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Download failed: {str(e)}. If this is a hosted deployment, YouTube may be blocking the server's IP range. Consider using a VPS or dedicated hosting instead of cloud platforms like Render.")
    finally:
        # Clean up cookie file if it was created
        if cookie_file_path:
            os.unlink(cookie_file_path)

    files = os.listdir(temp_dir)
    if not files:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Download produced no output file.")

    file_path = os.path.join(temp_dir, files[0])
    filename = files[0]

    # Generator that streams the file in chunks, then cleans up the temp dir
    def stream_and_cleanup():
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(1024 * 1024):  # 1 MB chunks
                    yield chunk
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    return StreamingResponse(
        stream_and_cleanup(),
        media_type='application/octet-stream',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )