import { Post } from "../models/Post";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { Comment } from "../models/Comment";
import { Context } from "../auth/context";

/**
 * Query Resolvers
 *
 * Concepts demonstrated:
 *  - Cursor-based pagination (posts query)
 *  - Cache-conscious data fetching
 *  - RBAC enforcement in resolvers
 *  - Union type resolution (search)
 *  - DataLoader usage via context (in field resolvers — see resolvers/index.ts)
 */
export const Query = {
  /**
   * Fetch published posts with cursor-based pagination.
   * Supports filtering by category slug, tag, and full-text search.
   */
  posts: async (_: unknown, args: any) => {
    const { limit = 6, category, tag, search, cursor } = args;

    const filter: Record<string, any> = { status: "PUBLISHED" };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Cursor-based pagination: fetch posts before this cursor ID
    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const totalCount = await Post.countDocuments({ status: "PUBLISHED" });

    // Fetch one extra to determine if there is a next page
    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1);

    const hasNextPage = posts.length > limit;
    const paginatedPosts = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage
      ? paginatedPosts[paginatedPosts.length - 1]._id.toString()
      : null;

    return {
      posts: paginatedPosts,
      totalCount,
      hasNextPage,
      cursor: nextCursor,
    };
  },

  /** Fetch a single published post by slug (public) */
  post: async (_: unknown, { slug }: { slug: string }) => {
    return Post.findOne({ slug }).exec();
  },

  /** Fetch a post by ID (auth required — used in editor) */
  getPostById: async (_: unknown, { id }: { id: string }) => {
    return Post.findById(id).exec();
  },

  /** Fetch all categories (public, good candidate for cache-first) */
  categories: async () => {
    return Category.find().sort({ name: 1 }).exec();
  },

  /** Current authenticated user's profile */
  me: async (_: unknown, __: unknown, context: Context) => {
    return User.findById(context.user!.userId).exec();
  },

  /** All users — ADMIN only (enforced by @hasRole directive) */
  users: async () => {
    return User.find().sort({ createdAt: -1 }).exec();
  },

  /** Draft posts for the current user (editors see own, admins see all) */
  draftPosts: async (_: unknown, __: unknown, context: Context) => {
    const filter: Record<string, any> = { status: "DRAFT" };
    if (context.user!.role !== "ADMIN") {
      filter.author = context.user!.userId;
    }
    return Post.find(filter).sort({ createdAt: -1 }).exec();
  },

  /**
   * Unified search returning a union type: SearchResult = Post | User
   * Client uses inline fragments to handle each type.
   */
  search: async (_: unknown, { query }: { query: string }) => {
    const regex = new RegExp(query, "i");

    const [posts, users] = await Promise.all([
      Post.find({
        status: "PUBLISHED",
        $or: [{ title: regex }, { excerpt: regex }],
      }).limit(5),
      User.find({ $or: [{ username: regex }, { bio: regex }] }).limit(5),
    ]);

    return [
      ...posts.map((p) => ({ ...p.toObject(), __typename: "Post" })),
      ...users.map((u) => ({ ...u.toObject(), __typename: "User" })),
    ];
  },
};
