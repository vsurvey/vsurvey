import { Button } from "@/components/ui/button";
import { IoIosArrowDown } from "react-icons/io";
import { Crown, User } from "lucide-react";
import { useState } from "react";

const TopBar = ({
  setActiveTab,
  onLogout,
  onProfileEdit,
  isSuperAdmin = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  profile = null,
}) => {
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const menuItems = isSuperAdmin
    ? [
        { id: "clients", label: "Create Clients" },
        { id: "results", label: "Survey Results" },
      ]
    : [
        { id: "Users", label: "Create Users" },
        { id: "Questions", label: "Create Questions" },
        { id: "surveys", label: "Create Survey" },
        { id: "assignuser", label: "Assign User" },
        { id: "results", label: "Survey Results" },
      ];
  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
            </div>
          </button>
          <h1 className="text-gray-900">
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-semibold">
              V-Survey
            </span>
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-light text-gray-600 ml-1">
              Portal
            </span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
          {!isSuperAdmin && (
            <Button
              onClick={() => setActiveTab("surveys")}
              className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm px-3 sm:px-4 lg:px-6 py-2 sm:py-3 font-medium shadow-sm"
            >
              <span className="hidden sm:inline">+ Create Survey</span>
              <span className="sm:hidden">+ Survey</span>
            </Button>
          )}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                  isSuperAdmin
                    ? "bg-gray-100 border-gray-300"
                    : profile?.profileImage
                    ? "bg-transparent border-gray-300"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                {isSuperAdmin ? (
                  <User className="w-5 h-5 text-gray-600" />
                ) : profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <IoIosArrowDown className="text-gray-600" />
            </button>
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold text-gray-900">
                    {isSuperAdmin ? "Super Admin" : profile?.name || "User"}
                  </p>
                  {/* {!isSuperAdmin && profile?.email && (
                    <p className="text-xs text-gray-500 mt-1">{profile.email}</p>
                  )} */}
                </div>
                {!isSuperAdmin && (
                  <button
                    onClick={() => {
                      onProfileEdit && onProfileEdit();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen && setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 text-sm text-gray-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default TopBar;