import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_POST_BY_ID } from "../graphql/queries/posts";
import PostEditor from "../components/PostEditor";
import { useAuth } from "../context/AuthContext";

const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_POST_BY_ID, {
    variables: { id },
    fetchPolicy: "network-only", // Always fetch fresh draft content for editing
  });

  if (loading)
    return (
      <div className="py-16 text-center text-slate-500">Loading post…</div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        ⚠ {error.message}
      </div>
    );
  if (!data?.getPostById) return <Navigate to="/dashboard" />;

  const post = data.getPostById;

  const canEdit =
    user?.role === "ADMIN" ||
    (user?.role === "EDITOR" && user.id === post.author.id);

  if (!canEdit) return <Navigate to="/" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PostEditor post={post} />
    </div>
  );
};

export default EditPostPage;
