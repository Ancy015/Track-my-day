import { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import AddEdit from './pages/AddEdit';
import ExamHelper from './pages/ExamHelper';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import TimetableUpload from './pages/TimetableUpload';

const USER_STORAGE_KEY = 'tmd-user';

const getStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

function App() {
  const [user, setUser] = useState(() => getStoredUser());

  const handleLogin = (accountData) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(accountData));
    setUser(accountData);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />

        <Route
          path="/"
          element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Home />} />
          <Route path="goal-planner" element={<AddEdit />} />
          <Route path="exam-helper" element={<ExamHelper />} />
          <Route path="timetable" element={<TimetableUpload />} />
          <Route path="smart-calendar" element={<Calendar />} />
          <Route path="smart-alerts" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
