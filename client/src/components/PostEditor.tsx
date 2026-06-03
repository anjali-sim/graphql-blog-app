import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { CREATE_POST, UPDATE_POST } from "../graphql/mutations/posts";
import { GET_CATEGORIES, GET_DRAFT_POSTS } from "../graphql/queries/posts";

interface ExistingPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: string;
  category: { id: string; name: string };
}

interface PostEditorProps {
  post?: ExistingPost;
}

const PostEditor: React.FC<PostEditorProps> = ({ post }) => {
  const navigate = useNavigate();
  const isEditing = !!post;

  const [form, setForm] = useState({
    title: post?.title ?? "",
    content: post?.content ?? "",
    excerpt: post?.excerpt ?? "",
    categoryId: post?.category?.id ?? "",
    tags: post?.tags?.join(", ") ?? "",
  });

  const { data: categoriesData, loading: loadingCats } = useQuery(
    GET_CATEGORIES,
    {
      fetchPolicy: "cache-first",
    },
  );

  const [createPost, { loading: creating, error: createError }] = useMutation(
    CREATE_POST,
    {
      refetchQueries: [{ query: GET_DRAFT_POSTS }],
      onCompleted: (data) => navigate(`/post/${data.createPost.slug}`),
    },
  );

  const [updatePost, { loading: updating, error: updateError }] = useMutation(
    UPDATE_POST,
    {
      refetchQueries: [{ query: GET_DRAFT_POSTS }],
      onCompleted: (data) => navigate(`/post/${data.updatePost.slug}`),
    },
  );

  const buildInput = (status: "DRAFT" | "PUBLISHED") => ({
    title: form.title.trim(),
    content: form.content.trim(),
    excerpt: form.excerpt.trim(),
    categoryId: form.categoryId,
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const input = buildInput("DRAFT");
    if (isEditing) {
      updatePost({ variables: { id: post!.id, input } });
    } else {
      createPost({ variables: { input } });
    }
  };

  const handlePublish = (e: React.MouseEvent) => {
    e.preventDefault();
    const input = buildInput("PUBLISHED");
    if (isEditing) {
      updatePost({ variables: { id: post!.id, input } });
    } else {
      createPost({ variables: { input } });
    }
  };

  const error = createError ?? updateError;
  const loading = creating || updating;

  return (
    <div className="card-base p-6 sm:p-10">
      <h2 className="text-2xl font-bold text-slate-900">
        {isEditing ? "Edit Post" : "New Post"}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {isEditing
          ? "Update your draft and republish when ready."
          : "Compose a new article and save it as a draft or publish immediately."}
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          ⚠ {error.message}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter post title"
            required
            className="input-base"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="category"
            className="text-sm font-medium text-slate-700"
          >
            Category *
          </label>
          <select
            id="category"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
            disabled={loadingCats}
            className="input-base"
          >
            <option value="">Select a category…</option>
            {categoriesData?.categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="excerpt"
            className="text-sm font-medium text-slate-700"
          >
            Excerpt *
          </label>
          <textarea
            id="excerpt"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Short description shown in the feed"
            rows={2}
            required
            className="input-base resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="content"
            className="text-sm font-medium text-slate-700"
          >
            Content *
          </label>
          <textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your post content here…"
            rows={16}
            required
            className="input-base resize-y font-mono text-sm leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tags" className="text-sm font-medium text-slate-700">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="graphql, typescript, react  (comma-separated)"
            className="input-base"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <button type="submit" disabled={loading} className="btn btn-outline">
            {loading ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Publishing…" : "Publish Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostEditor;
