import { useEffect, useState } from 'react';
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
  sortOrder: number;
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
      <ScrollReveal animation="fadeInUp">
        <BuiltForEveryone />
      </ScrollReveal>
      <ScrollReveal animation="fadeInUp">
        <WhyChooseUs />
      </ScrollReveal>
      <ScrollReveal animation="fadeInUp">
        <section className="lp-video-section" aria-labelledby="lp-video-heading">
          <span className="lp-section-label">Atmosphere</span>
          <h2 id="lp-video-heading" className="lp-video-section-title">
            Every scene, one platform
          </h2>
          <p className="lp-video-section-sub">
            From intimate rooms to stadium-scale energy — browse, book, and step in with tickets that feel as good as
            the show.
          </p>
          <div className="lp-video-grid">
            {hasVideos
              ? videos.map((video) => (
                  <div key={video.id} className="lp-video-card">
                    <div className="lp-video-thumb lp-video-live">
                      <video
                        className="lp-video-media"
                        src={video.videoUrl}
                        poster={video.thumbnailUrl || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                      <div className="lp-video-play" aria-hidden>
                        <svg width="64" height="64" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="30" cy="30" r="28" fill="rgba(255, 255, 255, 0.92)" />
                          <path d="M24 20L24 40L38 30L24 20Z" fill="#7c3aed" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))
              : (
                <>
                  <div className="lp-video-card">
                    <div className="lp-video-thumb lp-video-1">
                      <div className="lp-video-play" aria-hidden>
                        <svg width="64" height="64" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="30" cy="30" r="28" fill="rgba(255, 255, 255, 0.92)" />
                          <path d="M24 20L24 40L38 30L24 20Z" fill="#7c3aed" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="lp-video-card">
                    <div className="lp-video-thumb lp-video-2">
                      <div className="lp-video-play" aria-hidden>
                        <svg width="64" height="64" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="30" cy="30" r="28" fill="rgba(255, 255, 255, 0.92)" />
                          <path d="M24 20L24 40L38 30L24 20Z" fill="#7c3aed" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="lp-video-card">
                    <div className="lp-video-thumb lp-video-3">
                      <div className="lp-video-play" aria-hidden>
                        <svg width="64" height="64" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="30" cy="30" r="28" fill="rgba(255, 255, 255, 0.92)" />
                          <path d="M24 20L24 40L38 30L24 20Z" fill="#7c3aed" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
                )}
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal animation="fadeInUp">
        <ReadyToJoin />
      </ScrollReveal>
      <ScrollReveal animation="fadeInUp">
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default FeaturesPage;
