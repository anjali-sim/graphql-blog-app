/**
 * Federation Demo — Posts Subgraph
 *
 * Concepts demonstrated:
 *  - @key on Post entity
 *  - Referencing the User entity from another subgraph via extend type
 *  - The gateway stitches User data from users-subgraph automatically
 */

import { buildSubgraphSchema } from "@apollo/subgraph";
import { parse } from "graphql";
import { Post } from "../../models/Post";

// parse() converts the SDL string to a DocumentNode required by buildSubgraphSchema
const typeDefs = parse(`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

  # Reference the User entity from the users-subgraph
  # The gateway resolves this cross-subgraph reference transparently
  type User @key(fields: "id", resolvable: false) {
    id: ID!
  }

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    slug: String!
    excerpt: String!
    status: String!
    author: User!
    tags: [String!]!
    likes: Int!
    publishedAt: String
    createdAt: String!
  }

  type PostsResponse {
    posts: [Post!]!
    totalCount: Int!
    hasNextPage: Boolean!
    cursor: String
  }

  type Query {
    posts(limit: Int, cursor: String): PostsResponse!
    post(slug: String!): Post
  }
`);

const resolvers = {
  Post: {
    __resolveReference: async (ref: { id: string }) => Post.findById(ref.id),
    id: (post: any) => post._id.toString(),
    // Return just the id — gateway fetches full User from users-subgraph
    author: (post: any) => ({ __typename: "User", id: post.author.toString() }),
    createdAt: (post: any) => post.createdAt?.toISOString(),
    publishedAt: (post: any) => post.publishedAt?.toISOString() ?? null,
  },
  Query: {
    posts: async (_: unknown, { limit = 6, cursor }: any) => {
      const filter: any = { status: "PUBLISHED" };
      if (cursor) filter._id = { $lt: cursor };

      const totalCount = await Post.countDocuments({ status: "PUBLISHED" });
      const posts = await Post.find(filter)
        .sort({ _id: -1 })
        .limit(limit + 1);
      const hasNextPage = posts.length > limit;
      const paginatedPosts = hasNextPage ? posts.slice(0, limit) : posts;

      return {
        posts: paginatedPosts,
        totalCount,
        hasNextPage,
        cursor: hasNextPage
          ? paginatedPosts[paginatedPosts.length - 1]._id.toString()
          : null,
      };
    },
    post: (_: unknown, { slug }: { slug: string }) => Post.findOne({ slug }),
  },
};

export const postsSubgraphSchema = buildSubgraphSchema({ typeDefs, resolvers });
