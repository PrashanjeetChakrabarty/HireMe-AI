import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  // True after the 8-hour login token ran out, so the login page can say why the user was sent back.
  const [sessionExpired, setSessionExpired] = useState(false);

  const loginUser = (data) => {
    setUser(data);
    setSessionExpired(false);
    localStorage.setItem('user', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // axiosClient fires this event when the API answers 401 on a logged-in call.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setSessionExpired(true);
      localStorage.removeItem('user');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}