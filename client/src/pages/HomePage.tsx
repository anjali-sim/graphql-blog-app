import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { NetworkStatus } from "@apollo/client";
import { GET_POSTS, GET_CATEGORIES } from "../graphql/queries/posts";
import PostCard from "../components/PostCard";

const HomePage: React.FC = () => {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, error, fetchMore, networkStatus } = useQuery(
    GET_POSTS,
    {
      variables: {
        limit: 6,
        category: category || undefined,
        search: search || undefined,
      },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );

  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    fetchPolicy: "cache-first",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCategory("");
  };

  const handleLoadMore = () => {
    if (!data?.posts.hasNextPage) return;
    fetchMore({
      variables: { cursor: data.posts.cursor, limit: 6 },
    });
  };

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading = loading && !data;

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-linear-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-6 py-14 text-center text-white shadow-lg sm:px-12 sm:py-20">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="relative z-10 mx-auto max-w-2xl">
          {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 ring-1 ring-inset ring-white/20">
            ✨ GraphQL Practical Demo
          </span> */}
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-purple-600">
            Blog & CMS
          </h1>
          <p className="mt-4 text-base  sm:text-lg text-purple-600">
            A full GraphQL practical — Apollo Client, Subscriptions, Caching,
            Auth, RBAC & more.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearch}
          className="flex w-full items-center gap-2 sm:max-w-md"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="input-base"
          />
          <button type="submit" className="btn btn-outline btn-sm shrink-0">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-outline btn-sm shrink-0"
              onClick={() => {
                setSearch("");
                setSearchInput("");
              }}
            >
              Clear
            </button>
          )}
        </form>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSearch("");
            setSearchInput("");
          }}
          className="input-base sm:max-w-xs"
        >
          <option value="">All Categories</option>
          {categoriesData?.categories.map((cat: any) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          ⚠ {error.message}
        </div>
      )}

      {isInitialLoading ? (
        <div className="py-16 text-center text-slate-500">Loading posts…</div>
      ) : (
        <>
          {data?.posts.posts.length === 0 && (
            <div className="card-base py-12 text-center text-slate-500">
              <p>No posts found. Try a different search or category.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.posts.posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {data?.posts.hasNextPage && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-slate-500">
                Showing {data.posts.posts.length} of {data.posts.totalCount}{" "}
                posts
              </p>
              <button
                onClick={handleLoadMore}
                disabled={isFetchingMore}
                className="btn btn-outline"
              >
                {isFetchingMore ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
