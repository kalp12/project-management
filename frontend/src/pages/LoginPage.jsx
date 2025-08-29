import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      user {
        id
        username
        email
        organization {
          slug
          name
        }
      }
    }
  }
`;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState("");

  const [login, { loading, error }] = useMutation(LOGIN, {
    context: {
      credentials: 'include', 
    },
    onCompleted: async (data) => {
      console.log("Login completed:", data);
      try {
        await refreshUser();
        navigate("/projects");
      } catch (refreshError) {
        console.error("Refresh failed:", refreshError);
        
        if (data?.login?.user) {
          navigate("/projects");
        }
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({
      variables: { username, password },
      context: {
        credentials: 'include', 
      }
    });
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

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-6 rounded-xl w-96"
      >
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded mb-3"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-3"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Login"}
        </button>


        {error && <p className="text-red-500 mt-2">{error.message}</p>}

      </form>
      <div>
        <p className="mt-4">
          Don't have an account? <Link to="/signup" className="text-blue-600 underline">Sign up</Link>
        </p>
        {user && (
          <button onClick={handleLogout} className="mt-4 text-blue-600 underline">
            Logout
          </button>
        )}
      </div>
    </div>

  );
}