import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { gw, track, whatsappShare } from "./api";
import "./gatewav2.css";

type EventCard = {
  id: string;
  title: string;
  date?: string;
  location?: string;
  venue?: string;
  startingPrice?: number;
  price?: number;
  imageUrl?: string;
  availability?: string;
  organizer?: string;
  verifiedOrganizer?: boolean;
};

function money(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function badge(event: EventCard) {
  if (event.availability === "cancelled") return "Cancelled";
  if (event.availability === "sold_out") return "Sold out";
  if (event.verifiedOrganizer) return "Verified organizer";
  if (event.availability === "limited") return "Few left";
  return "";
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="gw-page">
      <Navbar />
      <main className="gw-wrap">{children}</main>
    </div>
  );
}

function Cards({ events }: { events: EventCard[] }) {
  if (!events.length) return <p className="gw-copy">No listings match. Cancelled and sold-out events stay labeled when they do.</p>;
  return (
    <div className="gw-grid">
      {events.map((event) => (
        <Link key={event.id} className="gw-card" to={`/event/${event.id}`}>
          {event.imageUrl ? <img src={event.imageUrl} alt="" /> : <div style={{ height: 150, background: "#12584B" }} />}
          <div>
            {badge(event) ? <span className={`gw-badge ${event.availability === "cancelled" || event.availability === "sold_out" ? "bad" : ""}`}>{badge(event)}</span> : null}
            <h3>{event.title}</h3>
            <p className="gw-meta">{event.date || "Date TBA"} · {event.venue || event.location || "Venue TBA"}</p>
            <p className="gw-meta">From {money(event.startingPrice ?? event.price)} · {event.organizer || "Organizer"}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CityPage() {
  const { slug = "jos" } = useParams();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [when, setWhen] = useState("");
  const [free, setFree] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `Things to do in ${slug} · GateWav`;
    track("city_collection_view", { citySlug: slug });
    const params = new URLSearchParams({ city: slug, pageSize: "30" });
    if (when) params.set("when", when);
    if (free) params.set("free", "true");
    if (q) params.set("q", q);
    gw<{ events: EventCard[] }>(`/api/gatewav2/discover?${params}`)
      .then((data) => {
        setEvents(data.events || []);
        if (!(data.events || []).length) track("result_empty", { citySlug: slug });
      })
      .catch((err) => setError(err.message));
  }, [slug, when, free, q]);

  return (
    <Shell>
      <p className="gw-kicker">Public · no account needed</p>
      <h1 className="gw-title">{slug.replace(/-/g, " ")}</h1>
      <p className="gw-copy">Find what is on, including free listings. Checkout asks you to sign in only when a ticket needs an account. Prices are in naira.</p>
      <div className="gw-row">
        {["", "today", "tonight", "weekend"].map((item) => (
          <button key={item || "any"} className={`gw-chip ${when === item ? "on" : ""}`} onClick={() => setWhen(item)}>{item || "Any time"}</button>
        ))}
        <button className={`gw-chip ${free ? "on" : ""}`} onClick={() => setFree((v) => !v)}>Free</button>
        <Link className="gw-chip" to={`/collections/this-weekend-in-${slug}`}>
          This weekend in {slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")}
        </Link>
        <Link className="gw-chip" to="/experiences">Recurring</Link>
      </div>
      <div className="gw-form">
        <input aria-label="Search listings" placeholder="Search listings" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error ? <p>{error}</p> : null}
      <Cards events={events} />
      <button className="gw-btn" onClick={() => whatsappShare(`What is on in ${slug}`, window.location.href)}>Share on WhatsApp</button>
    </Shell>
  );
}

export function CollectionPage() {
  const { slug = "" } = useParams();
  const [title, setTitle] = useState("Collection");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<EventCard[]>([]);
  useEffect(() => {
    gw<{ title: string; description?: string; events: EventCard[] }>(`/api/gatewav2/collections/${slug}`)
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description || "");
        setEvents(data.events || []);
        document.title = `${data.title} · GateWav`;
      })
      .catch(() => setTitle("Collection"));
  }, [slug]);
  return (
    <Shell>
      <p className="gw-kicker">Curated</p>
      <h1 className="gw-title">{title}</h1>
      <p className="gw-copy">{description}</p>
      <Cards events={events} />
    </Shell>
  );
}

