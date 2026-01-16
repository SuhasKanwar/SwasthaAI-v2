import Sidebar from "@/components/Sidebar";
import { AlertCircle, BotIcon } from "lucide-react";
import { MdAddCircle } from "react-icons/md";

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
        name: "Book Appointment",
        icon: <MdAddCircle />,
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