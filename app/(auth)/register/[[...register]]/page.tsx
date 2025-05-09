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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br bg-white p-8">
      <div className="flex w-full h-[600px] max-w-[900px] bg-[#8da6cc] rounded-3xl overflow-hidden shadow-lg">
        {/* Left Section: Welcome */}
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

        {/* Right Section: Sign Up Form */}
        <div className="w-3/7 m-8 p-6 bg-white border-2 border-[#4da1e6] rounded-3xl flex flex-col justify-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Sign Up</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name and Last Name */}
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

            {/* Username */}
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

            {/* Email */}
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

            {/* Password */}
            <div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4da1e6] text-white py-3 rounded-md hover:bg-[#3a87c9] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[#4da1e6] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