export function ExperiencesPage() {
  const [events, setEvents] = useState<EventCard[]>([]);
  useEffect(() => {
    document.title = "Recurring experiences · GateWav";
    gw<{ events: EventCard[] }>("/api/gatewav2/discover?recurring=true&pageSize=30")
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);
  return (
    <Shell>
      <p className="gw-kicker">Experiences</p>
      <h1 className="gw-title">Weekly and daily</h1>
      <p className="gw-copy">Workshops, sports, meetups, and community gatherings. You book a session, not an ambiguous series. One cancelled date does not cancel the rest.</p>
      <Cards events={events} />
    </Shell>
  );
}

export function PlanInvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    gw<{ name: string; note?: string }>(`/api/gatewav2/invites/plan/${token}`)
      .then((data) => {
        setName(data.name);
        setNote(data.note || "");
      })
      .catch((err) => setNote(err.message));
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!mobile) return;
    const key = `gw-plan-open:${token}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.href = `gatewav://plans/invite/${encodeURIComponent(token)}`;
  }, [token]);
  return (
    <Shell>
      <h1 className="gw-title">{name || "Plan invite"}</h1>
      <p className="gw-copy">{note} Sign in to vote. Nobody is charged from this page.</p>
      <button className="gw-btn" onClick={() => { window.location.href = `gatewav://plans/invite/${encodeURIComponent(token)}`; }}>Open in the GateWav app</button>
      <button className="gw-btn" style={{ marginTop: 12 }} onClick={() => navigate(`/login?next=/plans/invite/${token}`)}>Continue on the website</button>
    </Shell>
  );
}

export function CircleInvitePage() {
  const { token = "" } = useParams();
  const [name, setName] = useState("Private circle");
  const [policy, setPolicy] = useState("");
  useEffect(() => {
    gw<{ name: string; policy?: string }>(`/api/gatewav2/invites/circle/${token}`)
      .then((data) => {
        setName(data.name);
        setPolicy(data.policy || "");
      })
      .catch((err) => setPolicy(err.message));
  }, [token]);
  return (
    <Shell>
      <h1 className="gw-title">{name}</h1>
      <p className="gw-copy">{policy}</p>
      <p className="gw-copy">Member names are not on this public page.</p>
    </Shell>
  );
}

type PlanRow = { id: string; name: string; lifecycle?: string; status?: string; kind?: string };
type CircleRow = { id: string; name: string };
type InviteRow = { token: string; name: string };

