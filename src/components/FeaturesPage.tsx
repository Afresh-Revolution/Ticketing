import BuiltForEveryone from './BuiltForEveryone';
import WhyChooseUs from './WhyChooseUs';
import ReadyToJoin from './ReadyToJoin';
import Footer from './Footer';
import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/FeaturesPage.css';

const FeaturesPage = () => {
  return (
    <div className="features-page">
      <ScrollReveal animation="fadeInUp">
        <BuiltForEveryone />
      </ScrollReveal>
      <ScrollReveal animation="fadeInUp">
        <WhyChooseUs />
      </ScrollReveal>
      <ScrollReveal animation="fadeInUp">
        <section className="video-previews">
          <div className="video-container">
            <div className="video-card">
              <div className="video-thumbnail video-1">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)"/>
                    <path d="M24 20L24 40L38 30L24 20Z" fill="#791A94"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="video-card">
              <div className="video-thumbnail video-2">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)"/>
                    <path d="M24 20L24 40L38 30L24 20Z" fill="#791A94"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="video-card">
              <div className="video-thumbnail video-3">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)"/>
                    <path d="M24 20L24 40L38 30L24 20Z" fill="#791A94"/>
                  </svg>
                </div>
              </div>
            </div>
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
