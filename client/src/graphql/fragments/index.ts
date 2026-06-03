import { gql } from "@apollo/client";

/**
 * GraphQL Fragments
 *
 * Fragments define reusable field selections.
 * Concepts demonstrated:
 *  - Avoid duplication across queries/mutations/subscriptions
 *  - Named fragments compose into larger queries
 *  - Fragment spreading (...PostCard) in queries
 *  - Aliases allow requesting the same field with different shapes
 *    (see GET_POSTS usage in HomePage with featuredPosts alias)
 */

/** Author info used across Post, Comment, and auth payloads */
export const AUTHOR_FRAGMENT = gql`
  fragment AuthorInfo on User {
    id
    username
    email
    role
    bio
    avatar
    createdAt
  }
`;

/** Compact post fields — used in feed, search results, dashboard table */
export const POST_CARD_FRAGMENT = gql`
  fragment PostCard on Post {
    id
    title
    slug
    excerpt
    tags
    likes
    status
    publishedAt
    createdAt
    commentCount
    author {
      id
      username
      avatar
    }
    category {
      id
      name
      slug
    }
  }
`;

/** Full post fields — extends PostCard with content and updatedAt */
export const POST_DETAIL_FRAGMENT = gql`
  fragment PostDetail on Post {
    ...PostCard
    content
    updatedAt
  }
  ${POST_CARD_FRAGMENT}
`;

/** Comment fields reused in query, mutation response, and subscription payload */
export const COMMENT_FRAGMENT = gql`
  fragment CommentInfo on Comment {
    id
    content
    createdAt
    author {
      id
      username
      avatar
    }
  }
`;
