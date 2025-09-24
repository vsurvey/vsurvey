import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TopBar from "../TapBar/TopBar";
import Sidebar from "../SideBar/Sidebar";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('admins');
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [clientAdmins, setClientAdmins] = useState([
    { id: 1, full_name: 'John Client', email: 'john@client.com' },
    { id: 2, full_name: 'Sarah Admin', email: 'sarah@admin.com' },
    { id: 3, full_name: 'Mike Manager', email: 'mike@manager.com' }
  ]);

  const handleCreateAdmin = () => {
    if (!fullName || !email) {
      alert('Please enter full name and email.');
      return;
    }

    const newAdmin = {
      id: clientAdmins.length + 1,
      full_name: fullName,
      email: email
    };

    setClientAdmins([...clientAdmins, newAdmin]);
    setFullName("");
    setEmail("");
    alert('Client admin created successfully!');
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
              <CardTitle className="text-base md:text-lg lg:text-xl text-gray-800">Create Client Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-black mb-2">FULL NAME</label>
                  <Input
                    type="text"
                    placeholder="Enter client admin name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-black mb-2">EMAIL ADDRESS</label>
                  <Input
                    type="email"
                    placeholder="Enter client admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                  />
                </div>
                <Button 
                  onClick={handleCreateAdmin}
                  className="w-full bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700 p-4 text-sm"
                >
                  Create Client Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <AdminsList clientAdmins={clientAdmins} />
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

const AdminsList = ({ clientAdmins }) => {
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
                <p className="text-gray-500 text-xs">No client admins yet</p>
              </div>
            ) : (
              clientAdmins.map((admin) => (
                <div key={admin.id} className="p-3 lg:p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-800 text-xs lg:text-sm break-words">
                    {admin.full_name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 break-words">
                    {admin.email}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
}
