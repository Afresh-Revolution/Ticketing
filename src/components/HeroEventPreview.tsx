import { CalendarDays, MapPin, Check, ArrowUpRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import concertImage from '../assets/exploreimg1.jpg';

export default function HeroEventPreview() {
  return (
    <figure className="lp-event-preview" aria-label="Sample event and digital ticket preview">
      <div className="lp-preview-glow" aria-hidden="true" />
      <div className="lp-preview-event">
        <div className="lp-preview-photo">
          <img src={concertImage} alt="A fan capturing a concert under purple stage lights" width={1080} height={720} />
          <span className="lp-preview-tag">THE NIGHT IS YOURS <ArrowUpRight size={14} aria-hidden="true" /></span>
          <div className="lp-preview-photo-copy"><span>LIVE MUSIC · LAGOS</span><h2>After Hours</h2></div>
        </div>
        <div className="lp-preview-event-details">
          <p><CalendarDays size={16} aria-hidden="true" /> Friday, 18 December · 8 PM</p>
          <p><MapPin size={16} aria-hidden="true" /> Victoria Island, Lagos</p>
          <div className="lp-preview-event-footer"><span>Good music. Your people.</span><span>One unforgettable night.</span></div>
        </div>
      </div>
      <div className="lp-preview-ticket">
        <div className="lp-preview-ticket-heading"><span className="lp-preview-check"><Check size={16} aria-hidden="true" /></span><span>You’re on the list</span></div>
        <div className="lp-preview-ticket-body">
          <div><span className="lp-preview-ticket-label">YOUR DIGITAL PASS</span><h3>After Hours</h3><p>General admission · 1 guest</p><span className="lp-preview-ticket-id">GATEWAV / SAMPLE PASS</span></div>
          <div className="lp-preview-qr" aria-hidden="true"><QRCodeSVG value="GateWav sample pass — not valid for entry" size={72} marginSize={2} bgColor="#f2f8f3" fgColor="#12382f" /></div>
        </div>
        <div className="lp-preview-ticket-bottom"><span>Your night, ready to go.</span><span>GateWav</span></div>
      </div>
      <figcaption>Discover it. Book it. Be there. <span>Sample event preview</span></figcaption>
    </figure>
  );
}
