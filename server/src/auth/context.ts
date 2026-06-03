import { verifyToken, TokenPayload } from "./jwt";
import { createDataloaders } from "../dataloaders";

export interface Context {
  user: TokenPayload | null;
  dataloaders: ReturnType<typeof createDataloaders>;
}

// Use 'any' for req to avoid type conflicts between
// @apollo/server's bundled @types/express and the standalone package.
export const createContext = async ({
  req,
}: {
  req: any;
}): Promise<Context> => {
  const authHeader = req?.headers?.authorization || "";
  let user: TokenPayload | null = null;

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      user = verifyToken(token);
    } catch {
      user = null;
    }
  }

  return { user, dataloaders: createDataloaders() };
};