export function AccountPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [circles, setCircles] = useState<CircleRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [saved, setSaved] = useState<EventCard[]>([]);
  const [planName, setPlanName] = useState("");
  const [circleName, setCircleName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => {
    Promise.all([
      gw<{ plans: PlanRow[] }>("/api/gatewav2/plans"),
      gw<{ events: EventCard[] }>("/api/gatewav2/favorites"),
      gw<{ circles: CircleRow[] }>("/api/gatewav2/circles"),
      gw<{ invites: InviteRow[] }>("/api/gatewav2/circles/invites/inbox").catch(() => ({ invites: [] })),
    ]).then(([planData, savedData, circleData, inviteData]) => {
      setPlans(planData.plans || []);
      setSaved(savedData.events || []);
      setCircles(circleData.circles || []);
      setInvites(inviteData.invites || []);
    }).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <p className="gw-kicker">Saved and plans</p>
      <h1 className="gw-title">Going together</h1>
      <p className="gw-copy">Save events, line up a plan, or open a private circle. Each person still buys their own ticket.</p>
      {error ? <p>{error}. Sign in with the same account you use in the app.</p> : null}
      {notice ? <p className="gw-copy">{notice}</p> : null}

      <h2>Saved</h2>
      <Cards events={saved} />

      {invites.map((invite) => (
        <p key={invite.token}><Link to={`/circles/invite/${invite.token}`}>Circle invite · {invite.name}</Link></p>
      ))}

      <h2>Plans</h2>
      <form className="gw-form" onSubmit={(e) => {
        e.preventDefault();
        gw<{ id: string }>("/api/gatewav2/plans", { method: "POST", body: JSON.stringify({ name: planName, kind: "group" }) })
          .then(() => {
            setPlanName("");
            setNotice("Plan created. Interest is not a ticket.");
            load();
          })
          .catch((err) => setError(err.message));
      }}>
        <input aria-label="Plan name" placeholder="Plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
        <button className="gw-btn" type="submit">Create a plan</button>
      </form>
      {plans.map((plan) => (
        <p key={plan.id}>
          <Link to={`/account/plans/${plan.id}`}>{plan.name}</Link>
          {" · "}{plan.lifecycle || plan.status || "voting"} · {plan.kind === "personal" ? "Just you" : "Group"}
        </p>
      ))}

      <h2>Circles</h2>
      <form className="gw-form" onSubmit={(e) => {
        e.preventDefault();
        gw<{ id: string }>("/api/gatewav2/circles", {
          method: "POST",
          body: JSON.stringify({ name: circleName, adultConfirmed: true }),
        })
          .then((created) => {
            setCircleName("");
            setNotice("Circle created.");
            load();
            if (created.id) window.location.hash = `#/circles/${created.id}`;
          })
          .catch((err) => setError(err.message));
      }}>
        <input aria-label="Circle name" placeholder="Circle name" value={circleName} onChange={(e) => setCircleName(e.target.value)} required />
        <button className="gw-btn alt" type="submit">Create a circle</button>
      </form>
      {circles.map((circle) => (
        <p key={circle.id}><Link to={`/circles/${circle.id}`}>{circle.name}</Link></p>
      ))}
    </Shell>
  );
}

export function PlanDetailWebPage() {
  const { planId = "" } = useParams();
  const [name, setName] = useState("Plan");
  const [detail, setDetail] = useState("");
  useEffect(() => {
    gw<{ name?: string; notes?: string; lifecycle?: string; status?: string }>(`/api/gatewav2/plans/${planId}`)
      .then((data) => {
        setName(data.name || "Plan");
        setDetail(data.notes || data.lifecycle || data.status || "Interest is not a ticket.");
      })
      .catch((err) => setDetail(err.message));
  }, [planId]);
  return (
    <Shell>
      <p className="gw-kicker">Plan</p>
      <h1 className="gw-title">{name}</h1>
      <p className="gw-copy">{detail}</p>
      <Link className="gw-btn" to="/account/plans">Back to saved and plans</Link>
    </Shell>
  );
}

type ChatMessage = { id: string; body?: string; authorName?: string };

export function CircleChatWebPage() {
  const { circleId = "" } = useParams();
  const [title, setTitle] = useState("Circle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    gw<{ circleName?: string; messages?: ChatMessage[] }>(`/api/gatewav2/circles/${circleId}/chat`)
      .then((data) => {
        setTitle(data.circleName || "Circle");
        setMessages(data.messages || []);
      })
      .catch(() => {
        gw<{ circleName?: string; messages?: ChatMessage[] }>(`/api/gatewav2/circles/${circleId}/chat`, { method: "POST" })
          .then((data) => {
            setTitle(data.circleName || "Circle");
            setMessages(data.messages || []);
          })
          .catch((err) => setError(err.message));
      });
  };

  useEffect(() => {
    load();
  }, [circleId]);

  return (
    <Shell>
      <p className="gw-kicker">Circle</p>
      <h1 className="gw-title">{title}</h1>
      {error ? <p>{error}</p> : null}
      {messages.map((message) => (
        <p key={message.id}><strong>{message.authorName || "Member"}: </strong>{message.body}</p>
      ))}
      <form className="gw-form" onSubmit={(e) => {
        e.preventDefault();
        gw(`/api/gatewav2/circles/${circleId}/chat/messages`, {
          method: "POST",
          body: JSON.stringify({ body: draft }),
        }).then(() => {
          setDraft("");
          load();
        }).catch((err) => setError(err.message));
      }}>
        <input aria-label="Message" placeholder="Message the circle" value={draft} onChange={(e) => setDraft(e.target.value)} required />
        <button className="gw-btn" type="submit">Send</button>
      </form>
    </Shell>
  );
}

