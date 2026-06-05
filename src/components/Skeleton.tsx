import type { CSSProperties, ReactNode } from 'react';
import './Skeleton.css';

type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | 'full';

export type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  width?: string | number;
  height?: string | number;
  rounded?: SkeletonRounded;
  variant?: 'default' | 'admin';
};

export function Skeleton({
  className = '',
  style,
  width,
  height,
  rounded = 'md',
  variant = 'default',
}: SkeletonProps) {
  return (
    <span
      className={`skeleton skeleton--${variant} skeleton--rounded-${rounded} ${className}`.trim()}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

function LoadingRegion({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`skeleton-loading-region ${className}`.trim()} role="status" aria-busy="true" aria-label={label}>
      <span className="skeleton-sr-only">{label}</span>
      {children}
    </div>
  );
}

function repeat(count: number, render: (index: number) => ReactNode) {
  return Array.from({ length: count }, (_, i) => render(i));
}

export function EventCardSkeleton() {
  return (
    <article className="skeleton-event-card">
      <Skeleton className="skeleton-event-card-image" rounded="none" />
      <div className="skeleton-event-card-body">
        <Skeleton height={22} width="85%" rounded="sm" />
        <Skeleton height={14} width="65%" rounded="sm" />
        <Skeleton height={14} width="45%" rounded="sm" />
        <div className="skeleton-event-card-footer">
          <Skeleton height={28} width="40%" rounded="sm" />
          <Skeleton height={36} width={100} rounded="pill" />
        </div>
      </div>
    </article>
  );
}

export function EventsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading events">
      <Skeleton height={28} width={180} rounded="sm" style={{ marginBottom: '1.2rem' }} />
      <div className="events-grid">
        {repeat(count, (i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </LoadingRegion>
  );
}

export function GetTicketsSkeleton() {
  return (
    <LoadingRegion label="Loading events">
      <section className="get-tickets">
        <div className="gt-inner">
          <Skeleton height={14} width={90} rounded="pill" style={{ marginBottom: '0.65rem' }} />
          <Skeleton height={36} width={220} rounded="sm" style={{ marginBottom: '0.75rem' }} />
          <Skeleton height={18} width="min(520px, 90%)" rounded="sm" style={{ marginBottom: '2.5rem' }} />
          <div className="gt-grid">
            {repeat(3, (i) => (
              <div key={i} className="skeleton-gt-card">
                <Skeleton className="skeleton-gt-card-media" rounded="none" />
                <div className="skeleton-gt-card-body">
                  <Skeleton height={20} width="80%" rounded="sm" />
                  <Skeleton height={14} width="55%" rounded="sm" />
                  <Skeleton height={14} width="40%" rounded="sm" />
                  <Skeleton height={32} width={110} rounded="pill" style={{ marginTop: '0.35rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

export function TopUsersCarouselSkeleton() {
  return (
    <LoadingRegion label="Loading top users" className="skeleton-tuc-wrap">
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 clamp(1.25rem, 4vw, 2.5rem)' }}>
        <Skeleton height={14} width={100} rounded="pill" style={{ marginBottom: '0.65rem' }} />
        <Skeleton height={32} width={180} rounded="sm" />
        <div className="skeleton-tuc-cards">
          {repeat(5, (i) => (
            <div key={i} className="skeleton-tuc-card">
              <Skeleton width={48} height={48} rounded="full" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Skeleton height={16} width="75%" rounded="sm" />
                <Skeleton height={12} width="55%" rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function EventDetailSkeleton() {
  return (
    <LoadingRegion label="Loading event">
      <div className="event-detail-page">
        <Skeleton className="skeleton-event-detail-hero" rounded="none" />
        <div className="skeleton-event-detail-main">
          <Skeleton height={32} width={56} rounded="sm" />
          <Skeleton height={14} width={80} rounded="pill" />
          <Skeleton height={36} width="min(520px, 90%)" rounded="sm" />
          <Skeleton height={16} width="70%" rounded="sm" />
          <Skeleton height={16} width="50%" rounded="sm" />
          <div className="skeleton-event-detail-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Skeleton height={22} width={140} rounded="sm" />
              {repeat(3, (i) => (
                <div key={i} className="skeleton-ticket-row">
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <Skeleton height={18} width="60%" rounded="sm" />
                    <Skeleton height={14} width="40%" rounded="sm" />
                  </div>
                  <Skeleton height={36} width={120} rounded="pill" />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Skeleton height={180} rounded="lg" />
              <Skeleton height={48} width="100%" rounded="pill" />
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

export function MerchShopSkeleton() {
  return (
    <LoadingRegion label="Loading merch">
      <main className="merch-shop-main">
          <Skeleton height={32} width={140} rounded="sm" style={{ marginBottom: '1rem' }} />
          <Skeleton height={32} width="min(360px, 80%)" rounded="sm" style={{ marginBottom: '1.5rem' }} />
          <div className="merch-shop-grid">
            {repeat(2, (i) => (
              <article key={i} className="skeleton-merch-item">
                <Skeleton height={18} width="70%" rounded="sm" />
                <Skeleton height={36} width="100%" rounded="md" />
                <div className="skeleton-merch-images">
                  {repeat(2, (j) => (
                    <div key={j} className="skeleton-merch-variant">
                      <Skeleton className="skeleton-merch-variant-image" rounded="none" />
                      <div className="skeleton-merch-variant-body">
                        <Skeleton height={16} width="50%" rounded="sm" />
                        <Skeleton height={32} width="100%" rounded="md" />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </main>
    </LoadingRegion>
  );
}

export function MyTicketsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading tickets">
      <div className="my-tickets-list">
        {repeat(count, (i) => (
          <div key={i} className="skeleton-ticket-card">
            <div className="skeleton-ticket-card-header">
              <Skeleton width={72} height={72} rounded="lg" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <Skeleton height={20} width="75%" rounded="sm" />
                <Skeleton height={14} width="55%" rounded="sm" />
                <Skeleton height={14} width="40%" rounded="sm" />
              </div>
            </div>
            <Skeleton height={120} width="100%" rounded="md" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function AdminKpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-admin-kpi-grid" aria-hidden="true">
      {repeat(count, (i) => (
        <div key={i} className="skeleton-admin-kpi-card">
          <Skeleton className="skeleton-admin-kpi-icon" rounded="lg" variant="admin" />
          <div className="skeleton-admin-kpi-content">
            <Skeleton height={12} width="60%" rounded="sm" variant="admin" />
            <Skeleton height={24} width="45%" rounded="sm" variant="admin" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({
  columns = 5,
  rows = 4,
  columnWidths,
}: {
  columns?: number;
  rows?: number;
  columnWidths?: string[];
}) {
  const widths = columnWidths ?? Array.from({ length: columns }, (_, i) =>
    i === 0 ? '28%' : `${Math.max(12, 80 - i * 8)}%`,
  );

  return (
    <div className="skeleton-admin-table-wrap" aria-hidden="true">
      <div
        className="skeleton-admin-table-head"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {repeat(columns, (i) => (
          <Skeleton key={i} height={12} width={widths[i]} rounded="sm" variant="admin" />
        ))}
      </div>
      {repeat(rows, (row) => (
        <div
          key={row}
          className="skeleton-admin-table-row"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {repeat(columns, (col) => (
            <Skeleton key={col} height={14} width={widths[col]} rounded="sm" variant="admin" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminEventListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading events" className="admin-event-list admin-event-list-inside">
      {repeat(count, (i) => (
        <div key={i} className="skeleton-admin-event-row">
          <div className="skeleton-admin-event-info">
            <Skeleton height={20} width="55%" rounded="sm" variant="admin" />
            <Skeleton height={14} width="40%" rounded="sm" variant="admin" />
            <Skeleton height={14} width="35%" rounded="sm" variant="admin" />
          </div>
          <Skeleton height={18} width={72} rounded="sm" variant="admin" />
          <div className="skeleton-admin-event-actions">
            <Skeleton height={34} width={88} rounded="pill" variant="admin" />
            <Skeleton height={34} width={72} rounded="pill" variant="admin" />
            <Skeleton height={34} width={64} rounded="pill" variant="admin" />
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}

export function AdminEventsPageSkeleton() {
  return (
    <div className="admin-page">
      <div className="admin-events-container">
        <div className="skeleton-admin-page-header">
          <Skeleton height={32} width={220} rounded="sm" variant="admin" />
          <Skeleton height={40} width={140} rounded="pill" variant="admin" />
        </div>
        <AdminEventListSkeleton />
      </div>
    </div>
  );
}

export function AdminCouponsPageSkeleton() {
  return (
    <LoadingRegion label="Loading coupons" className="admin-page">
      <Skeleton height={32} width={140} rounded="sm" variant="admin" style={{ marginBottom: '0.5rem' }} />
      <Skeleton height={16} width="min(480px, 90%)" rounded="sm" variant="admin" style={{ marginBottom: '1.5rem' }} />
      <Skeleton height={22} width={160} rounded="sm" variant="admin" style={{ marginBottom: '1rem' }} />
      <div className="skeleton-admin-form-block">
        {repeat(4, (i) => (
          <Skeleton key={i} height={40} width="100%" rounded="md" variant="admin" />
        ))}
        <Skeleton height={40} width={120} rounded="pill" variant="admin" />
      </div>
      <Skeleton height={22} width={120} rounded="sm" variant="admin" style={{ marginBottom: '1rem' }} />
      <AdminTableSkeleton columns={6} rows={3} />
    </LoadingRegion>
  );
}

export function AdminMerchPanelSkeleton() {
  return (
    <LoadingRegion label="Loading merch data" className="admin-section">
      <Skeleton height={22} width={100} rounded="sm" variant="admin" style={{ marginBottom: '1rem' }} />
      <AdminTableSkeleton columns={6} rows={3} />
    </LoadingRegion>
  );
}

export function AdminWithdrawPageSkeleton() {
  return (
    <LoadingRegion label="Loading withdraw data" className="admin-page admin-withdraw-page">
      <div className="admin-withdraw-scroll">
        <div className="skeleton-admin-page-header">
          <Skeleton height={32} width={140} rounded="sm" variant="admin" />
          <Skeleton height={40} width={180} rounded="pill" variant="admin" />
        </div>
        <AdminKpiGridSkeleton count={3} />
        <Skeleton height={22} width={160} rounded="sm" variant="admin" style={{ marginBottom: '1rem' }} />
        <div className="skeleton-admin-withdraw-events">
          {repeat(3, (i) => (
            <div key={i} className="skeleton-admin-withdraw-event">
              <Skeleton height={20} width="50%" rounded="sm" variant="admin" />
              <Skeleton height={14} width="35%" rounded="sm" variant="admin" />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
                <Skeleton height={36} width={120} rounded="pill" variant="admin" />
                <Skeleton height={36} width={100} rounded="pill" variant="admin" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function AdminTableRowsSkeleton({
  columns,
  rows = 4,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {repeat(rows, (row) => (
        <tr key={row}>
          {repeat(columns, (col) => (
            <td key={col}>
              <Skeleton height={14} width={col === 0 ? '80%' : '60%'} rounded="sm" variant="admin" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
