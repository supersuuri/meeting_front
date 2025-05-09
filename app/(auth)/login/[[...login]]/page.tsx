"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // Added for "Remember Me" checkbox
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast.success("Login successful");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffffff] to-[#ffffff] p-8">
      <div className="flex w-full h-[500px] max-w-[900px] bg-[#8da6cc] rounded-3xl overflow-hidden shadow-lg">
        <div className="w-1/2 p-10 text-white flex flex-col justify-start">
          <div className="flex justify-center items-start mb-4">
            <Image src="/assets/logo.png" alt="Logo" width={100} height={100} />
          </div>
          <h1 className="text-4xl font-bold mb-4">WELCOME</h1>
          <h2 className="text-xl font-semibold mb-4">
            Connect, Communicate, Collaborate in Real-Time
          </h2>
          <p className="text-sm opacity-80">
            Seamlessly connect, communicate, and collaborate with friends,
            family, and colleagues anytime, anywhere. Our app delivers
            crystal-clear video calls, smooth interactions, and intuitive
            features to keep you connected effortlessly.
          </p>
        </div>

        {/* Right Section: Sign In Form */}
        <div className="w-3/7 m-8 p-6 bg-white border-2 border-[#4da1e6] rounded-3xl flex flex-col justify-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Sign In</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="User Name"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            {/* Password Input with Show/Hide */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#4da1e6] focus:ring-[#4da1e6] border-gray-300 rounded"
                />
                <span className="text-gray-600">Remember Me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[#4da1e6] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4da1e6] text-white py-3 rounded-md hover:bg-[#3a87c9] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#4da1e6] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
