type Props = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>

        <div className="modal-actions">
          <button className="admin-danger-button" onClick={onConfirm}>
            Delete
          </button>
          <button className="admin-secondary-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
