import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith("csrftoken=")) {
          cookieValue = cookie.substring("csrftoken=".length);
          break;
        }
      }
    }
    return cookieValue;
  }
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCSRFToken() }
      });
      setMessage("Logged out successfully.");
      navigate("/login");
    } catch {
      setMessage("Logout failed.");
    }
  };
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Project Manager</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/projects/dashboard">Projects Dashboard</Link>
          <Link to="/projects">Projects</Link>
          {/* <Link to="/tasks">Tasks</Link> */}
          {user && (
          <button onClick={handleLogout} className="mt-4 text-blue-600 underline">
            Logout
          </button>
        )}
        </nav>
      </aside>

     
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
