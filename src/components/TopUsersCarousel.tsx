import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../api/config';
import './TopUsersCarousel.css';

export interface TopUser {
  id: string;
  name: string;
  title: string;
  imageUrl: string | null;
  sortOrder: number;
}

const TopUsersCarousel = () => {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      try {
        const res = await fetch(apiUrl('/api/landing/top-users'));
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUsers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;
  if (users.length === 0) return null;

  const duplicated = [...users, ...users, ...users];

  return (
    <section className="top-users-carousel-wrap" aria-label="Top users">
      <div className="top-users-carousel-fade top-users-carousel-fade-left" aria-hidden />
      <div className="top-users-carousel-fade top-users-carousel-fade-right" aria-hidden />
      <div className="top-users-carousel-track" ref={scrollRef}>
        <div className="top-users-carousel-inner">
          {duplicated.map((user, index) => (
            <div key={`${user.id}-${index}`} className="top-users-carousel-card">
              <div className="top-users-carousel-card-avatar">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="" />
                ) : (
                  <span className="top-users-carousel-card-initial">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="top-users-carousel-card-info">
                <span className="top-users-carousel-card-name">{user.name}</span>
                {user.title && <span className="top-users-carousel-card-title">{user.title}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopUsersCarousel;
