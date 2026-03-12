import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Loader } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, sessionLoading } = useSelector((state) => state.auth);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader strokeWidth={1.5} className="w-12 h-12 text-teal-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}