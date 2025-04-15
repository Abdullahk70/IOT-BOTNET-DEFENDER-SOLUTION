import React, { useState, useEffect, useRef } from "react";
import {
  FiMenu,
  FiX,
  FiActivity,
  FiLogOut,
  FiUser,
  FiHome,
  FiUpload,
  FiChevronDown,
  FiHelpCircle,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onFYPNavigation?: (view: any) => void;
  currentView?: any;
  views?: any;
}

const Header: React.FC<HeaderProps> = ({
  onFYPNavigation,
  currentView,
  views,
}) => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [fypDropdownOpen, setFypDropdownOpen] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle scroll event to change header style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigation = (view: any) => {
    if (onFYPNavigation) {
      onFYPNavigation(view);
    }
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const toggleFypDropdown = () => {
    setFypDropdownOpen(!fypDropdownOpen);
  };

  const navItems = [
    {
      name: "Home",
      view: views?.HOME,
      active: currentView === views?.HOME,
      icon: <FiHome />,
    },
    {
      name: "Analysis",
      view: views?.UPLOAD,
      active: currentView === views?.UPLOAD,
      icon: <FiUpload />,
    },
    {
      name: "FAQ",
      view: views?.FYP_FAQ,
      active: currentView === views?.FYP_FAQ,
      icon: <FiHelpCircle />,
    },
    {
      name: "About",
      view: views?.ABOUT,
      active: currentView === views?.ABOUT,
      icon: <FiInfo />,
    },
  ];

  const fypNavItems = [
    {
      name: "Data Upload",
      view: views?.FYP_DATA_UPLOAD,
      active: currentView === views?.FYP_DATA_UPLOAD,
    },
    {
      name: "Normalization",
      view: views?.FYP_NORMALIZATION,
      active: currentView === views?.FYP_NORMALIZATION,
    },
    {
      name: "Feature Scaling",
      view: views?.FYP_FEATURE_SCALING,
      active: currentView === views?.FYP_FEATURE_SCALING,
    },
    {
      name: "Encoding",
      view: views?.FYP_ENCODING,
      active: currentView === views?.FYP_ENCODING,
    },
    {
      name: "Outlier Detection",
      view: views?.FYP_OUTLIER_DETECTION,
      active: currentView === views?.FYP_OUTLIER_DETECTION,
    },
    {
      name: "Visualization",
      view: views?.FYP_VISUALIZATION,
      active: currentView === views?.FYP_VISUALIZATION,
    },
    {
      name: "Data Splitting",
      view: views?.FYP_DATA_SPLITTING,
      active: currentView === views?.FYP_DATA_SPLITTING,
    },
    {
      name: "Export Data",
      view: views?.FYP_EXPORT_DATA,
      active: currentView === views?.FYP_EXPORT_DATA,
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 h-16 z-30 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-white/80"
        }`}
        style={{ backdropFilter: scrolled ? "blur(8px)" : "none" }}
      >
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="mr-4 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>

            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleNavigation(views?.HOME)}
            >
              <div className="text-indigo-600 mr-2">
                <FiActivity className="w-6 h-6" />
              </div>
              <span className="text-black font-bold text-xl">NetGuardian</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar for all navigation */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* User profile */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-full p-2">
                  <FiUser className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {user?.username || "User"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email || "user@example.com"}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav>
                <ul className="space-y-1">
                  {/* Main navigation items */}
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <a
                        onClick={() => handleNavigation(item.view)}
                        className={`flex items-center px-4 py-3 rounded-md cursor-pointer ${
                          item.active
                            ? "bg-indigo-50 text-indigo-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </a>
                    </li>
                  ))}

                  {/* Feature Preprocessing dropdown */}
                  <li className="mt-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Feature Preprocessing
                    </div>
                    <button
                      onClick={toggleFypDropdown}
                      className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <span className="font-medium">Features</span>
                      <FiChevronDown
                        className={`transition-transform duration-200 ${
                          fypDropdownOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`mt-1 ${fypDropdownOpen ? "block" : "hidden"}`}
                    >
                      {fypNavItems.map((item) => (
                        <a
                          key={item.name}
                          onClick={() => handleNavigation(item.view)}
                          className={`block py-2 px-4 pl-8 text-sm rounded-md cursor-pointer ${
                            item.active
                              ? "bg-indigo-50 text-indigo-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Logout button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md"
              >
                <FiLogOut className="mr-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content spacing to account for fixed header */}
      <div className="h-16"></div>
    </>
  );
};

export default Header;
