import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.jpg";
import { logoutSuccess } from "../Redux/userSlice";

//URL
import BASE_URL from "../Utils/config";

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user details from Redux store
  const user = useSelector((state) => state.user?.user);
  const uName = user ? `${user.firstName} ${user.lastName}` : "Guest";

  // Handle Logout
  const handleLogout = async () => {
    try {
      await axios.get(`${BASE_URL}/api/auth/logout`, {
        withCredentials: true,
      });

      // Clear Redux state & localStorage
      setDropdownOpen(false);
      dispatch(logoutSuccess());
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  //Use Ref for Closing Dropdowns
  const dropdownRef = useRef();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 flex justify-center z-50 backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border-b border-gray-200/50 dark:border-neutral-700/50 supports-backdrop-blur:bg-white/80">
      <header className="w-full max-w-[1800px] mx-auto px-6 py-4 flex justify-between items-center">
        {/* Enhanced Logo Section */}
        <div className="flex items-center gap-4 group cursor-pointer min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={logo}
              className="relative h-14 w-16 rounded-xl border-2 border-white/20 shadow-lg"
              alt="Logo"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                wako
              </span>
              <span className="text-gray-500 dark:text-gray-400 mx-2">-</span>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                MOSHA
              </span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              Welcome back, {user?.userName || "User"}!
            </p>
          </div>
        </div>

        {/* Enhanced User Dropdown - More Spacious */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white dark:bg-neutral-800 border border-gray-300/50 dark:border-neutral-600/50 cursor-pointer hover:shadow-xl hover:border-blue-400/50 dark:hover:border-purple-500/50 transition-all duration-300 min-w-[200px]"
          >
            {user?.photo ? (
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30"></div>
                <img
                  src={`http://localhost:4004/pfps/${user.photo}`}
                  className="relative h-12 w-12 rounded-full object-cover border-2 border-white/20 shadow-md"
                  alt="User"
                />
              </div>
            ) : (
              <div className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-md flex-shrink-0">
                {user?.userName?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                {uName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {user?.title || "Member"}
              </p>
            </div>

            <div
              className={`transform transition-transform duration-300 flex-shrink-0 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-[380px] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg">
              {/* Enhanced Profile Card */}
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-4 mb-6">
                  {user?.photo ? (
                    <img
                      src={`http://localhost:4004/pfps/${user.photo}`}
                      className="h-16 w-16 rounded-full object-cover border-2 border-white/20 shadow-lg flex-shrink-0"
                      alt="User"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full font-bold text-xl shadow-lg flex-shrink-0">
                      {user?.userName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1 truncate">
                      {user?.userName || "User"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base truncate">
                      {user?.email || "No email provided"}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                      {user?.title || "Platform Member"}
                    </p>
                  </div>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/30">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Member Since
                    </div>
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      2024
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700/30">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      Status
                    </div>
                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                      Active
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Logout Button */}
              <div className="p-4">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transform hover:scale-[1.02] hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-base"
                >
                  <svg
                    className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
