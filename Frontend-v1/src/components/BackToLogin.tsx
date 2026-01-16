import React from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function BackToLogin() {
    return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="text-center mb-4 bg-white/80 p-8 rounded-2xl shadow-2xl border border-blue-100 max-w-md w-full">
                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 shadow">
                        <LogIn className="w-8 h-8 text-blue-500" />
                    </span>
                </div>
                <h1 className="text-3xl font-extrabold mb-2 text-blue-700">You are not logged in</h1>
                <p className="text-lg text-gray-600 mb-6">Please log in to access this page.</p>
                <Link
                    href="/login"
                    className="mt-2 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                    <span className="inline-flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Back to Login
                    </span>
                </Link>
            </div>
        </section>
    );
}