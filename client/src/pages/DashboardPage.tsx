import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";
import { GET_DRAFT_POSTS } from "../graphql/queries/posts";
import { DELETE_POST, PUBLISH_POST } from "../graphql/mutations/posts";
import { useAuth } from "../context/AuthContext";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * network-only fetch policy — drafts are sensitive/fresh content.
   * We always want the latest from the server, not stale cache.
   * Demonstrates: choosing the right fetch policy per use case.
   */
  const { data, loading, error, refetch } = useQuery(GET_DRAFT_POSTS, {
    fetchPolicy: "network-only",
  });

  const [deletePost] = useMutation(DELETE_POST, {
    /**
     * After deleting, refetch draftPosts to invalidate the cache entry.
     * Demonstrates: refetchQueries for cache invalidation.
     */
    refetchQueries: [{ query: GET_DRAFT_POSTS }],
    onCompleted: () => refetch(),
  });

  const [publishPost] = useMutation(PUBLISH_POST, {
    refetchQueries: [{ query: GET_DRAFT_POSTS }],
    onCompleted: () => refetch(),
  });

  if (loading)
    return (
      <div className="py-16 text-center text-slate-500">Loading dashboard…</div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        ⚠ {error.message}
      </div>
    );

  const drafts = data?.draftPosts ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back,{" "}
            <strong className="text-slate-700">{user?.username}</strong> (
            {user?.role})
          </p>
        </div>
        <Link to="/create-post" className="btn btn-primary">
          + New Post
        </Link>
      </div>

      <section className="card-base overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Draft Posts{" "}
            <span className="text-slate-400">({drafts.length})</span>
          </h3>
        </div>

        {drafts.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            You have no drafts.{" "}
            <Link
              to="/create-post"
              className="font-medium text-indigo-600 hover:underline"
            >
              Write your first post!
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Tags</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drafts.map((post: any) => (
                  <tr key={post.id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-3 font-medium text-slate-800">
                      <Link
                        to={`/post/${post.slug}`}
                        className="hover:text-indigo-600 hover:underline"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {post.category.name}
                    </td>
                    <td className="px-6 py-3">
                      {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((t: string) => (
                            <span
                              key={t}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/edit-post/${post.id}`)}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            publishPost({ variables: { id: post.id } })
                          }
                          className="btn btn-primary btn-sm"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm("Delete this draft permanently?")
                            ) {
                              deletePost({ variables: { id: post.id } });
                            }
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
