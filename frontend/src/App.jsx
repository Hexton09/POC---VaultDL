import { AlertCircle, CheckCircle, Download, Loader2, PlaySquare } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadVideo, fetchVideoInfo } from './services/api';

/* ══════════════════════════════════════════════════════════════
   LOGO
══════════════════════════════════════════════════════════════ */
function Logo({ className = 'size-7' }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" />
        </svg>
    );
}

/* ══════════════════════════════════════════════════════════════
   URL INPUT FORM  —  Step 1: glowing search bar
══════════════════════════════════════════════════════════════ */
function UrlInputForm({ url, setUrl, status, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-xl mx-auto relative group">
            {/* Glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-200 pointer-events-none" />

            <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden h-16 transition-transform focus-within:scale-[1.01] border border-slate-100 dark:border-slate-700">
                <div className="pl-5 text-slate-400 dark:text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl select-none">link</span>
                </div>

                <input
                    type="url"
                    required
                    placeholder="Paste video URL here..."
                    className="w-full h-full border-none focus:ring-0 bg-transparent px-4 text-text-main dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={status === 'fetching'}
                />

                <div className="pr-2 shrink-0">
                    <button
                        type="submit"
                        disabled={status === 'fetching' || !url}
                        className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                        {status === 'fetching'
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                            : <>Analyze</>}
                    </button>
                </div>
            </div>
        </form>
    );
}

/* ══════════════════════════════════════════════════════════════
   VIDEO PREVIEW CARD  —  thumbnail + title + duration
══════════════════════════════════════════════════════════════ */
function VideoPreviewCard({ videoInfo }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-5 flex gap-4 hover:shadow-xl transition-all">
            {videoInfo.thumbnail ? (
                <img
                    src={videoInfo.thumbnail}
                    alt="Thumbnail"
                    className="w-32 h-20 object-cover rounded-xl shrink-0"
                />
            ) : (
                <div className="w-32 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <PlaySquare className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <h3 className="font-bold text-text-main dark:text-white truncate text-base" title={videoInfo.title}>
                    {videoInfo.title || 'Unknown Title'}
                </h3>
                <div className="flex items-center gap-1.5 text-text-sub dark:text-slate-400 text-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    {videoInfo.duration}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   FORMAT SELECTOR  —  dropdown to pick quality / format
══════════════════════════════════════════════════════════════ */
function FormatSelector({ formats, selectedFormat, onChange }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-lg space-y-3">
            <label className="block text-sm font-bold text-text-main dark:text-white">Select Format</label>
            <div className="relative">
                <select
                    value={selectedFormat}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-bg-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-text-main dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-colors"
                >
                    {formats.map((fmt, idx) => (
                        <option key={`${fmt.format_id}-${idx}`} value={fmt.format_id}>
                            {fmt.resolution !== 'Audio' ? `[${fmt.resolution}] ` : '[Audio] '}
                            {fmt.type} · {fmt.ext.toUpperCase()} · {fmt.filesize_mb} MB
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-sub dark:text-slate-400">
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   STATUS MESSAGE  —  success / error banner
══════════════════════════════════════════════════════════════ */
function StatusMessage({ status, message }) {
    if (status === 'success') return (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
    );
    if (status === 'error') return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
    );
    return null;
}

/* ══════════════════════════════════════════════════════════════
   APP  —  main orchestrator
══════════════════════════════════════════════════════════════ */
export default function App() {
    const navigate = useNavigate();

    // ── State ────────────────────────────────────────────────
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle | fetching | selecting | downloading | success | error
    const [videoInfo, setVideoInfo] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [message, setMessage] = useState('');
    const [cookies, setCookies] = useState('');

    // ── Step 1: fetch video info & formats ───────────────────
    const handleFetchInfo = async (e) => {
        e.preventDefault();
        if (!url) return;
        setStatus('fetching');
        setMessage('Analyzing video links securely...');
        try {
            const data = await fetchVideoInfo(url, cookies);
            setVideoInfo(data);
            if (data.formats?.length > 0) setSelectedFormat(data.formats[0].format_id);
            setStatus('selecting');
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Could not connect to the backend server.');
        }
    };

    // ── Step 2: download & trigger save dialog ───────────────
    const handleDownload = async () => {
        setStatus('downloading');
        setMessage('Downloading... please wait, large files may take a moment.');
        try {
            const response = await downloadVideo(url, selectedFormat, cookies);
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'download';
            if (disposition) {
                const match = disposition.match(/filename="([^"]+)"/);
                if (match) filename = match[1];
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            setStatus('success');
            setMessage(`"${filename}" downloaded successfully! Check your Downloads folder.`);
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Download request failed.');
        }
    };

    // ── Reset ─────────────────────────────────────────────────
    const resetForm = () => {
        setUrl('');
        setVideoInfo(null);
        setStatus('idle');
        setMessage('');
    };

    const showStep1 = status === 'idle' || status === 'fetching' || status === 'error';
    const showStep2 = (status === 'selecting' || status === 'downloading' || status === 'success') && videoInfo;

    return (
        <div className="min-h-screen flex flex-col">

            {/* ── Sticky Top Nav ───────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5 text-text-main dark:text-white">
                        <span className="text-primary"><Logo /></span>
                        <span className="text-xl font-extrabold tracking-tight">SecureDL</span>
                    </div>
                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {['Features', 'How It Works', 'Community'].map(link => (
                            <a key={link} href="#"
                                className="text-text-sub dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors">
                                {link}
                            </a>
                        ))}
                        <button
                            onClick={() => navigate('/docs')}
                            className="text-text-sub dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors">
                            Docs
                        </button>
                    </nav>
                    {/* CTA */}
                    <button className="bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2.5 px-6 rounded-full transition-all shadow-md hover:shadow-lg">
                        Get Started
                    </button>
                </div>
            </header>

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative pt-20 pb-24 px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-text-main dark:text-white leading-tight tracking-tight">
                            Download Any <span className="text-primary">Video</span> Instantly
                        </h1>
                        <p className="text-lg md:text-xl text-text-sub dark:text-slate-300 font-medium max-w-2xl mx-auto">
                            Paste a link, choose your format, and save — all through a private encrypted backend.
                        </p>
                    </div>

                    {/* Glowing URL input (Step 1) */}
                    {showStep1 && (
                        <>
                            <UrlInputForm
                                url={url}
                                setUrl={setUrl}
                                status={status}
                                onSubmit={handleFetchInfo}
                            />
                            
                            {/* Cookies Input */}
                            <div className="w-full max-w-xl mx-auto">
                                <details className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
                                    <summary className="cursor-pointer text-sm font-semibold text-text-main dark:text-white mb-2">
                                        Advanced: YouTube Cookies (Optional)
                                    </summary>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        If downloads fail due to bot detection, paste your YouTube cookies here. 
                                        <a href="https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies" 
                                           target="_blank" rel="noopener noreferrer" 
                                           className="text-primary underline">
                                            How to export cookies
                                        </a>
                                    </p>
                                    <textarea
                                        placeholder="Paste Netscape/Mozilla cookie format here..."
                                        className="w-full bg-bg-light dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-text-main dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                                        rows="4"
                                        value={cookies}
                                        onChange={(e) => setCookies(e.target.value)}
                                        disabled={status === 'fetching'}
                                    />
                                </details>
                            </div>
                            
                            {status === 'error' && (
                                <div className="w-full max-w-xl mx-auto">
                                    <StatusMessage status={status} message={message} />
                                </div>
                            )}
                            {/* Decorative tags */}
                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                                {['🎬 YouTube', '🎵 Audio Only', '📹 HD Quality', '⚡ Fast & Private'].map(tag => (
                                    <span key={tag}
                                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-text-sub dark:text-slate-300 shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ── Result Card (Step 2) ──────────────────────────────── */}
            {showStep2 && (
                <section className="pb-24 px-6 flex justify-center">
                    <div className="w-full max-w-xl space-y-6">
                        <VideoPreviewCard videoInfo={videoInfo} />

                        {status === 'selecting' && (
                            <FormatSelector
                                formats={videoInfo.formats}
                                selectedFormat={selectedFormat}
                                onChange={setSelectedFormat}
                            />
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            {status === 'selecting' && (
                                <button
                                    onClick={resetForm}
                                    className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-text-main dark:text-white border border-slate-200 dark:border-slate-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
                                    ← Back
                                </button>
                            )}
                            {status !== 'success' && (
                                <button
                                    onClick={handleDownload}
                                    disabled={status === 'downloading'}
                                    className="flex-[2] bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                    {status === 'downloading' ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Downloading...</>
                                    ) : (
                                        <><Download className="w-5 h-5" /> Download Now</>
                                    )}
                                </button>
                            )}
                        </div>

                        {status === 'success' && (
                            <div className="space-y-4">
                                <StatusMessage status={status} message={message} />
                                <button
                                    onClick={resetForm}
                                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-text-main dark:text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
                                    Download Another
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ── Footer ───────────────────────────────────────────── */}
            <footer className="mt-auto bg-bg-light dark:bg-bg-dark py-10 px-6 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2.5 text-primary opacity-80">
                        <Logo className="size-5" />
                        <span className="text-text-sub dark:text-slate-400 text-sm">© 2025 SecureDL. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        {['Privacy Policy', 'Terms of Service', 'GitHub'].map(link => (
                            <a key={link} href="#"
                                className="text-text-sub dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm transition-colors">
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}