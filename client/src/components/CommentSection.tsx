import React, { useState } from "react";
import { useMutation, useSubscription } from "@apollo/client";
import { ADD_COMMENT, DELETE_COMMENT } from "../graphql/mutations/comments";
import { COMMENT_ADDED } from "../graphql/subscriptions";
import { GET_POST } from "../graphql/queries/posts";
import { useAuth } from "../context/AuthContext";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatar?: string | null };
}

interface CommentSectionProps {
  postId: string;
  postSlug: string;
  initialComments: CommentData[];
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postSlug,
  initialComments,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [liveComments, setLiveComments] =
    useState<CommentData[]>(initialComments);

  const [addComment, { loading: submitting, error: commentError }] =
    useMutation(ADD_COMMENT, {
      refetchQueries: [{ query: GET_POST, variables: { slug: postSlug } }],
      onCompleted: () => setContent(""),
      onError: (err) => console.error("Comment error:", err.message),
    });

  const [deleteComment] = useMutation(DELETE_COMMENT, {
    refetchQueries: [{ query: GET_POST, variables: { slug: postSlug } }],
  });

  useSubscription(COMMENT_ADDED, {
    variables: { postId },
    onData: ({ data }) => {
      const newComment = data.data?.commentAdded as CommentData | undefined;
      if (newComment && !liveComments.find((c) => c.id === newComment.id)) {
        setLiveComments((prev) => [newComment, ...prev]);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment({ variables: { input: { postId, content: content.trim() } } });
  };

  return (
    <section className="card-base p-6 sm:p-8">
      <h3 className="text-xl font-bold text-slate-900">
        Comments <span className="text-slate-400">({liveComments.length})</span>
      </h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            disabled={submitting}
            className="input-base resize-y"
          />
          {commentError && (
            <p className="text-sm text-rose-600">{commentError.message}</p>
          )}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Log in
          </a>{" "}
          to leave a comment.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {liveComments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No comments yet. Be the first!
          </p>
        ) : (
          liveComments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <div className="mb-2 flex items-center gap-3 text-sm">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-[10px] font-bold text-white">
                  {comment.author.username.charAt(0).toUpperCase()}
                </span>
                <strong className="text-slate-800">
                  {comment.author.username}
                </strong>
                <span className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {(user?.id === comment.author.id || user?.role === "ADMIN") && (
                  <button
                    className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    onClick={() =>
                      deleteComment({ variables: { id: comment.id } })
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default CommentSection;
