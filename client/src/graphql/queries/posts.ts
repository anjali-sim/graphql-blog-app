import { gql } from "@apollo/client";
import {
  POST_CARD_FRAGMENT,
  POST_DETAIL_FRAGMENT,
  COMMENT_FRAGMENT,
} from "../fragments";

/**
 * Post Queries
 *
 * Concepts demonstrated:
 *  - Cursor-based pagination (GET_POSTS)
 *  - Fragment spreading to reuse field selections
 *  - Aliases: request same field twice with different names (featuredPosts / recentPosts)
 *  - Inline fragments on union types (SEARCH_CONTENT)
 *  - @skip / @include directives for conditional field selection
 */

/** Paginated public posts feed — supports category, tag, search filters */
export const GET_POSTS = gql`
  query GetPosts(
    $limit: Int
    $category: String
    $tag: String
    $search: String
    $cursor: String
  ) {
    posts(
      limit: $limit
      category: $category
      tag: $tag
      search: $search
      cursor: $cursor
    ) {
      posts {
        ...PostCard
      }
      totalCount
      hasNextPage
      cursor
    }
  }
  ${POST_CARD_FRAGMENT}
`;

/**
 * Alias demo: fetch featured and recent posts in a SINGLE query.
 * Both use the same `posts` field but with different arguments — aliases distinguish them.
 */
export const GET_HOMEPAGE_SECTIONS = gql`
  query GetHomepageSections {
    featuredPosts: posts(limit: 3) {
      posts {
        ...PostCard
      }
      totalCount
      hasNextPage
      cursor
    }
    recentPosts: posts(limit: 6) {
      posts {
        ...PostCard
      }
      totalCount
      hasNextPage
      cursor
    }
  }
  ${POST_CARD_FRAGMENT}
`;

/** Single post with full content and comments */
export const GET_POST = gql`
  query GetPost($slug: String!) {
    post(slug: $slug) {
      ...PostDetail
      comments {
        ...CommentInfo
      }
    }
  }
  ${POST_DETAIL_FRAGMENT}
  ${COMMENT_FRAGMENT}
`;

/** Fetch post by ID for the editor — auth required */
export const GET_POST_BY_ID = gql`
  query GetPostById($id: ID!) {
    getPostById(id: $id) {
      ...PostDetail
    }
  }
  ${POST_DETAIL_FRAGMENT}
`;

/** Draft posts for the dashboard — always fetched from network */
export const GET_DRAFT_POSTS = gql`
  query GetDraftPosts {
    draftPosts {
      ...PostCard
    }
  }
  ${POST_CARD_FRAGMENT}
`;

/** Categories list — good candidate for cache-first fetch policy */
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
    }
  }
`;

/**
 * Demonstrates:
 *  - Union types: SearchResult = Post | User
 *  - Inline fragments to select type-specific fields
 *  - @skip directive: skip draftInfo field if not an editor
 */
export const SEARCH_CONTENT = gql`
  query SearchContent($query: String!, $isEditor: Boolean!) {
    search(query: $query) {
      ... on Post {
        id
        title
        slug
        excerpt
        status @skip(if: $isEditor)
      }
      ... on User {
        id
        username
        bio
      }
    }
  }
`;
