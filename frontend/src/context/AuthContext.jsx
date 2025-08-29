import { createContext, useContext, useState } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_ME = gql`
  query {
    me {
      id
      username
      email
      organization {
        slug
        name
      }
    }
  }
`;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [forceRefetch, setForceRefetch] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ME, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const user = data?.me || null;

  const refreshUser = async () => {
    try {
      await refetch();
      return true;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}