import { GraphQLError } from "graphql";

export const AuthenticationError = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: "UNAUTHENTICATED" },
  });

export const ForbiddenError = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: "FORBIDDEN" },
  });

export const NotFoundError = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });

export const ValidationError = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT" },
  });
