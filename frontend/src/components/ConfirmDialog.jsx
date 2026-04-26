
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Confirm',
                          cancelLabel = 'Cancel', onConfirm, onCancel, danger = true }) => {
  if (!isOpen) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>{cancelLabel}</button>
          <button className={`confirm-btn ${danger ? 'danger' : 'primary'}`}
                  onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;