type Stamp = { id: string; title?: string; awardedAt?: string };
type Perk = { id: string; title: string; description?: string; quota?: number; redeemedCount?: number };

export function PassportWebPage() {
  const [hidden, setHidden] = useState(true);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = () => {
    gw<{ hidden?: boolean; stamps?: Stamp[]; perks?: Perk[] }>("/api/gatewav2/passport")
      .then((data) => {
        setHidden(data.hidden !== false);
        setStamps(data.stamps || []);
        setPerks(data.perks || []);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <h1 className="gw-title">Passport</h1>
      <p className="gw-copy">A stamp is added when a ticket is checked in. This is not a wallet. Organizer benefits are funded by the organizer.</p>
      <label className="gw-copy">
        <input
          type="checkbox"
          checked={hidden}
          onChange={(e) => {
            const next = e.target.checked;
            setHidden(next);
            gw("/api/gatewav2/passport", { method: "PATCH", body: JSON.stringify({ hidden: next }) }).catch((err) => {
              setHidden(!next);
              setError(err.message);
            });
          }}
        />{" "}
        Keep my passport private
      </label>
      {error ? <p>{error}</p> : null}
      {note ? <p className="gw-copy">{note}</p> : null}
      <h2>Stamps</h2>
      {stamps.length ? stamps.map((stamp) => (
        <p key={stamp.id}>{stamp.title || "Attended"}{stamp.awardedAt ? ` · ${new Date(stamp.awardedAt).toLocaleDateString()}` : ""}</p>
      )) : <p className="gw-copy">No stamps yet.</p>}
      <h2>Organizer benefits</h2>
      {perks.length ? perks.map((perk) => (
        <div key={perk.id} className="gw-note">
          <p>{perk.title}</p>
          {perk.description ? <p className="gw-copy">{perk.description}</p> : null}
          <p className="gw-meta">{perk.redeemedCount || 0} of {perk.quota || 0} claimed</p>
          <button className="gw-btn" type="button" onClick={() => {
            gw(`/api/gatewav2/perks/${perk.id}/redeem`, { method: "POST" })
              .then(() => {
                setNote("Benefit redeemed.");
                load();
              })
              .catch((err) => setError(err.message));
          }}>Redeem</button>
        </div>
      )) : <p className="gw-copy">No benefits yet.</p>}
      <button className="gw-btn alt" type="button" onClick={() => {
        gw<Record<string, unknown>>("/api/gatewav2/me/export")
          .then((data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "gatewav-passport.json";
            link.click();
            URL.revokeObjectURL(url);
          })
          .catch((err) => setError(err.message));
      }}>Download my data</button>
    </Shell>
  );
}

type PromoRow = {
  shareCode: string;
  campaign?: string;
  eventId?: string;
  eventTitle?: string;
  clicks?: number;
  orders?: number;
  tickets?: number;
  pending?: number;
  paid?: number;
  commissionType?: string;
  commissionValue?: number;
};

export function OrganizerGrowthPage() {
  const [eventId, setEventId] = useState("");
  const [name, setName] = useState("Campus ambassadors");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<PromoRow[]>([]);

  const loadMine = () => {
    gw<{ rows?: PromoRow[] }>("/api/gatewav2/promoters/me")
      .then((data) => setRows(data.rows || []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    loadMine();
  }, []);

  return (
    <Shell>
      <h1 className="gw-title">Promoter</h1>
      <p className="gw-copy">Commission is a share of confirmed paid tickets. Clicks are not earnings. Refunds and chargebacks reverse it. Payout stays an approval, not an automatic transfer.</p>
      <h2>Your campaigns</h2>
      {rows.length ? rows.map((row) => {
        const link = row.eventId ? `${window.location.origin}/#/event/${row.eventId}?ref=${encodeURIComponent(row.shareCode)}` : "";
        return (
          <div key={row.shareCode} className="gw-note">
            <p>{row.campaign || "Campaign"} · {row.eventTitle || "Event"}</p>
            <p className="gw-meta">
              {row.commissionType === "fixed" ? `₦${row.commissionValue || 0} per paid order` : `${row.commissionValue || 0}% of each paid order`}
            </p>
            <p className="gw-meta">Clicks {row.clicks || 0} · orders {row.orders || 0} · tickets {row.tickets || 0}</p>
            <p className="gw-meta">Pending ₦{Number(row.pending || 0).toLocaleString("en-NG")} · paid ₦{Number(row.paid || 0).toLocaleString("en-NG")}</p>
            {link ? <p className="gw-meta">{link}</p> : null}
            {(row.pending || 0) > 0 ? (
              <button className="gw-btn" type="button" onClick={() => {
                gw(`/api/gatewav2/promoters/payouts`, { method: "POST", body: JSON.stringify({ shareCode: row.shareCode }) })
                  .then(() => {
                    setMessage("Payout requested. The event creator reviews it.");
                    loadMine();
                  })
                  .catch((err) => setMessage(err.message));
              }}>Request payout</button>
            ) : null}
          </div>
        );
      }) : <p className="gw-copy">When an organizer adds you to a campaign, the share link and confirmed sales show here.</p>}
      <h2>Create a campaign</h2>
      <form className="gw-form" onSubmit={(e) => {
        e.preventDefault();
        gw(`/api/gatewav2/events/${eventId}/campaigns`, { method: "POST", body: JSON.stringify({ name, commissionType: "percent", commissionValue: 10, windowDays: 14 }) })
          .then(() => setMessage("Campaign created. Invite promoters next."))
          .catch((err) => setMessage(err.message));
      }}>
        <input aria-label="Event id" placeholder="Event id" value={eventId} onChange={(e) => setEventId(e.target.value)} />
        <input aria-label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="gw-btn" type="submit">Create campaign</button>
      </form>
      {message ? <p>{message}</p> : null}
    </Shell>
  );
}

export function AdminModerationPage() {
  const [data, setData] = useState<{ reports?: { id: string; reason?: string }[]; verification?: { id: string; evidence?: string }[] }>({});
  const [error, setError] = useState("");
  useEffect(() => {
    gw<typeof data>("/api/gatewav2/admin/moderation").then(setData).catch((err) => setError(err.message));
  }, []);
  return (
    <Shell>
      <h1 className="gw-title">Review queue</h1>
      <p className="gw-copy">Verification, reports, photos, and benefits. A verified badge is never applied by default.</p>
      {error ? <p>{error}</p> : null}
      <h2>Reports</h2>
      {(data.reports || []).map((item) => <p key={item.id}>{item.reason}</p>)}
      <h2>Organizer verification</h2>
      {(data.verification || []).map((item) => (
        <div key={item.id} className="gw-note">
          <p>{item.evidence}</p>
          <button className="gw-btn" onClick={() => void gw(`/api/gatewav2/admin/verification/${item.id}`, { method: "POST", body: JSON.stringify({ status: "approved", reviewNote: "Evidence accepted" }) })}>Approve</button>
        </div>
      ))}
    </Shell>
  );
}
