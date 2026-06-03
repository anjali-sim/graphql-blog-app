import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import cors from "cors";
import mongoose from "mongoose";
import depthLimit from "graphql-depth-limit";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./resolvers";
import { createContext } from "./auth/context";
import { applyDirectives } from "./directives/authDirective";
import { createDataloaders } from "./dataloaders";
import { verifyToken } from "./auth/jwt";

const PORT = parseInt(process.env.PORT || "4000", 10);
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/blog-cms";

async function bootstrap() {
  // ── 1. Connect to MongoDB ──────────────────────────────────────────────────
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // ── 2. Build the executable schema ────────────────────────────────────────
  //    makeExecutableSchema merges typeDefs + resolvers
  //    applyDirectives transforms the schema to enforce @auth / @hasRole
  let schema = makeExecutableSchema({ typeDefs, resolvers });
  schema = applyDirectives(schema);

  // ── 3. HTTP server (Express) ──────────────────────────────────────────────
  const app = express();
  const httpServer = createServer(app);

  // ── 4. WebSocket server for Subscriptions ────────────────────────────────
  //    graphql-ws is the modern WS protocol (replaces subscriptions-transport-ws)
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const wsServerCleanup = useServer(
    {
      schema,
      context: (ctx) => {
        // Extract JWT from WebSocket connectionParams for authenticated subscriptions
        const authHeader = ctx.connectionParams?.authorization as
          | string
          | undefined;
        let user = null;
        if (authHeader?.startsWith("Bearer ")) {
          try {
            user = verifyToken(authHeader.substring(7));
          } catch {
            user = null;
          }
        }
        return { user, dataloaders: createDataloaders() };
      },
    },
    wsServer,
  );

  // ── 5. Apollo Server ──────────────────────────────────────────────────────
  const server = new ApolloServer({
    schema,
    // Performance: limit query depth to prevent deeply nested malicious queries
    validationRules: [depthLimit(7)],
    plugins: [
      // Gracefully drain HTTP connections on shutdown
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Gracefully dispose WebSocket server on shutdown
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsServerCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // ── 6. Apply middleware ───────────────────────────────────────────────────
  app.use(
    "/graphql",
    // cors<cors.CorsRequest>({
    //   origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    //   credentials: true,
    // }),
    cors<cors.CorsRequest>({
      origin: [
        "http://localhost:5173",
        "https://graphql-blog-app-six.vercel.app",
        process.env.CLIENT_ORIGIN as string,
      ],
      credentials: true,
    }),
    express.json(),
    // Cast needed: @apollo/server bundles its own @types/express which conflicts
    // with the standalone @types/express. Both are identical at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expressMiddleware(server, { context: createContext as any }) as any,
  );

  // ── 7. Start HTTP server ──────────────────────────────────────────────────
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL API:           http://localhost:${PORT}/graphql`);
    console.log(`🔌 Subscriptions (WS):    ws://localhost:${PORT}/graphql`);
    console.log(
      `📖 Apollo Studio Sandbox: https://studio.apollographql.com/sandbox`,
    );
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
