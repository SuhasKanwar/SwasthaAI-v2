import Sidebar from "@/components/Sidebar";
import { IconHome } from "@tabler/icons-react";
import { AlertCircle, HelpCircle } from "lucide-react";
import { MdAddCircle } from "react-icons/md";

const sidebarLinks = [
    {
        name: "Home",
        icon: <IconHome />,
        link: "/d/home",
    },
    {
        name: "MedAlerts",
        icon: <AlertCircle />,
        link: "/d/dashboard/med-alerts",
    },
    {
        name: "Book Appointment",
        icon: <MdAddCircle />,
        link: "/d/dashboard/book-appointment",
    },
    {
        name: "Help",
        icon: <HelpCircle />,
        link: "/d/dashboard/help",
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