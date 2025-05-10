"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      toast.success("Registration successful. Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Illustration / Welcome Panel */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#3a87c9] to-[#4da1e6] text-white p-10">
        <div className="space-y-4 max-w-sm">
          <Image
            src="/assets/meeting-picture-background.svg"
            alt="Web illustration"
            width={300}
            height={300}
            className="mt-6"
          />
          <h2 className="text-4xl font-bold">Explore the Open Web</h2>
          <p className="opacity-90">
            The web is your canvas for connection, creativity, and discovery.
            Sign up to dive into dynamic content and global communities beyond
            imagination.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        {/* add flip classes here */}
        <div
          className="
            w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6
            transform-preserve-3d backface-hidden animate-flipInY
          "
        >
          <h3 className="text-3xl font-semibold text-gray-800 text-center">
            Sign Up
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 p-2"
              >
                {showPassword ? (
                  <Image
                    src="/assets/close-eye.svg"
                    alt="Hide"
                    width={20}
                    height={20}
                  />
                ) : (
                  <Image
                    src="/assets/open-eye.svg"
                    alt="Show"
                    width={20}
                    height={20}
                  />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 p-2"
              >
                {showConfirmPassword ? (
                  <Image
                    src="/assets/close-eye.svg"
                    alt="Hide"
                    width={20}
                    height={20}
                  />
                ) : (
                  <Image
                    src="/assets/open-eye.svg"
                    alt="Show"
                    width={20}
                    height={20}
                  />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#4da1e6] font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
