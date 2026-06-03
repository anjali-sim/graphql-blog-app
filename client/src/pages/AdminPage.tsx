import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS } from "../graphql/queries/auth";
import { GET_CATEGORIES } from "../graphql/queries/posts";
import { UPDATE_USER_ROLE, CREATE_CATEGORY } from "../graphql/mutations/posts";

const AdminPage: React.FC = () => {
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(GET_USERS, {
    fetchPolicy: "network-only",
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery(
    GET_CATEGORIES,
    {
      fetchPolicy: "network-only",
    },
  );

  const [updateRole] = useMutation(UPDATE_USER_ROLE, {
    refetchQueries: [{ query: GET_USERS }],
  });

  const [createCategory, { loading: creatingCat }] = useMutation(
    CREATE_CATEGORY,
    {
      onCompleted: () => {
        setNewCategory({ name: "", description: "" });
        refetchCategories();
      },
    },
  );

  const handleRoleChange = (userId: string, role: string) => {
    updateRole({ variables: { userId, role } });
  };

  const handleCategoryCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory({ variables: { input: newCategory } });
  };

  if (usersLoading)
    return (
      <div className="py-16 text-center text-slate-500">
        Loading admin panel…
      </div>
    );
  if (usersError)
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        ⚠ {usersError.message}
      </div>
    );

  const roleBadge: Record<string, string> = {
    ADMIN: "bg-rose-100 text-rose-700 ring-rose-200",
    EDITOR: "bg-amber-100 text-amber-700 ring-amber-200",
    READER: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Admin Panel
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage users, roles and categories.
        </p>
      </div>

      <section className="card-base overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            User Management — RBAC
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Change user roles. ADMIN bypasses all role restrictions. EDITOR can
            create/edit/delete their own posts. READER can only read and
            comment.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Username</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Current Role</th>
                <th className="px-6 py-3 font-semibold">Change Role</th>
                <th className="px-6 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersData?.users.map((u: any) => (
                <tr key={u.id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-3 font-semibold text-slate-800">
                    {u.username}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                        roleBadge[u.role] ?? roleBadge.READER
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-base max-w-35"
                    >
                      <option value="READER">READER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-base p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-slate-900">Categories</h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {categoriesData?.categories.map((cat: any) => (
            <div
              key={cat.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm"
            >
              <strong className="text-slate-800">{cat.name}</strong>
              <span className="text-xs text-slate-400">/{cat.slug}</span>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleCategoryCreate}
          className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-6 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            placeholder="Category name"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            required
            className="input-base sm:max-w-50"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newCategory.description}
            onChange={(e) =>
              setNewCategory({ ...newCategory, description: e.target.value })
            }
            className="input-base"
          />
          <button
            type="submit"
            disabled={creatingCat}
            className="btn btn-primary btn-sm shrink-0"
          >
            {creatingCat ? "Adding…" : "Add Category"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminPage;
