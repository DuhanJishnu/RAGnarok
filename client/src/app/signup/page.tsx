"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const signupSchema = z.object({
  fullname: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    fullname: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [apiError, setApiError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setErrors({});
    setApiError('');
    
    const validationResult = signupSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullname,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/login');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-50">Create an Account</h1>
            <p className="text-gray-400 mt-2">Enter your information to create a new account.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}
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
                value={formData.fullname}
                onChange={handleChange}
              />
              {errors.fullname && <p className="text-red-500 text-xs mt-1">{errors.fullname}</p>}
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
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center rounded-lg bg-gray-50 py-2 px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 pt-4">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-blue-500 hover:underline">
                Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

