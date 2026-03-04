import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV = [
    {
        group: 'Getting Started', items: [
            { id: 'overview', label: 'Overview' },
            { id: 'prerequisites', label: 'Prerequisites' },
            { id: 'install', label: 'Installation' },
            { id: 'ffmpeg', label: 'FFmpeg Setup' },
            { id: 'run', label: 'Running the App' },
        ]
    },
    {
        group: 'Reference', items: [
            { id: 'api', label: 'API Reference' },
            { id: 'structure', label: 'Project Structure' },
            { id: 'errors', label: 'Error Handling' },
        ]
    },
    {
        group: 'Deployment', items: [
            { id: 'deploy', label: 'Going Online' },
            { id: 'update', label: 'Keeping Updated' },
        ]
    },
];

function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ── Reusable primitives ── */
function SectionH2({ children }) {
    return <h2 className="text-xl font-bold text-white mt-9 mb-3 pb-2.5 border-b border-slate-700">{children}</h2>;
}
function SectionH3({ children }) {
    return <h3 className="text-sm font-semibold text-white mt-5 mb-2">{children}</h3>;
}
function P({ children, className = '' }) {
    return <p className={`text-slate-400 mb-2.5 leading-relaxed ${className}`}>{children}</p>;
}
function Code({ children }) {
    return <code className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[12.5px] text-blue-300 font-mono">{children}</code>;
}
function Pre({ children }) {
    return (
        <pre className="bg-[#080f1e] border border-slate-700 rounded-lg p-4 overflow-x-auto my-2.5 text-[13px] leading-relaxed font-mono text-slate-300 whitespace-pre-wrap break-words">
            <code>{children}</code>
        </pre>
    );
}
function Callout({ type, children }) {
    const styles = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
        warn: 'bg-orange-900/20 border-orange-500/40 text-yellow-400',
        ok: 'bg-green-500/10 border-green-600/40 text-green-300',
    };
    const icons = { info: 'ℹ️', warn: '⚠️', ok: '✅' };
    return (
        <div className={`flex gap-3 items-start border rounded-lg p-3.5 my-3.5 text-[13.5px] ${styles[type]}`}>
            <span className="mt-0.5 shrink-0">{icons[type]}</span>
            <p className="m-0 leading-relaxed">{children}</p>
        </div>
    );
}
function Steps({ items }) {
    return (
        <div className="flex flex-col gap-3 mt-3">
            {items.map(([title, desc], i) => (
                <div key={i} className="flex gap-3.5 items-start bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="w-6 h-6 shrink-0 mt-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{title}</div>
                        <div className="text-[13px] text-slate-400">{desc}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
function Table({ headers, rows }) {
    return (
        <div className="overflow-x-auto my-3 rounded-lg border border-slate-700">
            <table className="w-full border-collapse text-[13.5px]">
                <thead>
                    <tr>
                        {headers.map(h => (
                            <th key={h} className="bg-slate-800 text-slate-400 font-semibold text-left px-4 py-2.5 text-[11.5px] uppercase tracking-wide">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[.02]">
                            {row.map((cell, j) => (
                                <td key={j} className={`px-4 py-2.5 border-t border-slate-700 text-slate-400 align-top ${j === 0 ? 'text-slate-200 font-medium' : ''}`}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
function EndpointCard({ method, path, note, children }) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg mb-5 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 flex-wrap">
                <span className="text-[11px] font-extrabold tracking-wider px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/40">
                    {method}
                </span>
                <span className="font-bold text-white text-sm font-mono">{path}</span>
                <span className="text-slate-400 text-xs ml-auto">{note}</span>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

export default function Docs() {
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState('overview');

    useEffect(() => {
        const sections = document.querySelectorAll('[data-section]');
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
        }, { threshold: 0.35 });
        sections.forEach(s => obs.observe(s));
        return () => obs.disconnect();
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans text-[15px]">

            {/* ── Sidebar ── */}
            <nav className="w-64 shrink-0 bg-slate-800 border-r border-slate-700 py-6 sticky top-0 h-screen overflow-y-auto hidden md:block">
                <div className="flex items-center gap-2.5 px-5 pb-5 border-b border-slate-700 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-base">⬇</div>
                    <div>
                        <div className="font-bold text-white text-sm">VaultDL</div>
                        <div className="text-[11px] text-slate-400">Documentation</div>
                    </div>
                </div>

                {NAV.map(({ group, items }) => (
                    <div key={group}>
                        <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500 px-5 pt-4 pb-1">{group}</div>
                        <ul className="px-2.5 space-y-0.5">
                            {items.map(({ id, label }) => (
                                <li key={id}>
                                    <button
                                        onClick={() => scrollTo(id)}
                                        className={`w-full text-left px-3.5 py-1.5 rounded-lg text-[13.5px] transition-all cursor-pointer
                      ${activeId === id
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                                    >
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div className="px-4 pt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full text-left px-3.5 py-2 rounded-lg border border-slate-700 text-slate-400 text-[13px] hover:bg-slate-700 hover:text-slate-200 transition-all cursor-pointer"
                    >
                        ← Back to App
                    </button>
                </div>
            </nav>

            {/* ── Main Content ── */}
            <main className="flex-1 max-w-3xl px-8 md:px-14 py-12">

                {/* Overview */}
                <section id="overview" data-section className="mb-16 scroll-mt-8">
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-0.5 rounded-full text-xs font-semibold mb-3">⬇ VaultDL · Self-hosted</div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">VaultDL Documentation</h1>
                    <P className="text-base">
                        A self-hosted web app to download videos and audio from YouTube and 1000+ other sites.
                        Paste a URL, pick a format, and the file streams directly to your browser.
                        Nothing is stored permanently on the server.
                    </P>
                    <SectionH2>Tech Stack</SectionH2>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                        {['🐍 Python 3.10+', '⚡ FastAPI', '📥 yt-dlp', '⚛ React 18', '⚡ Vite', '🎨 Tailwind CSS', '🎬 FFmpeg'].map(b => (
                            <span key={b} className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-200">{b}</span>
                        ))}
                    </div>
                </section>

                {/* Prerequisites */}
                <section id="prerequisites" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Prerequisites</SectionH2>
                    <Table
                        headers={['Tool', 'Min Version', 'Notes']}
                        rows={[
                            ['Python', '3.10', <><a className="text-blue-400 hover:underline" href="https://python.org/downloads" target="_blank" rel="noreferrer">python.org</a> — backend runtime</>],
                            ['Node.js', '18', <><a className="text-blue-400 hover:underline" href="https://nodejs.org" target="_blank" rel="noreferrer">nodejs.org</a> — frontend build + fixes yt-dlp JS warning</>],
                            ['FFmpeg', 'Any recent', 'Required for merging 720p+ video+audio streams'],
                            ['pip', 'Latest', <><Code>pip install -U pip</Code></>],
                        ]}
                    />
                </section>

                {/* Installation */}
                <section id="install" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Installation</SectionH2>
                    <SectionH3>1 · Clone the repository</SectionH3>
                    <Pre>{`git clone https://github.com/Aditya-567/POC---VaultDL.git\ncd POC---VaultDL`}</Pre>
                    <SectionH3>2 · Backend dependencies</SectionH3>
                    <Pre>{`cd backend\npip install fastapi uvicorn yt-dlp pydantic`}</Pre>
                    <SectionH3>3 · Frontend dependencies</SectionH3>
                    <Pre>{`cd frontend\nnpm install`}</Pre>
                    <Callout type="info">Both servers must be running simultaneously. Use two separate terminal windows.</Callout>
                </section>

                {/* FFmpeg */}
                <section id="ffmpeg" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>FFmpeg Setup</SectionH2>
                    <P>YouTube delivers high-quality video and audio as <strong className="text-slate-200">separate streams</strong>. FFmpeg merges them. Without it, only pre-merged formats (360p/480p) and audio-only work.</P>
                    <Callout type="warn">Without FFmpeg you'll see: <strong>"You have requested merging of multiple formats but ffmpeg is not installed."</strong></Callout>
                    <SectionH3>Windows — winget (recommended)</SectionH3>
                    <Pre>winget install --id Gyan.FFmpeg -e --source winget</Pre>
                    <P>Open a <strong className="text-slate-200">new terminal</strong> after installing so PATH updates take effect.</P>
                    <SectionH3>Windows — manual</SectionH3>
                    <Steps items={[
                        ['Download', <><a className="text-blue-400 hover:underline" href="https://www.gyan.dev/ffmpeg/builds/" target="_blank" rel="noreferrer">gyan.dev/ffmpeg/builds</a> — get the latest full build</>],
                        ['Extract', 'Unzip to a permanent folder e.g. C:\\ffmpeg\\'],
                        ['Add to PATH', 'System Properties → Environment Variables → Path → add C:\\ffmpeg\\bin'],
                        ['Verify', <><Code>ffmpeg -version</Code> in a new terminal</>],
                    ]} />
                    <SectionH3>Linux / macOS</SectionH3>
                    <Pre>{`# Ubuntu/Debian\nsudo apt install ffmpeg\n\n# macOS\nbrew install ffmpeg`}</Pre>
                </section>

                {/* Running */}
                <section id="run" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Running the Application</SectionH2>
                    <SectionH3>Terminal 1 — Backend</SectionH3>
                    <Pre>{`cd backend\npython -m uvicorn main:app --reload --port 8000`}</Pre>
                    <P>API at <strong className="text-slate-200">http://localhost:8000</strong> · Swagger UI at <strong className="text-slate-200">http://localhost:8000/docs</strong></P>
                    <SectionH3>Terminal 2 — Frontend</SectionH3>
                    <Pre>{`cd frontend\nnpm run dev`}</Pre>
                    <P>App at <strong className="text-slate-200">http://localhost:5173</strong></P>
                    <SectionH3>Usage steps</SectionH3>
                    <Steps items={[
                        ['Paste a URL', 'Enter any YouTube (or supported site) link'],
                        ['Analyze Formats', 'Backend fetches all available formats — nothing is downloaded yet'],
                        ['Select a format', 'Choose resolution, file type (MP4 / WebM / MP3), and see estimated file size'],
                        ['Download', "File streams directly to your browser's Downloads folder. Nothing stays on the server."],
                    ]} />
                </section>

                {/* API */}
                <section id="api" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>API Reference</SectionH2>
                    <P>All endpoints are <Code>POST</Code>. CORS is restricted to <Code>http://localhost:5173</Code> by default.</P>

                    <EndpointCard method="POST" path="/api/info" note="Fetch formats — no download">
                        <SectionH3>Request body</SectionH3>
                        <Pre>{`{ "url": "https://www.youtube.com/watch?v=..." }`}</Pre>
                        <SectionH3>Response</SectionH3>
                        <Pre>{`{\n  "title": "Video Title",\n  "thumbnail": "https://...",\n  "duration": "3:45",\n  "formats": [\n    {\n      "format_id":   "bestaudio_mp3",\n      "ext":         "mp3",\n      "resolution":  "Audio",\n      "type":        "Audio Only (MP3 Extraction)",\n      "filesize_mb": "Auto"\n    }\n  ]\n}`}</Pre>
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/download" note="Download &amp; stream to browser">
                        <SectionH3>Request body</SectionH3>
                        <Pre>{`{\n  "url":       "https://www.youtube.com/watch?v=...",\n  "format_id": "137+bestaudio"\n}`}</Pre>
                        <SectionH3>Response</SectionH3>
                        <Pre>{`Content-Type: application/octet-stream\nContent-Disposition: attachment; filename="Video_Title.mp4"`}</Pre>
                        <Callout type="ok">File is downloaded to a temp folder, streamed to your browser, then immediately deleted from the server.</Callout>
                        <SectionH3>Special format_id values</SectionH3>
                        <Table
                            headers={['format_id', 'Behaviour']}
                            rows={[
                                [<Code>bestaudio_mp3</Code>, 'Best audio → 192kbps MP3 via FFmpeg'],
                                [<Code>{'{id}+bestaudio'}</Code>, 'Video + best audio merged via FFmpeg → MP4'],
                                [<Code>18</Code>, 'Pre-merged 360p MP4 — FFmpeg not needed'],
                            ]}
                        />
                    </EndpointCard>
                </section>

                {/* Structure */}
                <section id="structure" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Project Structure</SectionH2>
                    <div className="bg-[#080f1e] border border-slate-700 rounded-lg p-5 font-mono text-[13px] leading-loose overflow-x-auto whitespace-pre">
                        <span className="text-blue-400 font-bold">ytdownload/</span>{'\n'}
                        {'├── '}<span className="text-blue-400 font-bold">backend/</span>{'\n'}
                        {'│   ├── '}<span className="text-slate-300">main.py</span>{'            '}<span className="text-slate-500"># FastAPI app — all API logic</span>{'\n'}
                        {'│   └── '}<span className="text-blue-400 font-bold">downloads/</span>{'         '}<span className="text-slate-500"># Temp dir, auto-cleaned after each stream</span>{'\n'}
                        {'├── '}<span className="text-blue-400 font-bold">frontend/</span>{'\n'}
                        {'│   ├── '}<span className="text-blue-400 font-bold">public/</span>{'\n'}
                        {'│   │   └── '}<span className="text-slate-300">docs.html</span>{'      '}<span className="text-slate-500"># Static fallback docs</span>{'\n'}
                        {'│   ├── '}<span className="text-blue-400 font-bold">src/</span>{'\n'}
                        {'│   │   ├── '}<span className="text-slate-300">App.jsx</span>{'        '}<span className="text-slate-500"># Main React component</span>{'\n'}
                        {'│   │   ├── '}<span className="text-slate-300">main.jsx</span>{'       '}<span className="text-slate-500"># React entry point + routes</span>{'\n'}
                        {'│   │   └── '}<span className="text-blue-400 font-bold">components/</span>{'\n'}
                        {'│   │       └── '}<span className="text-slate-300">Docs.jsx</span>{'   '}<span className="text-slate-500"># This page</span>{'\n'}
                        {'│   └── '}<span className="text-slate-300">package.json</span>{'\n'}
                        {'├── '}<span className="text-slate-300">.gitignore</span>{'\n'}
                        {'└── '}<span className="text-slate-300">README.md</span>
                    </div>
                </section>

                {/* Errors */}
                <section id="errors" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Error Handling</SectionH2>
                    <P>All backend errors return <Code>{'{ "detail": "message" }'}</Code> with an appropriate HTTP status code.</P>
                    <Table
                        headers={['Error', 'Cause', 'Fix']}
                        rows={[
                            [<Code>Could not import module "main"</Code>, 'Uvicorn run from wrong directory', <><Code>cd backend</Code> first</>],
                            [<Code>ffmpeg is not installed</Code>, 'FFmpeg not in PATH', 'Install FFmpeg; open a new terminal'],
                            [<Code>No supported JavaScript runtime</Code>, 'Node.js not installed', 'Install Node.js'],
                            [<Code>Failed to fetch info</Code>, 'Invalid or unsupported URL', 'Verify URL; check yt-dlp supported sites'],
                            [<Code>Download produced no output file</Code>, 'yt-dlp extraction failed', <><Code>pip install -U yt-dlp</Code></>],
                            ['CORS error in browser', 'Frontend URL not in allow_origins', <><Code>allow_origins</Code> in <Code>main.py</Code></>],
                            [<Code>Connection refused port 8000</Code>, 'Backend not running', <><Code>cd backend</Code> then start uvicorn</>],
                            [<Code>HTTP 429 Too Many Requests</Code>, 'YouTube rate limiting', 'Wait a few minutes and retry'],
                        ]}
                    />
                </section>

                {/* Deploy */}
                <section id="deploy" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Going Online</SectionH2>
                    <Steps items={[
                        ['Deploy backend to a VPS', 'DigitalOcean, Hetzner, or Linode (~$5/mo). Railway and Render also work.'],
                        ['Install FFmpeg on the server', <><Code>sudo apt install ffmpeg</Code></>],
                        ['Update API_BASE in frontend', <>In <Code>frontend/src/App.jsx</Code> change <Code>API_BASE</Code> to your server's public URL.</>],
                        ['Update CORS in backend', <>In <Code>backend/main.py</Code> replace <Code>localhost:5173</Code> in <Code>allow_origins</Code> with your frontend's domain.</>],
                        ['Build and deploy frontend', <><Code>npm run build</Code> → upload <Code>dist/</Code> to Vercel, Netlify, or serve via Nginx.</>],
                    ]} />
                    <Callout type="warn">YouTube blocks many datacenter IPs. If downloads fail on your VPS but work locally, the server's IP may be banned by YouTube.</Callout>
                </section>

                {/* Update */}
                <section id="update" data-section className="mb-16 scroll-mt-8">
                    <SectionH2>Keeping Updated</SectionH2>
                    <P>If downloads stop working, update yt-dlp first — this fixes 90% of breakages:</P>
                    <Pre>pip install -U yt-dlp</Pre>
                    <P>Update all Python dependencies:</P>
                    <Pre>pip install -U fastapi uvicorn yt-dlp pydantic</Pre>
                    <P>Update frontend dependencies:</P>
                    <Pre>{`cd frontend\nnpm update`}</Pre>
                </section>

            </main>
        </div>
    );
}
