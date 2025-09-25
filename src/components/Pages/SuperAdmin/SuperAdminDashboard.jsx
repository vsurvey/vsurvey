import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TopBar from "../TapBar/TopBar";
import Sidebar from "../SideBar/Sidebar";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('admins');
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  const [clientAdmins, setClientAdmins] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedAdmins = localStorage.getItem('clientAdmins');
    if (savedAdmins) {
      setClientAdmins(JSON.parse(savedAdmins));
    }
  }, []);

  const saveAdminsToStorage = (updatedAdmins) => {
    localStorage.setItem('clientAdmins', JSON.stringify(updatedAdmins));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setMessage('Please fill in all required fields');
      return;
    }

    const newAdmin = {
      id: Date.now(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      isActive: true
    };

    const updatedAdmins = [newAdmin, ...clientAdmins];
    setClientAdmins(updatedAdmins);
    saveAdminsToStorage(updatedAdmins);
    setFormData({ fullName: '', email: '' });
    setMessage('Survey User created successfully!');
    
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleAdminStatus = (adminId) => {
    const updatedAdmins = clientAdmins.map(admin => 
      admin.id === adminId ? { ...admin, isActive: !admin.isActive } : admin
    );
    setClientAdmins(updatedAdmins);
    saveAdminsToStorage(updatedAdmins);
  };

  const handleLogout = () => {
    window.location.reload();
  };

  const renderContent = () => {
    return (
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4 md:mb-6">
            <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">Super Admin Dashboard</h1>
            <h1 className="text-sm md:text-base lg:text-lg text-gray-400 font-extralight mt-1">Manage client administrators</h1>
          </div>
          
          <Card className="shadow-lg rounded-none">
            <CardHeader>
              <CardTitle className="text-base md:text-lg lg:text-xl text-gray-800">Client Admin Creation Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-black mb-2">FULL NAME</label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Enter full name"
                    required
                    className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-black mb-2">EMAIL</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                    className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700 p-4 text-sm"
                >
                  Create Client Admin
                </Button>
              </form>
              {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <AdminsList clientAdmins={clientAdmins} toggleAdminStatus={toggleAdminStatus} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar setActiveTab={setActiveTab} onLogout={handleLogout} />
      <SuperAdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="lg:ml-64 pt-16 sm:pt-20 md:pt-24 p-4 sm:p-6 md:p-8 mt-10">
        {renderContent()}
      </main>
    </div>
  );
}

const SuperAdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'admins', label: 'Client Admins' },
    { id: 'settings', label: 'Settings' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="hidden lg:block w-64 bg-white shadow-lg h-screen fixed left-0 top-0 pt-20 z-40">
      <nav className="mt-8">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-start px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
              activeTab === item.id ? 'bg-gray-100 border-r-2 border-black text-black font-medium' : 'text-gray-700'
            }`}
          >
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const AdminsList = ({ clientAdmins, toggleAdminStatus }) => {
  return (
    <div className="lg:w-80 lg:shadow-lg lg:h-screen lg:fixed lg:right-0 lg:top-0 lg:z-40 lg:bg-white lg:overflow-y-auto w-full bg-transparent">
      <div className="lg:p-4 lg:mt-20 p-4 space-y-3">
        <div className="mb-3">
          <CardTitle className="text-base lg:text-lg font-semibold text-gray-800 lg:text-center">
            Client Admins
          </CardTitle>
        </div>
        <CardContent className="p-0">
          <div className="space-y-2 lg:space-y-3">
            {clientAdmins.length === 0 ? (
              <div className="p-3 lg:p-4 border border-gray-300 rounded-lg bg-white">
                <p className="text-gray-500 text-xs">
                  No users created yet
                </p>
              </div>
            ) : (
              clientAdmins.map((admin) => (
                <div key={admin.id} className="p-3 lg:p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-800 text-xs lg:text-sm break-words mb-2">
                    {admin.fullName}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-1">
                      <span className={`text-xs break-words flex-1 ${
                        admin.isActive ? "text-gray-600" : "line-through text-gray-400"
                      }`}>
                        {admin.email}
                      </span>
                      <Button
                        variant={admin.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAdminStatus(admin.id)}
                        className="text-xs ml-2 px-2 py-1"
                      >
                        {admin.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
}
