"use client";

import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
    const { isLoggedIn, token } = useAuth();
  
    return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-700">Welcome to your dashboard!</p>
        {isLoggedIn ? (
            <p className="text-green-600 mt-4">You are logged in with token: {token?.slice(0, 20)}...</p>
        ) : (
            <p className="text-red-600 mt-4">You are not logged in.</p>
        )}
    </div>
  );
}