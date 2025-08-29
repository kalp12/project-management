import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, gql } from "@apollo/client";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();

    const query = `
      mutation {
        signup(username:"${username}", password:"${password}", organizationName:"${organization}") {
          user
          organization
        }
      }
    `;
    try {
      const res = await fetch("http://localhost:8000/graphql/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.errors) {
        setMessage("Error: " + data.errors[0].message);
      } else {
        setMessage(`User ${data.data.signup.user} signed up for ${data.data.signup.organization}`);
      }
    } catch (err) {
      setMessage("Signup failed.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCSRFToken() }
      });
      setMessage("Logged out successfully.");
    } catch {
      setMessage("Logout failed.");
    }
  };

  
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Signup</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4">
          Have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
        </p>
        {user && (
          <button onClick={handleLogout} className="mt-4 text-blue-600 underline">
            Logout
          </button>
        )}

        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>

    </div>
  );
}