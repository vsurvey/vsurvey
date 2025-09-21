const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "Users", label: "Create Users" },
    { id: "Questions", label: "Create Questions" },
    { id: "surveys", label: "Create Survey" },
    { id: "assignuser", label: "Assign User" },
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
            title={item.label}
          >
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar