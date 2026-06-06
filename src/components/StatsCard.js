export default function StatsCard({ title, value, icon, color = 'indigo', change, changeType }) {
  // Map color to appropriate SVG icon if not provided
  let defaultIcon = null;
  
  if (!icon) {
    if (color === 'indigo') defaultIcon = 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'; // Chart up
    if (color === 'green') defaultIcon = 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Money
    if (color === 'red') defaultIcon = 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Warning
    if (color === 'orange') defaultIcon = 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'; // Box
    if (color === 'blue') defaultIcon = 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'; // Users
  }

  return (
    <div className={`stat-card ${color} animate-slide`}>
      <div className={`stat-icon ${color}`}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon || defaultIcon} />
        </svg>
      </div>
      <div className="stat-info">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${changeType === 'positive' ? 'up' : changeType === 'negative' ? 'down' : ''}`}>
            {changeType === 'positive' ? '↑ ' : changeType === 'negative' ? '↓ ' : ''}
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
