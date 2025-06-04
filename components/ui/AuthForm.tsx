"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type AuthFormProps = {
  type: "login" | "register";
};

export default function AuthForm({ type }: AuthFormProps) {
  const [isShown, setIsShown] = useState(false);
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        alert(result.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          {type === "login" ? "Welcome Back" : "Join Us"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {type === "register" && (
            <div>
              <label htmlFor="name" className="sr-only">
                Username
              </label>
              <input
                id="name"
                type="text"
                placeholder="Username"
                {...register("name", { required: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-500 transition duration-200"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              {...register("email", { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-500 transition duration-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative flex rounded-md border border-gray-300 focus:border-secondary w-full">
              <input
                id="password"
                type={isShown ? "text" : "password"}
                placeholder="Password"
                {...register("password", { required: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-500 transition duration-200"
              />

              <button
                type="button"
                className="absolute outline-none right-2 top-0 bottom-0 text-sm text-primary p-2"
                onClick={() => setIsShown(!isShown)}
              >
                {isShown ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          {/* {type === "register" && (
            <div className="flex items-center">
              <input
                id="isSeller"
                type="checkbox"
                {...register("isSeller")}
                className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
              />
              <label
                htmlFor="isSeller"
                className="ml-2 block text-sm text-gray-900 select-none"
              >
                I want to sell products
              </label>
            </div>
          )} */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : type === "login" ? (
              "Login"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
