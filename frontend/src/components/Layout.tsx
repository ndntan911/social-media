import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Don't show sidebar on auth pages
  const hideSidebarRoutes = ["/login", "/register", "/auth/callback"];
  const shouldHideSidebar = hideSidebarRoutes.some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(route),
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {!shouldHideSidebar && <Sidebar />}

      {/* Main Content */}
      <div
        className={`flex-1 ${!shouldHideSidebar ? "ml-64" : ""} transition-all duration-300`}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
