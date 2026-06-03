import { withFilter } from "graphql-subscriptions";
import { pubsub, EVENTS } from "../utils/pubsub";

/**
 * Subscription Resolvers
 *
 * Concepts demonstrated:
 *  - Real-time data over WebSockets (graphql-ws protocol)
 *  - withFilter: filters subscription events by argument (postId)
 *  - PubSub: in-memory event bus (replace with Redis PubSub in production)
 *
 * Usage on client:
 *   subscription OnCommentAdded($postId: ID!) {
 *     commentAdded(postId: $postId) { id content author { username } }
 *   }
 */
export const Subscription = {
  /**
   * commentAdded — fires when a new comment is added to a specific post.
   * withFilter ensures only subscribers watching that postId receive the event.
   */
  commentAdded: {
    subscribe: withFilter(
      () => pubsub.asyncIterator([EVENTS.COMMENT_ADDED]),
      (payload: any, variables: any) => payload.postId === variables.postId,
    ),
    resolve: (payload: any) => payload.commentAdded,
  },

  /**
   * postPublished — fires whenever any post transitions to PUBLISHED status.
   * Useful for a live "Latest Posts" notification widget.
   */
  postPublished: {
    subscribe: () => pubsub.asyncIterator([EVENTS.POST_PUBLISHED]),
    resolve: (payload: any) => payload.postPublished,
  },
};
