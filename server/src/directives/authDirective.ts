import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import { AuthenticationError, ForbiddenError } from "../utils/errors";

/**
 * Custom Directive Transformers
 *
 * Apollo Server 4 handles custom directives via schema transformation.
 * We use mapSchema + getDirective from @graphql-tools/utils to wrap
 * field resolvers with auth/role checks at the schema level.
 *
 * @auth      → ensures a valid JWT user exists in context
 * @hasRole   → ensures the user has the required role (ADMIN bypasses all role checks)
 */
export function applyDirectives(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, "auth")?.[0];
      const hasRoleDirective = getDirective(
        schema,
        fieldConfig,
        "hasRole",
      )?.[0];

      if (hasRoleDirective) {
        const requiredRole = hasRoleDirective["role"] as string;
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async (source, args, context, info) => {
          if (!context.user) {
            throw AuthenticationError(
              "You must be logged in to perform this action.",
            );
          }
          // ADMIN bypasses all role restrictions
          if (
            context.user.role !== requiredRole &&
            context.user.role !== "ADMIN"
          ) {
            throw ForbiddenError(
              `This action requires the ${requiredRole} role. Your role: ${context.user.role}.`,
            );
          }
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async (source, args, context, info) => {
          if (!context.user) {
            throw AuthenticationError(
              "You must be logged in to perform this action.",
            );
          }
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }

      return fieldConfig;
    },
  });
}
