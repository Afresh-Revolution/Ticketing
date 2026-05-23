import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import BuiltForEveryone from './BuiltForEveryone';
import WhyChooseUs from './WhyChooseUs';
import ReadyToJoin from './ReadyToJoin';
import Footer from './Footer';
import ScrollReveal from './ScrollReveal';
import { apiUrl } from '../api/config';
import '../FeaturesPage/css/FeaturesPage.css';

interface LandingVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  externalUrl: string | null;
  sortOrder: number;
}

function LandingVideoCard({ video }: { video: LandingVideo }) {
  return (
    <div className="lp-video-card">
      <div className="lp-video-thumb lp-video-live">
        <video
          className="lp-video-media"
          src={video.videoUrl}
          poster={video.thumbnailUrl || undefined}
          controls
          playsInline
          preload="metadata"
        />
        {video.externalUrl ? (
          <a
            href={video.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lp-video-external-link"
            aria-label="Watch full video"
            title="Watch full video"
          >
            <ExternalLink size={18} strokeWidth={2.25} aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}

const FeaturesPage = () => {
  const [videos, setVideos] = useState<LandingVideo[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(apiUrl('/api/landing/videos'));
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setVideos(
            data
              .filter((item): item is LandingVideo => !!item && typeof item.videoUrl === 'string')
              .slice(0, 3)
          );
        }
      } catch {
        // keep static fallback
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasVideos = videos.length > 0;

  return (
    <div className="features-page">
      <BuiltForEveryone />
      <WhyChooseUs />
      <ScrollReveal stagger className="scroll-reveal-mix lp-video-section lp-video-reveal-stack" animation="fadeIn">
        <>
          <span className="lp-section-label">Atmosphere</span>
          <h2 id="lp-video-heading" className="lp-video-section-title">
            Every scene, one platform
          </h2>
          <p className="lp-video-section-sub">
            From intimate rooms to stadium-scale energy, browse, book, and step in with tickets that feel as good as
            the show.
          </p>
          {hasVideos
            ? videos.map((video) => <LandingVideoCard key={video.id} video={video} />)
            : (
                <>
                  <div className="lp-video-card">
                    <div className="lp-video-thumb lp-video-1" aria-hidden />
                  </div>
                  <div className="lp-video-card">
                    <div className="lp-video-thumb lp-video-2" aria-hidden />
                  </div>
                  <div className="lp-video-card">
                    <div className="lp-video-thumb lp-video-3" aria-hidden />
                  </div>
                </>
              )}
        </>
      </ScrollReveal>
      <ReadyToJoin />
      <Footer />
    </div>
  );
};

export default FeaturesPage;
