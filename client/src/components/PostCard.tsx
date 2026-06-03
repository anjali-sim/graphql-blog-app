import React from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { LIKE_POST } from "../graphql/mutations/posts";

export interface PostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  likes: number;
  status: string;
  publishedAt?: string | null;
  commentCount: number;
  author: { id: string; username: string; avatar?: string | null };
  category: { id: string; name: string; slug: string };
}

interface PostCardProps {
  post: PostCardData;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [likePost] = useMutation(LIKE_POST, {
    variables: { id: post.id },
    /**
     * Optimistic Update:
     * Immediately update the UI with the expected server response
     * before the network round-trip completes.
     * If the server fails, Apollo rolls back to the previous value.
     */
    optimisticResponse: {
      likePost: {
        __typename: "Post",
        id: post.id,
        likes: post.likes + 1,
      },
    },
  });

  return (
    <div className="card-base group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-200">
      <div className="flex items-center justify-between gap-2">
        <Link
          to={`/?category=${post.category.slug}`}
          className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100 hover:bg-indigo-100"
        >
          {post.category.name}
        </Link>
        {post.status === "DRAFT" && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200">
            Draft
          </span>
        )}
      </div>

      <h2 className="text-lg font-bold leading-snug text-slate-900">
        <Link
          to={`/post/${post.slug}`}
          className="transition group-hover:text-indigo-600"
        >
          {post.title}
        </Link>
      </h2>

      <p className="line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-[10px] font-bold text-white">
            {post.author.username.charAt(0).toUpperCase()}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-slate-700">
              {post.author.username}
            </span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            💬 {post.commentCount}
          </span>
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-rose-500 transition hover:bg-rose-50"
            onClick={() => likePost()}
            title="Like this post"
          >
            ❤️ <span className="font-semibold">{post.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
