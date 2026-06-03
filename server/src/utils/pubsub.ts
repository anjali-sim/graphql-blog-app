import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const EVENTS = {
  COMMENT_ADDED: "COMMENT_ADDED",
  POST_PUBLISHED: "POST_PUBLISHED",
} as const;
