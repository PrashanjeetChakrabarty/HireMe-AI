import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, sessionExpired } = useAuth();

  if (!user) {
    // The login page already shows location.state.message, so an expired token gets an explanation.
    return (
      <Navigate
        to="/login"
        replace
        state={sessionExpired ? { message: 'Your session has expired. Please log in again.' } : undefined}
      />
    );
  }

  return children;
}

export default ProtectedRoute;