import BuiltForEveryone from './BuiltForEveryone';
import WhyChooseUs from './WhyChooseUs';
import GetTickets from './GetTickets';
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
        <GetTickets />
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
