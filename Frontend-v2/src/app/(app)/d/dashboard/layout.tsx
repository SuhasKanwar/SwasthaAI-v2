import Sidebar from "@/components/Sidebar";
import { User, Building, CalendarCheck, Home, FileText } from "lucide-react";

const sidebarLinks = [
  {
    name: "Dashboard",
    icon: <Home />,
    link: "/d/dashboard",
  },
  {
    name: "My Profile",
    icon: <User />,
    link: "/d/dashboard/profile",
  },
  {
    name: "My Clinics",
    icon: <Building />,
    link: "/d/dashboard/clinics",
  },
  {
    name: "Appointments",
    icon: <CalendarCheck />,
    link: "/d/dashboard/appointments",
  },
  {
    name: "Health Vault",
    icon: <FileText />,
    link: "/d/dashboard/health-vault",
  }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Sidebar items={sidebarLinks} />
      {children}
    </main>
  );
}