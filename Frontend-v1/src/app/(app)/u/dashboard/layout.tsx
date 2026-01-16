import Sidebar from "@/components/Sidebar";
import { IconHome } from "@tabler/icons-react";
import { AlertCircle, BotIcon, HelpCircle } from "lucide-react";
import { MdAddCircle } from "react-icons/md";

const sidebarLinks = [
    {
        name: "Home",
        icon: <IconHome />,
        link: "/u/dashboard/home",
    },
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
    },
    {
        name: "Help",
        icon: <HelpCircle />,
        link: "/u/dashboard/help",
    },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Sidebar items={sidebarLinks} />
      {children}
    </main>
  );
}