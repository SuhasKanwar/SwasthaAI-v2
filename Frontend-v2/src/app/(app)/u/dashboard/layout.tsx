import Sidebar from "@/components/Sidebar";
import { AlertCircle, BotIcon, CalendarCheck, Search } from "lucide-react";

const sidebarLinks = [
  {
    name: "Chatbot",
    icon: <BotIcon />,
    link: "/u/dashboard/chatbot",
  },
  {
    name: "MedAlerts",
    icon: <AlertCircle />,
    link: "/u/dashboard/med-alerts",
  },
  {
    name: "Find Doctors",
    icon: <Search />,
    link: "/u/dashboard/find-doctors",
  },
  {
    name: "My Appointments",
    icon: <CalendarCheck />,
    link: "/u/dashboard/book-appointments",
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