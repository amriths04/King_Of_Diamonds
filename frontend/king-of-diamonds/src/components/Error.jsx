import "../styles/Error.css";

export default function Error({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-overlay">
      <div className="error-box">
        <h3 className="error-title">⚠️</h3>
        <p className="error-message">{message}</p>
        <button className="error-close" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
