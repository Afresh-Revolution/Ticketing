import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/WhyChooseUs.css';

const FEATURES = [
  {
    label: 'Discover',
    title: 'What is on, near you',
    body: 'Search cities, artists, and vibes. Filter by time, category, price, recurring dates, and verified organizers. Weekend collections pin a city’s real listings.',
  },
  {
    label: 'Together',
    title: 'Saved events, plans, circles',
    body: 'Save a listing, start a personal or group plan, and invite people by link. Circles keep roles, chat, and memories in one private place for adults 18+.',
  },
  {
    label: 'Entry',
    title: 'Tickets, reservations, live',
    body: 'Instant QR tickets, group discounts, coupons, reservation contact, and a watch page for streams. Your phone is the ticket at the door.',
  },
  {
    label: 'Passport',
    title: 'Proof you were there',
    body: 'A private record of checked-in events, optional attendance count sharing, organizer perks, and a download of your saved events and stamps.',
  },
  {
    label: 'Promote',
    title: 'Share links that pay',
    body: 'Promoters track clicks, paid orders, and pending commission, then request a payout to a saved bank account. A click is not money. A refund reverses the commission.',
  },
  {
    label: 'Creators',
    title: 'The host panel',
    body: 'Events, sales, coupons, payouts, walk-in, check-in, growth tools, merch, and live. Door staff join with the email on their GateWav account.',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="why-choose-us" aria-labelledby="features-heading">
      <div className="wc-inner">
        <ScrollReveal stagger className="scroll-reveal-mix wc-reveal-grid">
          <>
            <span className="wc-label">The product</span>
            <h2 id="features-heading" className="wc-heading">
              Everything already in GateWav
            </h2>
            <p className="wc-sub">
              These are live in the mobile app. Guests use the first four. Hosts live in the creators panel. Promoters
              sit between them.
            </p>
            {FEATURES.map((feature) => (
              <article key={feature.label} className="wc-feature">
                <span className="wc-feature-label">{feature.label}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhyChooseUs;
