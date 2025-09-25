import React from 'react';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-50">Create an Account</h1>
            <p className="text-gray-400 mt-2">Enter your information to create a new account.</p>
          </div>

          <form className="space-y-4">
            <div>
              <label 
                htmlFor="fullname" 
                className="text-sm font-medium text-gray-300"
              >
                Full Name
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full appearance-none rounded-lg border border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-gray-300 sm:text-sm bg-gray-900 text-gray-50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full appearance-none rounded-lg border border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-gray-300 sm:text-sm bg-gray-900 text-gray-50"
                placeholder="name@example.com"
              />
            </div>

            <div>
                <label 
                    htmlFor="password" 
                    className="text-sm font-medium text-gray-300"
                >
                    Password
                </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full appearance-none rounded-lg border border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-gray-300 sm:text-sm bg-gray-900 text-gray-50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full justify-center rounded-lg bg-gray-50 py-2 px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50 focus:ring-offset-gray-950"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 pt-4">
            Already have an account?{" "}
            <a href="#" className="font-semibold text-blue-500 hover:underline">
                Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
