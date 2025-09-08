import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
      credentials: "include",
    },
    onCompleted: async (data) => {
      try {
        await refreshUser();
        navigate("/projects");
      } catch {
        if (data?.login?.user) {
          navigate("/projects");
        }
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({
      variables: { username, password },
      context: {
        credentials: "include",
      },
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCSRFToken() },
      });
      setMessage("Logged out successfully.");
    } catch {
      setMessage("Logout failed.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-xl w-full max-w-md p-8 space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>
          {error && <p className="text-red-500 text-sm text-center">{error.message}</p>}
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {user && (
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:underline text-sm"
            >
              Logout
            </button>
          </div>
        )}

        {message && (
          <div className="text-center text-sm text-green-600">
            {message}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function getCSRFToken() {
  const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
  return match ? match[2] : '';
}