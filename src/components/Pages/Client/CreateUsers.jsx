import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Sidebar from "./AssignedSurveys"
import { supabase } from '../../../lib/supabaseClient'

const SurveyPersonnel = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    survey: ''
  })

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  // const surveys = ['Customer Satisfaction', 'Product Feedback', 'Market Research', 'Employee Survey']

  // const handleSubmit = (e) => {
  //   e.preventDefault()
  //   console.log('Personnel created:', formData)
  //   setFormData({ fullName: '', email: '', survey: '' })
  // }
  const handleLogin = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      
      if (error) throw error
      setMessage('Check your email for the login link!')
    } catch (error) {
      setMessage(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 xl:px-5 xl:ml-10">
      <div className="flex-1 min-w-0">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">Client Survey Users</h1>
          <h1 className="text-sm md:text-base lg:text-lg text-gray-400 font-extralight mt-1">Manage survey Users</h1>
        </div>
        <Card className="shadow-lg rounded-none">
          <CardHeader>
            <CardTitle className="text-base md:text-lg lg:text-xl text-gray-800">Add Survey Users</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
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
                <label className="block text-xs md:text-sm font-bold text-black mb-2">EMAIL ADDRESS</label>
                <Input
                  type="email"
                  value={email}
                  required={true}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700 p-4 text-sm"
                disabled={loading}
              >
                Create Survey Users
              </Button>
            </form>
            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full lg:w-100 lg:flex-shrink-0">
        <Sidebar />
      </div>
    </div>
  )
}

export default SurveyPersonnel
