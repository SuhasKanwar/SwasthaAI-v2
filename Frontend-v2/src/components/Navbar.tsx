"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "@/components/ui/resizable-navbar";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { name: "Features", link: "/#features" },
  { name: "Benefits", link: "/#benefits" },
  { name: "Testimonials", link: "/#testimonials" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoggedIn, logout, token } = useAuth();
  const router = useRouter();
  const { role } = useAuth();

  const handleLogout = async () => {
    try {
      await axios.post(
        `${
          process.env.NEXT_PUBLIC_USER_BACKEND_BASE_URL || "http://localhost:8050"
        }/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (e) {
      toast.error("Logout failed. Please try again later.");
    }
    logout();
    router.push("/login");
  };

  return (
    <ResizableNavbar className="top-6">
      <NavBody>
        <Link
          className="flex items-center space-x-2 cursor-pointer z-50"
          href="/"
        >
          <Logo />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            SwasthaAI
          </span>
        </Link>
        <NavItems items={NAV_ITEMS} />
        <div className="flex items-center space-x-4 z-50">
          {isLoggedIn ? (
            <>
              <Link href={role === "patient" ? "/u/dashboard" : "/d/dashboard"}>
                  <Button
                    variant="outline"
                    className="w-full text-slate-600 hover:text-blue-600 cursor-pointer"
                  >
                    Dashboard
                  </Button>
                </Link>
              <Button
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 cursor-pointer"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-blue-600 cursor-pointer"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 cursor-pointer">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </NavBody>
      <MobileNav>
        <MobileNavHeader>
          <Link className="flex items-center space-x-2 cursor-pointer" href="/">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              SwasthaAI
            </span>
          </Link>
          <MobileNavToggle
            isOpen={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          />
        </MobileNavHeader>
        <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.link}
              className="block px-4 py-2 text-lg text-neutral-700 hover:text-blue-600"
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="flex flex-col gap-2 mt-4 w-full">
            {isLoggedIn ? (
              <>
                <Link href={role === "patient" ? "/u/dashboard" : "/d/dashboard"}>
                  <Button
                    variant="outline"
                    className="w-full text-slate-600 hover:text-blue-600 cursor-pointer"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 cursor-pointer"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" passHref legacyBehavior>
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full text-slate-600 hover:text-blue-600 cursor-pointer"
                    >
                      Login
                    </Button>
                  </div>
                </Link>
                <Link href="/signup" passHref legacyBehavior>
                  <div>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 cursor-pointer">
                      Sign Up
                    </Button>
                  </div>
                </Link>
              </>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
};

export default Navbar;