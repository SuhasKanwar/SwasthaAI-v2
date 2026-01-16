"use client";

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Heart, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider";

const USER_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_USER_BACKEND_BASE_URL || "http://localhost:8050"

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "pin" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setToken, setRole } = useAuth();

  // Step 1: Request OTP (login)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${USER_BACKEND_BASE_URL}/api/auth/login`, { email });
      const data = res.data;
      toast.success("OTP sent to your email");
      setStep(data.hasSecurityPin ? "pin" : "otp");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Verify PIN (if required)
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${USER_BACKEND_BASE_URL}/api/auth/verify-login-pin`, {
        email,
        securityPin,
      })
      toast.success("PIN verified. OTP sent to your email");
      setStep("otp");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid PIN");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${USER_BACKEND_BASE_URL}/api/auth/verify-login-otp`, {
        email,
        otp,
      })
      const data = res.data;
      if (data.token) {
        setToken(data.token);
        setRole(data.user.role);
        toast.success("Login successful!");
        setStep("done");
        if(data.user.role === "patient") {
          router.push("/u/dashboard");
        }
        else {
          router.push("/d/dashboard");
        }
      } else if (data.redirectTo === "setup-pin") {
        toast.info("Please set up your security PIN.");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const res = await axios.get(`${USER_BACKEND_BASE_URL}/api/oauth/google/url`);
      const url = res.data.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to get Google Auth URL");
      }
    } catch (error) {
      toast.error("Failed to get Google Auth URL");
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      <Link href="/" className="absolute top-6 left-6 z-20">
        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      <Card className="w-full max-w-md glassmorphism border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">Sign in to your SwasthaAI account</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          )}
          {step === "pin" && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <Label htmlFor="securityPin">Enter Security PIN</Label>
              <Input
                id="securityPin"
                type="password"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Verify PIN"}
              </Button>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Verify OTP"}
              </Button>
            </form>
          )}
          {step === "done" && (
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="font-bold text-lg">Login Successful!</div>
              <div className="text-slate-600 mt-2">Welcome to SwasthaAI.</div>
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-200 hover:bg-slate-50"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          <div className="text-center text-sm text-slate-600">
            {"Don't have an account? "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}