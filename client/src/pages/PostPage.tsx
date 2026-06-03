import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_POST, GET_POSTS } from "../graphql/queries/posts";
import {
  DELETE_POST,
  PUBLISH_POST,
  LIKE_POST,
} from "../graphql/mutations/posts";
import CommentSection from "../components/CommentSection";
import { useAuth } from "../context/AuthContext";

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_POST, {
    variables: { slug },
    fetchPolicy: "cache-and-network",
  });

  const [deletePost, { loading: deleting }] = useMutation(DELETE_POST, {
    refetchQueries: [{ query: GET_POSTS, variables: { limit: 6 } }],
    onCompleted: () => navigate("/"),
  });

  const [publishPost, { loading: publishing }] = useMutation(PUBLISH_POST, {
    update(cache, { data: mutData }) {
      if (!mutData?.publishPost) return;
      cache.modify({
        id: cache.identify({ __typename: "Post", id: mutData.publishPost.id }),
        fields: {
          status: () => "PUBLISHED",
          publishedAt: () => mutData.publishPost.publishedAt,
        },
      });
    },
  });

  const [likePost] = useMutation(LIKE_POST, {
    optimisticResponse: data?.post
      ? {
          likePost: {
            __typename: "Post",
            id: data.post.id,
            likes: data.post.likes + 1,
          },
        }
      : undefined,
  });

  if (loading && !data)
    return (
      <div className="py-16 text-center text-slate-500">Loading post…</div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        ⚠ {error.message}
      </div>
    );
  if (!data?.post)
    return (
      <div className="card-base py-12 text-center text-slate-500">
        Post not found.
      </div>
    );

  const post = data.post;
  const canManage =
    user?.role === "ADMIN" ||
    (user?.role === "EDITOR" && user.id === post.author.id);

  return (
    <div className="flex flex-col gap-8">
      <article className="card-base overflow-hidden p-6 sm:p-10">
        <header className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/?category=${post.category.slug}`}
              className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100 hover:bg-indigo-100"
            >
              {post.category.name}
            </Link>
            {post.status === "DRAFT" && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200">
                Draft
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
                {post.author.username.charAt(0).toUpperCase()}
              </span>
              <span>
                By{" "}
                <strong className="text-slate-700">
                  {post.author.username}
                </strong>
              </span>
            </div>
            <span>·</span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not published yet"}
            </span>
            <button
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-rose-500 transition hover:bg-rose-50"
              onClick={() => likePost({ variables: { id: post.id } })}
            >
              ❤️ <span className="font-semibold">{post.likes}</span>
            </button>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-slate mt-6 max-w-none text-base leading-relaxed text-slate-700">
          {post.content.split("\n").map((line: string, i: number) =>
            line ? (
              <p key={i} className="mb-4">
                {line}
              </p>
            ) : (
              <br key={i} />
            ),
          )}
        </div>

        {canManage && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
            <Link to={`/edit-post/${post.id}`} className="btn btn-outline">
              Edit
            </Link>
            {post.status === "DRAFT" && (
              <button
                onClick={() => publishPost({ variables: { id: post.id } })}
                disabled={publishing}
                className="btn btn-primary"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm("Permanently delete this post?")) {
                  deletePost({ variables: { id: post.id } });
                }
              }}
              disabled={deleting}
              className="btn btn-danger"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </article>

      <CommentSection
        postId={post.id}
        postSlug={slug!}
        initialComments={post.comments}
      />
    </div>
  );
};

export default PostPage;
