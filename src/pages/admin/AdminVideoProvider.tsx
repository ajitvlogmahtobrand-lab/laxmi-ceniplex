import React, { useState } from 'react';
import {
  FileVideo,
  ShieldCheck,
  ShieldAlert,
  Server,
  Key,
  ExternalLink,
  Play,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { VideoPlayerModal } from '../../components/video/VideoPlayerModal';
import { Movie } from '../../types';

export const AdminVideoProvider: React.FC = () => {
  const [testModalOpen, setTestModalOpen] = useState(false);

  const testContent: Movie = {
    id: 'test-stream-probe',
    title: 'Laxmi Cineplex 4K Stream Probe (Big Buck Bunny)',
    synopsis: 'Test video stream probe verifying HTML5 MP4 / WebM codec playback support in current browser.',
    language: 'English',
    genre: ['Test', 'Demo'],
    durationMinutes: 10,
    releaseDate: '2026-01-01',
    certification: 'U',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    status: 'NOW_SHOWING',
    contentType: 'OTT_MOVIE',
    monetization: 'FREE',
    visibility: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const providers = [
    {
      name: 'Authorized Direct Video URLs (MP4 / WebM / HLS)',
      status: 'ACTIVE & COMPATIBLE',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Plays standard web video formats hosted on your Google Cloud Storage, S3 bucket, or CDN.',
      limitation: 'Public URLs may be copied by users who inspect network requests. Use signed tokens for strict protection.',
    },
    {
      name: 'Cloudflare Stream (Signed Playback Tokens)',
      status: 'READY FOR KEYS',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Generates expiring JSON Web Tokens (JWT) signed with RSA-256 for sub-second encrypted delivery.',
      limitation: 'Requires CLOUDFLARE_STREAM_KEY in server environment variables.',
    },
    {
      name: 'Mux Video Streaming Engine',
      status: 'READY FOR KEYS',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      description: 'Enterprise adaptive bitrate (HLS) streaming with playback restriction policies.',
      limitation: 'Requires MUX_TOKEN_ID and MUX_TOKEN_SECRET on server.',
    },
    {
      name: 'Bunny.net Stream (Edge Storage & Token Auth)',
      status: 'READY FOR KEYS',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      description: 'Ultra-low cost video delivery with SHA-256 token signing and referrer restrictions.',
      limitation: 'Requires BUNNY_API_KEY and BUNNY_LIBRARY_ID in server environment variables.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#171923] font-cinema tracking-tight">
            Video Streaming Provider Architecture
          </h2>
          <p className="text-xs text-[#667085]">
            Diagnostic status, protected playback parameters, and video hosting provider integration
          </p>
        </div>

        <button
          onClick={() => setTestModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#E31837] hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Test Video Player Stream</span>
        </button>
      </div>

      {/* Security Advisory */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
        <div className="flex items-center space-x-2 font-bold text-amber-950">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Security Limitation Notice: Public Video URLs vs Protected DRM Streams</span>
        </div>
        <p className="leading-relaxed">
          The player currently supports your <strong>existing authorized direct video URLs</strong> without forcing a paid third-party subscription. However, if a video URL is hosted on a public server, users with browser developer tools can inspect the network request.
        </p>
        <p className="leading-relaxed">
          For commercial digital protection, you can activate <strong>Cloudflare Stream</strong> or <strong>Mux</strong> by setting the secret keys on your backend. Our player interface is already wired to inject the secure tokens seamlessly.
        </p>
      </div>

      {/* Provider Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${p.color}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
            </div>

            <div className="pt-3 border-t border-gray-150 text-[11px] text-slate-500 flex items-start space-x-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{p.limitation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Test Player Modal */}
      {testModalOpen && (
        <VideoPlayerModal
          isOpen={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          content={testContent}
          playbackToken="tok_diagnostic_probe_9431"
        />
      )}
    </div>
  );
};
