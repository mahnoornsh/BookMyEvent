
import './EmptyState.css';

const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h3 className="empty-state-title">{title}</h3>
    {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

export default EmptyState;