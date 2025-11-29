import { FaHome } from "react-icons/fa";
import { TiShoppingCart } from "react-icons/ti";
import { IoSettings } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/home", label: "Home", icon: <FaHome size={20} /> },
    { path: "/events", label: "events", icon: <TiShoppingCart size={20} /> },
    { path: "/settings", label: "Settings", icon: <IoSettings size={20} /> },
  ];

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-lg p-2 flex items-center justify-around w-[100%] max-w-md">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center py-1 rounded-full px-8 transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md scale-105"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                {item.icon}
              </div>
              <span
                className={`text-xs mt-1 font-medium transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-70"
                }`}
              >
                {item.label}
              </span>

              {/* Active Dot */}
              {isActive && (
                <div className="absolute -top-1 w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default Navigation;
