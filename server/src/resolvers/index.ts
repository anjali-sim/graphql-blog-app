import { Query } from "./query";
import { Mutation } from "./mutation";
import { Subscription } from "./subscription";
import { Comment } from "../models/Comment";
import { Post } from "../models/Post";

/**
 * Combined Resolvers
 *
 * Concepts demonstrated:
 *  - Field-level resolvers (author, category, comments, commentCount)
 *  - DataLoader integration via context.dataloaders (solves N+1)
 *  - ID serialization (_id → id)
 *  - Date serialization (Date → ISO string)
 *  - Union __resolveType for SearchResult
 */
export const resolvers = {
  Query,
  Mutation,
  Subscription,

  // ─── Post field resolvers ───────────────────────────────────────────────────
  Post: {
    id: (post: any) => post._id.toString(),

    /** Uses DataLoader to batch-load authors — prevents N+1 queries */
    author: (post: any, _: unknown, context: any) =>
      context.dataloaders.userLoader.load(post.author.toString()),

    /** Uses DataLoader to batch-load categories */
    category: (post: any, _: unknown, context: any) =>
      context.dataloaders.categoryLoader.load(post.category.toString()),

    comments: (post: any) =>
      Comment.find({ post: post._id }).sort({ createdAt: -1 }).exec(),

    commentCount: (post: any) =>
      Comment.countDocuments({ post: post._id }).exec(),

    createdAt: (post: any) => post.createdAt?.toISOString(),
    updatedAt: (post: any) => post.updatedAt?.toISOString(),
    publishedAt: (post: any) => post.publishedAt?.toISOString() ?? null,
  },

  // ─── Comment field resolvers ─────────────────────────────────────────────────
  Comment: {
    id: (comment: any) => comment._id.toString(),

    author: (comment: any, _: unknown, context: any) =>
      context.dataloaders.userLoader.load(comment.author.toString()),

    post: (comment: any) => Post.findById(comment.post).exec(),

    createdAt: (comment: any) => comment.createdAt?.toISOString(),
  },

  // ─── User field resolvers ────────────────────────────────────────────────────
  User: {
    id: (user: any) => user._id.toString(),
    createdAt: (user: any) => user.createdAt?.toISOString(),
  },

  // ─── Category field resolvers ────────────────────────────────────────────────
  Category: {
    id: (cat: any) => cat._id.toString(),
  },

  // ─── Union type resolver ──────────────────────────────────────────────────────
  SearchResult: {
    __resolveType(obj: any) {
      if (obj.__typename === "Post") return "Post";
      if (obj.__typename === "User") return "User";
      return null;
    },
  },
};
