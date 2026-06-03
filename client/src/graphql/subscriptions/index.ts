import { gql } from "@apollo/client";
import { COMMENT_FRAGMENT, POST_CARD_FRAGMENT } from "../fragments";

/**
 * Subscriptions
 *
 * Concepts demonstrated:
 *  - Real-time data with graphql-ws WebSocket protocol
 *  - Subscription variables (postId for filtering)
 *  - Fragment reuse in subscription payloads (same as queries/mutations)
 *  - onData callback updates local state in CommentSection
 */

/** Fires whenever a new comment is added to a specific post */
export const COMMENT_ADDED = gql`
  subscription OnCommentAdded($postId: ID!) {
    commentAdded(postId: $postId) {
      ...CommentInfo
    }
  }
  ${COMMENT_FRAGMENT}
`;

/** Fires whenever any post is published — useful for live notifications */
export const POST_PUBLISHED = gql`
  subscription OnPostPublished {
    postPublished {
      ...PostCard
    }
  }
  ${POST_CARD_FRAGMENT}
`;
