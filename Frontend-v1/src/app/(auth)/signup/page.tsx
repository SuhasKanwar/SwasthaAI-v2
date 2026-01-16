"use client";

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Heart,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Stethoscope,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { toast } from "sonner"
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

const USER_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_USER_BACKEND_BASE_URL || "http://localhost:8050";

export default function SignUpPage() {
  const [step, setStep] = useState<"email" | "otp" | "pin" | "profile" | "done">("email");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [token, setTokenState] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "",
    dateOfBirth: "",
    role: "",
  });
  const { setToken, setRole } = useAuth();
  const router = useRouter();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${USER_BACKEND_BASE_URL}/api/auth/request-otp`, {
        email: formData.email,
      });
      const data = res.data;
      setIsNewUser(data.isNewUser);
      toast.success("OTP sent to your email");
      setStep("otp");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${USER_BACKEND_BASE_URL}/api/auth/verify-otp`, {
        email: formData.email,
        otp,
      });
      const data = res.data;
      if (data.status === "success") {
        toast.success("OTP verified. Set your PIN.");
        setStep("pin");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: Set PIN
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${USER_BACKEND_BASE_URL}/api/auth/setup-pin`, {
        email: formData.email,
        securityPin: pin,
        confirmPin: pin,
        isNewUser,
      });
      const data = res.data;
      setTokenState(data.token);
      setToken(data.token);
      setRole(data.role);
      toast.success("PIN set. Complete your profile.");
      setStep("profile");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to set PIN");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 4: Complete Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${USER_BACKEND_BASE_URL}/api/physical-health/user/profile/basic-info`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          role: formData.role,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Account created successfully!");
      setStep("done");
      if(response.data?.data?.role === "patient") {
        router.push("/u/dashboard");
      }
      else {
        router.push("/d/dashboard");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to complete profile");
    } finally {
      setIsLoading(false);
    }
  }

  const validateForm = () => {
    if (formData.password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long.",
        icon: <AlertCircle className="w-4 h-4" />,
      })
      return false
    }
    if (!formData.email.includes("@")) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
        icon: <AlertCircle className="w-4 h-4" />,
      })
      return false
    }
    if (formData.firstName.trim().length < 1) {
      toast.error("First name required", {
        description: "Please enter your first name.",
        icon: <AlertCircle className="w-4 h-4" />,
      })
      return false
    }
    if (formData.lastName.trim().length < 1) {
      toast.error("Last name required", {
        description: "Please enter your last name.",
        icon: <AlertCircle className="w-4 h-4" />,
      })
      return false
    }
    if (!formData.gender) {
      toast.error("Gender required", {
        description: "Please select your gender.",
        icon: <AlertCircle className="w-4 h-4" />,
      })
      return false
    }
    if (!formData.dateOfBirth) {
      toast.error("Date of birth required", {
        description: "Please enter your date of birth.",
        icon: <AlertCircle className="w-4 h-4" />,
      })
      return false
    }
    return true
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGoogleSignup = async () => {
    try {
      const res = await axios.get(`${USER_BACKEND_BASE_URL}/api/oauth/google/url`)
      const url = res.data.url
      if (url) {
        window.location.href = url
      } else {
        toast.error("Failed to get Google Auth URL")
      }
    } catch (error) {
      toast.error("Failed to get Google Auth URL")
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
              Join SwasthaAI
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">Create your account to get started</CardDescription>
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
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={isLoading} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Verify OTP"}
              </Button>
            </form>
          )}
          {step === "pin" && (
            <form onSubmit={handleSetPin} className="space-y-4">
              <Label htmlFor="pin">Set Security PIN</Label>
              <Input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} required disabled={isLoading} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Set PIN"}
              </Button>
            </form>
          )}
          {step === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700 font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700 font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-slate-700 font-medium">
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-700 font-medium">
                  Gender
                </Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-md py-2 px-3"
                  disabled={isLoading}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Account Type</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                  className="grid grid-cols-2 gap-4"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 transition-colors">
                    <RadioGroupItem value="patient" id="patient" />
                    <Label htmlFor="patient" className="flex items-center cursor-pointer flex-1">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm font-medium">Patient</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-teal-50 transition-colors">
                    <RadioGroupItem value="doctor" id="doctor" />
                    <Label htmlFor="doctor" className="flex items-center cursor-pointer flex-1">
                      <Stethoscope className="w-4 h-4 mr-2 text-teal-500" />
                      <span className="text-sm font-medium">Doctor</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Complete Signup"}
              </Button>
            </form>
          )}
          {step === "done" && (
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="font-bold text-lg">Signup Complete!</div>
              <div className="text-slate-600 mt-2">
                You can now{" "}
                <Link href="/login" className="text-blue-600 underline">
                  sign in
                </Link>
                .
              </div>
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
            onClick={handleGoogleSignup}
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
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}