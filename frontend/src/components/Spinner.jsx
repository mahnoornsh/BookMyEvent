
import './Spinner.css';

const Spinner = ({ message = 'Loading...', size = 'md' }) => {
  return (
    <div className={`spinner-container spinner-${size}`}>
      <div className="spinner-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default Spinner;