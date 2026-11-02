import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/MoreAhead.css';

const NEXT = [
  {
    title: 'More places to look',
    body: 'Discovery already follows your city. More cities, collections, and ways to answer “what’s on” are how the map grows.',
  },
  {
    title: 'Richer nights with friends',
    body: 'Plans, votes, circles, and memories are the start of going together. The guest side keeps getting easier to coordinate without GateWav holding anyone’s money.',
  },
  {
    title: 'A fuller phone for hosts',
    body: 'Listing, sales, the door, promoters, merch, and live are in the app now. New host tools land in that same creators panel, not in a separate product.',
  },
];

const MoreAhead = () => {
  return (
    <section className="more-ahead" aria-labelledby="more-ahead-heading">
      <div className="ma-inner">
        <ScrollReveal stagger className="scroll-reveal-mix ma-reveal">
          <>
            <span className="ma-label">Still opening</span>
            <h2 id="more-ahead-heading" className="ma-heading">
              This is the current set. Expect more.
            </h2>
            <p className="ma-lede">
              What you just read is shipping. GateWav keeps adding for guests and for hosts, so the next time you open
              the app it should do more than it does today.
            </p>
            <ul className="ma-list">
              {NEXT.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          </>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default MoreAhead;
