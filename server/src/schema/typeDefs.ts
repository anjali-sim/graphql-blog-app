/**
 * GraphQL SDL (Schema Definition Language)
 *
 * Defines all types, queries, mutations, subscriptions, directives,
 * enums, inputs, and unions for the Blog & CMS platform.
 *
 * Concepts covered:
 *  - SDL syntax, scalar types, enums, interfaces, unions
 *  - Custom directives (@auth, @hasRole) for RBAC
 *  - Input types for mutations
 *  - Pagination response type (cursor-based)
 *  - @deprecated directive usage example
 *  - @skip / @include are client-side directives (used in queries)
 */

export const typeDefs = `#graphql

  # ─── Custom Directives ───────────────────────────────────────────────────────
  # @auth  → field requires a valid JWT token
  # @hasRole → field requires a specific role (ADMIN always passes)
  directive @auth on FIELD_DEFINITION
  directive @hasRole(role: Role!) on FIELD_DEFINITION

  # ─── Enums ───────────────────────────────────────────────────────────────────
  enum Role {
    ADMIN
    EDITOR
    READER
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
  }

  # ─── Core Types ──────────────────────────────────────────────────────────────
  type User {
    id: ID!
    username: String!
    email: String!
    role: Role!
    bio: String
    avatar: String
    createdAt: String!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    excerpt: String!
    status: PostStatus!
    author: User!
    category: Category!
    tags: [String!]!
    likes: Int!
    publishedAt: String
    createdAt: String!
    updatedAt: String!
    comments: [Comment!]!
    commentCount: Int!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }

  # ─── Auth ────────────────────────────────────────────────────────────────────
  type AuthPayload {
    token: String!
    user: User!
  }

  # ─── Pagination (cursor-based) ───────────────────────────────────────────────
  type PostsResponse {
    posts: [Post!]!
    totalCount: Int!
    hasNextPage: Boolean!
    cursor: String
  }

  # ─── Union (used in Search) ───────────────────────────────────────────────────
  union SearchResult = Post | User

  # ─── Input Types ─────────────────────────────────────────────────────────────
  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
    excerpt: String!
    categoryId: ID!
    tags: [String!]
    status: PostStatus
  }

  input UpdatePostInput {
    title: String
    content: String
    excerpt: String
    categoryId: ID
    tags: [String!]
    status: PostStatus
  }

  input CreateCategoryInput {
    name: String!
    description: String
  }

  input AddCommentInput {
    postId: ID!
    content: String!
  }

  # ─── Queries ─────────────────────────────────────────────────────────────────
  type Query {
    # Public — no auth required
    posts(
      limit: Int
      category: String
      tag: String
      search: String
      cursor: String
    ): PostsResponse!

    post(slug: String!): Post
    categories: [Category!]!
    search(query: String!): [SearchResult!]!

    # Auth required
    me: User @auth
    getPostById(id: ID!): Post @auth
    draftPosts: [Post!]! @auth

    # Admin only
    users: [User!]! @hasRole(role: ADMIN)
  }

  # ─── Mutations ───────────────────────────────────────────────────────────────
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Post management (EDITOR or ADMIN)
    createPost(input: CreatePostInput!): Post! @auth
    updatePost(id: ID!, input: UpdatePostInput!): Post! @auth
    deletePost(id: ID!): Boolean! @auth
    publishPost(id: ID!): Post! @auth
    likePost(id: ID!): Post!

    # Comments (any authenticated user)
    addComment(input: AddCommentInput!): Comment! @auth
    deleteComment(id: ID!): Boolean! @auth

    # Admin only
    createCategory(input: CreateCategoryInput!): Category! @hasRole(role: ADMIN)
    updateUserRole(userId: ID!, role: Role!): User! @hasRole(role: ADMIN)
  }

  # ─── Subscriptions ───────────────────────────────────────────────────────────
  type Subscription {
    # Real-time comments on a specific post
    commentAdded(postId: ID!): Comment!
    # Notifies when a new post is published
    postPublished: Post!
  }
`;
