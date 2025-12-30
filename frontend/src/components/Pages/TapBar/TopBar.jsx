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
  activeTab,
  profileSetupComplete = true,
}) => {
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const handleMobileTabClick = (tabId) => {
    console.log('Mobile tab clicked:', tabId); // Debug log
    if (!isSuperAdmin && !profileSetupComplete && tabId !== "profile") {
      setShowPopup(true)
      setTimeout(() => setShowPopup(false), 2000)
      return
    }
    if (setActiveTab) {
      setActiveTab(tabId)
    }
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }
  // const [showPopup, setShowPopup] = useState(false);
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
        { id: "profile", label: "Profile" },
      ];
  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() =>
              setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)
            }
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
            </div>
          </button>
          <h1 className="text-gray-800">
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">
              V-Survey
            </span>
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extralight ml-1">
              Portal
            </span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 sm:space-x-3 hover:bg-gray-50 rounded-lg p-2"
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden ${
                  isSuperAdmin
                    ? "bg-gray-600"
                    : profile?.profile_photo || profile?.profileImage
                      ? "bg-transparent"
                      : "bg-gray-600"
                }`}
              >
                {isSuperAdmin ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : profile?.profile_photo || profile?.profileImage ? (
                  <img
                    src={profile?.profile_photo || profile?.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              {(isSuperAdmin || profile?.name) && (
                <span className="hidden sm:inline text-gray-700 font-medium text-sm">
                  {isSuperAdmin ? "Super Admin" : profile?.name}
                </span>
              )}
              <IoIosArrowDown className="text-base" />
            </button>
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border z-50 mx-2 sm:mx-0">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden ${
                      isSuperAdmin
                        ? "bg-gray-600"
                        : (profile?.profile_photo || profile?.profileImage)
                        ? "bg-transparent"
                        : "bg-gray-600"
                    }`}>
                      {isSuperAdmin ? (
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : (profile?.profile_photo || profile?.profileImage) ? (
                        <img
                          src={profile?.profile_photo || profile?.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {isSuperAdmin ? "Super Admin" : profile?.name || "User"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {isSuperAdmin ? "superadmin@vsurvey.com" : profile?.email || ""}
                      </p>
                    </div>
                  </div>
                  <hr className="mb-2 sm:mb-3" />
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(true);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg text-center justify-center relative z-50">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMobileTabClick(item.id);
              }}
              className={`w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 text-sm ${
                activeTab === item.id
                  ? "bg-gray-100 text-black font-medium border-r-4 border-black"
                  : "text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {showPopup && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-[60]">
          Please complete your profile setup first
        </div>
      )}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
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