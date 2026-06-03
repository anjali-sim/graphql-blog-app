import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";
import { REGISTER } from "../graphql/mutations/auth";
import { useAuth } from "../context/AuthContext";

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const [register, { loading, error }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      login(data.register.token, data.register.user);
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ variables: { input: form } });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card-base w-full max-w-md p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-indigo-600 to-purple-600 text-2xl text-white shadow-md">
            ✨
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="mt-1 text-sm text-slate-500">
            New accounts are created with the READER role.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            ⚠ {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              minLength={3}
              required
              className="input-base"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
              className="input-base"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              minLength={6}
              required
              className="input-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full mt-2"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
