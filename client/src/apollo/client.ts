import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const GRAPHQL_HTTP =
  import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:4000/graphql";
const GRAPHQL_WS =
  import.meta.env.VITE_GRAPHQL_WS_URL || "ws://localhost:4000/graphql";

const httpLink = createHttpLink({ uri: GRAPHQL_HTTP });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const { message, extensions } of graphQLErrors) {
      console.error(
        `[GraphQL Error] ${message} | code: ${extensions?.["code"]}`,
      );

      if (extensions?.["code"] === "UNAUTHENTICATED") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
  }
  if (networkError) {
    console.error("[Network Error]", networkError.message);
  }
});

const retryLink = new RetryLink({
  delay: { initial: 300, max: 3000, jitter: true },
  attempts: { max: 3, retryIf: (error) => !!error && !error.statusCode },
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS,
    connectionParams: () => ({
      authorization: localStorage.getItem("token")
        ? `Bearer ${localStorage.getItem("token")}`
        : "",
    }),
  }),
);

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === "OperationDefinition" && def.operation === "subscription"
    );
  },
  wsLink,
  ApolloLink.from([errorLink, retryLink, authLink, httpLink]),
);

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        posts: {
          keyArgs: ["category", "tag", "search"],
          merge(existing, incoming, { args }) {
            if (!args?.cursor) return incoming;
            return {
              ...incoming,
              posts: [...(existing?.posts ?? []), ...incoming.posts],
            };
          },
        },
      },
    },
    Post: {
      fields: { comments: { merge: false } },
    },
  },
});

export const client = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
    query: { fetchPolicy: "cache-first" },
  },
});
