import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/BuiltForEveryone.css';

const GUEST_BENEFITS = [
  {
    title: 'Find the night before you commit',
    body: 'Browse by city or near you, then narrow to today, tonight, or the weekend. Free, budget, recurring, and verified hosts are filters, and you can switch from a list to a map.',
  },
  {
    title: 'Plan it with your people',
    body: 'Save an event, then make a plan for yourself or a group. Vote on dates and places, RSVP, and share a cost estimate. Each person still buys their own ticket. GateWav does not hold group money.',
  },
  {
    title: 'A private circle, not a public feed',
    body: 'Invite friends into a circle with roles and a group chat. An event chat closes when that event ends. A plan chat stays. Photos you save as a memory stay with the people on that plan.',
  },
  {
    title: 'A ticket that actually gets you in',
    body: 'Pay on your phone, keep a QR for the door, and use volume discounts or a coupon when the host offers one. Reservation tickets reach the host directly. Online shows open a watch link. Merch sits on the same event.',
  },
  {
    title: 'A passport that stays yours',
    body: 'Check-in adds one stamp. Keep the passport private, or share only how many events you attended. Never ticket codes or what you paid. Hosts can attach a benefit after you show up. That benefit is not cash.',
  },
];

const HOST_BENEFITS = [
  {
    title: 'List and sell from the same phone',
    body: 'Open the creators panel to add an event, set tickets, drop a coupon, and repeat a weekly date. Guests see few-left, sold-out, and cancelled states instead of a dead listing.',
  },
  {
    title: 'See who paid, and how they found you',
    body: 'Sales cover tickets and merch, split into direct buyers and promoter sales. Recent orders show the buyer, the count, and which promoter link earned the credit.',
  },
  {
    title: 'Run the door without a laptop',
    body: 'Scan QR tickets, add door staff by the email on their GateWav account, sell walk-in tickets, and issue a complimentary guest ticket that is still a real ticket.',
  },
  {
    title: 'Let other people sell for you',
    body: 'Hand a promoter a share link and set the commission. Credit goes to the last link a buyer uses, and only on a confirmed paid order. You approve payout requests, then pay the bank account they saved.',
  },
  {
    title: 'Keep the room earning after the ticket',
    body: 'Sell merch, go live for an online show, and offer an attendance perk that appears on a guest’s passport after it is approved. Ask to be verified so guests can filter for hosts who have been checked.',
  },
];

const BuiltForEveryone = () => {
  return (
    <section className="built-for-everyone" id="platform" aria-labelledby="platform-heading">
      <div className="bf-inner">
        <ScrollReveal stagger className="scroll-reveal-mix bf-reveal-grid">
          <>
            <span className="bf-label">Who it is for</span>
            <h2 id="platform-heading" className="bf-heading">
              Built for the guest and the host
            </h2>
            <p className="bf-lede">
              GateWav is the app people use to find a night, line it up with friends, and walk in. The same app
              hosts use to sell, check people in, and get paid.
            </p>

            <article className="bf-audience">
              <p className="bf-audience-kicker">Guests</p>
              <h3 className="bf-audience-title">Show up with less friction</h3>
              <ul className="bf-benefit-list">
                {GUEST_BENEFITS.map((item) => (
                  <li key={item.title}>
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bf-audience">
              <p className="bf-audience-kicker">Hosts</p>
              <h3 className="bf-audience-title">Run the room from your phone</h3>
              <ul className="bf-benefit-list">
                {HOST_BENEFITS.map((item) => (
                  <li key={item.title}>
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </li>
                ))}
              </ul>
            </article>
          </>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default BuiltForEveryone;
