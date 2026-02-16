import { useState, useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import "./EventsPage.css";

import exploreimg1 from "../assets/exploreimg1.jpg";
import exploreimg2 from "../assets/exploreimg2.jpg";
import exploreimg3 from "../assets/exploreimg3.jpg";
import exploreimg4 from "../assets/exploreimg4.jpg";
import exploreimg5 from "../assets/exploreimg5.jpg";

const CATEGORIES = [
  "All",
  "Music",
  "Tech",
  "Food",
  "Art",
  "Nightlife",
] as const;

const EVENTS = [
  {
    id: 1,
    title: "Sunniehillarious Comedy Special",
    date: "SEP 10",
    category: "Art",
    location: "Mees Palace Event Center, Jos",
    time: "19:00",
    price: "5,000",
    image: exploreimg1,
  },
  {
    id: 2,
    title: "Future Tech Summit 2024",
    date: "JULY 20",
    category: "Tech",
    location: "Landmark Event Center, Lagos",
    time: "09:00",
    price: "10,000",
    image: exploreimg2,
  },
  {
    id: 3,
    title: "Lagos Food Festival",
    date: "AUG 15",
    category: "Food",
    location: "Onikan Stadium, Lagos",
    time: "12:00",
    price: "3,500",
    image: exploreimg3,
  },
  {
    id: 4,
    title: "Afro Night Live",
    date: "SEP 28",
    category: "Nightlife",
    location: "Eko Hotel, Lagos",
    time: "22:00",
    price: "8,000",
    image: exploreimg4,
  },
  {
    id: 5,
    title: "Art in the Park",
    date: "OCT 5",
    category: "Art",
    location: "Nike Art Gallery, Lagos",
    time: "14:00",
    price: "2,000",
    image: exploreimg5,
  },
];

const EventsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="events-page">
      <header className="events-header">
        <div className="events-header-left">
          <Link to="/" className="events-logo">
            <div className="events-logo-icon">G</div>
            <span className="events-logo-text">Gatewave</span>
          </Link>
        </div>
        <nav className="events-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `events-nav-link${isActive ? " active" : ""}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `events-nav-link${isActive ? " active" : ""}`
            }
          >
            Explore
          </NavLink>
          <Link to="/my-tickets" className="events-nav-link">
            My Tickets
          </Link>
        </nav>
        <div className="events-header-right">
          <button
            type="button"
            className="events-profile-btn"
            aria-label="Profile"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="events-main">
        <section className="events-search-section">
          <div className="events-search-row">
            <div className="events-search-bar">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search events, venues, artists..."
                className="events-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search events"
              />
              <button
                type="button"
                className={`events-filter-btn${searchQuery.trim() || selectedCategory !== "All" ? " active" : ""}`}
                aria-label="Filter"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
            </div>
          </div>
          <div className="events-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`events-cat-pill${selectedCategory === cat ? " active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <h2 className="events-count">{filteredEvents.length} Events Found</h2>

        <div className="events-grid">
          {filteredEvents.map((event) => (
            <article key={event.id} className="event-card">
              <div className="event-card-image-wrap">
                <img src={event.image} alt="" className="event-card-image" />
                <span className="event-date-tag">{event.date}</span>
                <span className="event-category-tag">{event.category}</span>
              </div>
              <div className="event-card-body">
                <h3 className="event-card-title">{event.title}</h3>
                <p className="event-card-meta">
                  <svg
                    className="event-meta-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {event.location}
                </p>
                <p className="event-card-meta">
                  <svg
                    className="event-meta-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {event.time}
                </p>
                <p className="event-card-price">
                  <span className="event-card-price-label">Starting from</span>
                  <strong className="event-card-price-amount">
                    ₦{event.price}
                  </strong>
                </p>
                <button type="button" className="event-card-cta">
                  Get Tickets
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="events-footer">
        <div className="events-footer-top">
          <div className="events-footer-brand">
            <div className="events-logo events-logo-footer">
              <div className="events-logo-icon">G</div>
              <span className="events-logo-text">Gatewave</span>
            </div>
            <p className="events-footer-desc">
              The premier platform for discovering and hosting events. We
              connect passionate organizers with enthusiastic attendees to
              create unforgettable experiences.
            </p>
            <div className="events-social">
              <a href="#" aria-label="Facebook">
                f
              </a>
              <a href="#" aria-label="Twitter">
                𝕏
              </a>
              <a href="#" aria-label="Instagram">
                📷
              </a>
              <a href="#" aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>
          <div className="events-footer-links">
            <div className="events-footer-col">
              <h4>Explore</h4>
              <a href="#">Browse Events</a>
              <a href="#">Upcoming Events</a>
              <a href="#">Popular Events</a>
              <a href="#">Become an Organizer</a>
              <a href="#">Create an Event</a>
            </div>
            <div className="events-footer-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">FAQs</a>
              <a href="#">Contact Support</a>
              <a href="#">Report an Issue</a>
            </div>
            <div className="events-footer-col">
              <h4>Legal</h4>
              <a href="#">Terms & Conditions</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Refund Policy</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
        <div className="events-footer-bottom">
          <span>© 2026 Gatewave. All rights reserved.</span>
          <div className="events-payment-badges">
            <span className="payment-label">SECURE PAYMENT</span>
            <span className="events-card-icons" aria-hidden="true">
              <svg
                viewBox="0 0 48 32"
                fill="none"
                className="card-icon"
                role="img"
                aria-label="Visa"
              >
                <rect width="48" height="32" rx="4" fill="#1A1F71" />
                <text
                  x="24"
                  y="21"
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="Arial, sans-serif"
                >
                  VISA
                </text>
              </svg>
              <svg
                viewBox="0 0 48 32"
                fill="none"
                className="card-icon"
                role="img"
                aria-label="Mastercard"
              >
                <rect width="48" height="32" rx="4" fill="#fff" />
                <circle cx="18" cy="16" r="10" fill="#EB001B" />
                <circle cx="30" cy="16" r="10" fill="#F79E1B" />
                <path
                  d="M24 10.5a10 10 0 0 1 6 10 10 10 0 0 1-6 10 10 10 0 0 1-6-10 10 10 0 0 1 6-10z"
                  fill="#FF5F00"
                />
              </svg>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventsPage;
