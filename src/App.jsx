import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navigation from "./Components/Navigation";
import Auth from "./Pages/Auth/Auth";
import Header from './Components/Header';
import ProtectedRoute from './Components/ProtectedRoute';
import Home from './Pages/Home/Home';
import Settings from './Pages/Settings/Settings';
import Events from './Pages/Events/Events';

function Layout() {
  const location = useLocation(); // Get current route

  return (
    <div className="relative min-h-screen">
      {/* Render Header and Navigation only if not on /auth route  REMEBER TO CHANGE TO AUTH*/}
      {location.pathname !== "/auth" && <Header />}

      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Public Route - Only for Login */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected Routes - Require Login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>

      {/* Render Navigation only if not on /auth route */}
      {location.pathname !== "/auth" && <Navigation />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </Router>
  );
}

export default App;
