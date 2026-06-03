/**
 * Federation Demo — Users Subgraph
 *
 * Concepts demonstrated:
 *  - @key directive marks the entity's primary key for federation
 *  - __resolveReference resolves the entity when requested by another subgraph
 *  - @apollo/subgraph enables this service to participate in a federated graph
 *
 * In a production federated setup, this would run as its own Node.js server
 * on a separate port, composed via Apollo Router or Apollo Gateway.
 *
 * Apollo Router composes:
 *   users-subgraph  (this file)  →  port 4001
 *   posts-subgraph               →  port 4002
 *   ──────────────────────────────────────────
 *   Federated Supergraph         →  port 4000  (public API)
 */

import { buildSubgraphSchema } from "@apollo/subgraph";
import { parse } from "graphql";
import { User } from "../../models/User";

// parse() converts the SDL string to a DocumentNode required by buildSubgraphSchema
const typeDefs = parse(`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  # @key marks 'id' as the primary key used by the gateway to stitch entities
  type User @key(fields: "id") {
    id: ID!
    username: String!
    email: String!
    role: String!
    bio: String
    avatar: String
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }
`);

const resolvers = {
  User: {
    /**
     * __resolveReference is called by the gateway when another subgraph
     * references a User entity. It receives the { __typename, id } reference
     * and must return the full User object.
     */
    __resolveReference: async (ref: { id: string }) => {
      return User.findById(ref.id);
    },
    id: (user: any) => user._id.toString(),
    createdAt: (user: any) => user.createdAt?.toISOString(),
  },
  Query: {
    users: () => User.find(),
    user: (_: unknown, { id }: { id: string }) => User.findById(id),
  },
};

export const usersSubgraphSchema = buildSubgraphSchema({ typeDefs, resolvers });
