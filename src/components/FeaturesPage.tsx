import BuiltForEveryone from './BuiltForEveryone';
import WhyChooseUs from './WhyChooseUs';
import GetTickets from './GetTickets';
import ReadyToJoin from './ReadyToJoin';
import Footer from './Footer';
import '../FeaturesPage/css/FeaturesPage.css';

const FeaturesPage = () => {
  return (
    <div className="features-page">
      <BuiltForEveryone />
      <WhyChooseUs />
      <GetTickets />
      <ReadyToJoin />
      <div className="section-separator"></div>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
