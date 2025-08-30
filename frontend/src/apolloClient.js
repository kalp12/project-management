import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "http://localhost:8000/graphql/",
  credentials: "include",
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message }) => {
      console.error(`[GraphQL error]: ${message}`);
    });
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

export const client = new ApolloClient({
  link: errorLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      TaskType: {
        fields: {
          comments: {
            merge(existing = [], incoming = []) {
              const merged = [...existing, ...incoming];
              const unique = Array.from(
                new Map(merged.map((c) => [c.__ref, c])).values()
              );
              return unique;
            },
          },
        },
      },
    },
  }),
});