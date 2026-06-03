import { User } from "../models/User";
import { Post } from "../models/Post";
import { Comment } from "../models/Comment";
import { Category } from "../models/Category";
import { signToken } from "../auth/jwt";
import { pubsub, EVENTS } from "../utils/pubsub";
import { Context } from "../auth/context";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

/** Convert a string to a URL-friendly slug */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

/**
 * Mutation Resolvers
 *
 * Concepts demonstrated:
 *  - JWT-based Auth (register/login)
 *  - RBAC: Editors manage own posts; Admins manage all
 *  - PubSub events for Subscriptions (commentAdded, postPublished)
 *  - Optimistic-update-friendly responses (return full updated object)
 *  - Cache invalidation signals via refetchQueries on client side
 */
export const Mutation = {
  // ─── Auth ────────────────────────────────────────────────────────────────────

  register: async (_: unknown, { input }: any) => {
    const { username, email, password } = input;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw ValidationError(
        "A user with this email or username already exists.",
      );
    }

    const user = await User.create({ username, email, password });
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { token, user };
  },

  login: async (_: unknown, { input }: any) => {
    const { email, password } = input;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      // Intentionally vague error to prevent user enumeration
      throw AuthenticationError("Invalid email or password.");
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { token, user };
  },

  // ─── Posts ───────────────────────────────────────────────────────────────────

  createPost: async (_: unknown, { input }: any, context: Context) => {
    const user = context.user!;
    if (user.role === "READER") {
      throw ForbiddenError("Only Editors and Admins can create posts.");
    }

    const {
      title,
      content,
      excerpt,
      categoryId,
      tags = [],
      status = "DRAFT",
    } = input;

    const category = await Category.findById(categoryId);
    if (!category) throw NotFoundError("Category not found.");

    // Ensure unique slug by appending timestamp
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now()}`;

    const post = await Post.create({
      title,
      slug,
      content,
      excerpt,
      category: categoryId,
      tags,
      status,
      author: user.userId,
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
    });

    if (status === "PUBLISHED") {
      pubsub.publish(EVENTS.POST_PUBLISHED, { postPublished: post });
    }

    return post;
  },

  updatePost: async (_: unknown, { id, input }: any, context: Context) => {
    const user = context.user!;

    const post = await Post.findById(id);
    if (!post) throw NotFoundError("Post not found.");

    // RBAC: Editors can only update their own posts
    if (user.role === "EDITOR" && post.author.toString() !== user.userId) {
      throw ForbiddenError("You can only edit your own posts.");
    }
    if (user.role === "READER") {
      throw ForbiddenError("Not authorized to edit posts.");
    }

    const wasPublished = post.status === "PUBLISHED";

    if (input.title !== undefined) post.title = input.title;
    if (input.content !== undefined) post.content = input.content;
    if (input.excerpt !== undefined) post.excerpt = input.excerpt;
    if (input.tags !== undefined) post.tags = input.tags;
    if (input.status !== undefined) post.status = input.status;
    if (input.categoryId) post.category = input.categoryId;

    // Set publishedAt when transitioning from DRAFT → PUBLISHED
    if (input.status === "PUBLISHED" && !wasPublished) {
      post.publishedAt = new Date();
    }

    await post.save();

    if (input.status === "PUBLISHED" && !wasPublished) {
      pubsub.publish(EVENTS.POST_PUBLISHED, { postPublished: post });
    }

    return post;
  },

  deletePost: async (_: unknown, { id }: any, context: Context) => {
    const user = context.user!;

    const post = await Post.findById(id);
    if (!post) throw NotFoundError("Post not found.");

    if (user.role === "EDITOR" && post.author.toString() !== user.userId) {
      throw ForbiddenError("You can only delete your own posts.");
    }
    if (user.role === "READER") {
      throw ForbiddenError("Not authorized to delete posts.");
    }

    await Post.deleteOne({ _id: id });
    await Comment.deleteMany({ post: id }); // Cascade delete comments

    return true;
  },

  publishPost: async (_: unknown, { id }: any, context: Context) => {
    const user = context.user!;

    const post = await Post.findById(id);
    if (!post) throw NotFoundError("Post not found.");

    if (user.role === "EDITOR" && post.author.toString() !== user.userId) {
      throw ForbiddenError("You can only publish your own posts.");
    }
    if (user.role === "READER") {
      throw ForbiddenError("Not authorized to publish posts.");
    }

    post.status = "PUBLISHED";
    post.publishedAt = new Date();
    await post.save();

    // Emit subscription event — all subscribers to postPublished will receive this
    pubsub.publish(EVENTS.POST_PUBLISHED, { postPublished: post });

    return post;
  },

  /** Increment likes — no auth required, demonstrates optimistic updates on client */
  likePost: async (_: unknown, { id }: any) => {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true },
    );
    if (!post) throw NotFoundError("Post not found.");
    return post;
  },

  // ─── Comments ────────────────────────────────────────────────────────────────

  addComment: async (_: unknown, { input }: any, context: Context) => {
    const { postId, content } = input;

    const post = await Post.findById(postId);
    if (!post) throw NotFoundError("Post not found.");

    const comment = await Comment.create({
      content,
      author: context.user!.userId,
      post: postId,
    });

    // Emit subscription event — filtered by postId on client
    pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: comment, postId });

    return comment;
  },

  deleteComment: async (_: unknown, { id }: any, context: Context) => {
    const user = context.user!;

    const comment = await Comment.findById(id);
    if (!comment) throw NotFoundError("Comment not found.");

    if (comment.author.toString() !== user.userId && user.role !== "ADMIN") {
      throw ForbiddenError("You can only delete your own comments.");
    }

    await Comment.deleteOne({ _id: id });
    return true;
  },

  // ─── Admin ───────────────────────────────────────────────────────────────────

  createCategory: async (_: unknown, { input }: any) => {
    const { name, description } = input;
    const slug = slugify(name);

    const existing = await Category.findOne({ slug });
    if (existing)
      throw ValidationError("A category with this name already exists.");

    return Category.create({ name, slug, description });
  },

  updateUserRole: async (_: unknown, { userId, role }: any) => {
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) throw NotFoundError("User not found.");
    return user;
  },
};
