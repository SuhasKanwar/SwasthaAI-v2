import { Heart } from "lucide-react";

export default function Logo() {
  return (
    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
      <Heart className="w-6 h-6 text-white" />
    </div>
  );
}