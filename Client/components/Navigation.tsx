import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Plus, Settings, Video } from "lucide-react";

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <span className="ml-2 text-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                VidNotes
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-6">
            <Link
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                ${
                  isActive("/dashboard")
                    ? "text-white bg-gray-700"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
            >
              <Video className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                ${
                  isActive("/")
                    ? "text-white bg-gray-700"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Video
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
