import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SurveyPersonnel = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  })
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const savedUsers = localStorage.getItem('surveyUsers')
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }
  }, [])

  const saveUsersToStorage = (updatedUsers) => {
    localStorage.setItem('surveyUsers', JSON.stringify(updatedUsers))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setMessage('Please fill in all required fields')
      return
    }

    const newUser = {
      id: Date.now(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      isActive: true
    }

    const updatedUsers = [newUser, ...users]
    setUsers(updatedUsers)
    saveUsersToStorage(updatedUsers)
    setFormData({ fullName: '', email: '' })
    setMessage('User created successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const toggleUserStatus = (userId) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    )
    setUsers(updatedUsers)
    saveUsersToStorage(updatedUsers)
  }


  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 xl:px-5 xl:ml-10">
      <div className="flex-1 min-w-0">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">Survey Users Management</h1>
          <h1 className="text-sm md:text-base lg:text-lg text-gray-400 font-extralight mt-1">Create and manage survey users</h1>
        </div>
        <Card className="shadow-lg rounded-none">
          <CardHeader>
            <CardTitle className="text-base md:text-lg lg:text-xl text-gray-800">User Creation Form</CardTitle>
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
                Create Survey User
              </Button>
            </form>
            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <div className="lg:w-80 lg:shadow-lg lg:h-screen lg:fixed lg:right-0 lg:top-0 lg:z-40 lg:bg-white lg:overflow-y-auto w-full bg-transparent">
          <div className="lg:p-4 lg:mt-20 p-4 space-y-3">
            <div className="mb-3">
              <CardTitle className="text-base lg:text-lg font-semibold text-gray-800 lg:text-center">
                Survey Users
              </CardTitle>
            </div>
            <CardContent className="p-0">
              <div className="space-y-2 lg:space-y-3">
                {users.length === 0 ? (
                  <div className="p-3 lg:p-4 border border-gray-300 rounded-lg bg-white">
                    <p className="text-gray-500 text-xs">
                      No users created yet
                    </p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="p-3 lg:p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <h4 className="font-medium text-gray-800 text-xs lg:text-sm break-words mb-2">
                        {user.fullName}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between py-1">
                          <span className={`text-xs break-words flex-1 ${
                            user.isActive ? "text-gray-600" : "line-through text-gray-400"
                          }`}>
                            {user.email}
                          </span>
                          <Button
                            variant={user.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleUserStatus(user.id)}
                            className="text-xs ml-2 px-2 py-1"
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
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
      </div>
    </div>
  )
}

export default SurveyPersonnel
