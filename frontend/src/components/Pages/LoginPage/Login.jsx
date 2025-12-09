import { useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import loginImage from '../../../assets/loginImage.png'
import authService from '../../../services/authService'
import { activateClientAdmin, isClientAdminPending, clientAdminExists, isClientAdminActive, isClientAdminDeactivated, needsProfileSetup } from '../../../services/clientStatusService'
import { activateUser, isUserPending, userExists } from '../../../services/userStatusService'
import { notifyClientStatusChange } from '../../../services/superAdminNotification'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)
    
    try {
      // Check for super admin credentials
      if (email === 'superadmin@vsurvey.com' && password === 'superadmin123') {
        localStorage.setItem('currentSuperAdmin', JSON.stringify({ email: email }))
        onLogin('superadmin')
        return
      }

      // Check if client admin exists
      const clientExists = await clientAdminExists(email)

      // Use Firebase authentication for client admins
      const result = await authService.signIn(email, password)
      
      if (!result.success) {
        setErrorMessage('Invalid email or password')
        setTimeout(() => setErrorMessage(''), 5000)
        setIsLoading(false)
        return
      }
      
      if (result.success) {
        // Store fresh token for API calls
        const token = await result.user.getIdToken(true)
        localStorage.setItem('firebaseToken', token)
        
        // Skip activation if this is during user creation process
        if (window.isCreatingUser) {
          console.log('User creation in progress, skipping activation')
          return
        }
        
        if (clientExists) {
          // Check if client admin is deactivated
          const isDeactivated = await isClientAdminDeactivated(email)
          
          if (isDeactivated) {
            setErrorMessage('Account Deactivated')
            setIsLoading(false)
            return
          }
          
          // Check if client admin is pending and activate them
          const isPending = await isClientAdminPending(email)
          
          if (isPending) {
            console.log('DEBUG: Attempting to activate client admin:', email)
            const activated = await activateClientAdmin(email)
            console.log('DEBUG: Client admin activation result:', activated)
            
            if (activated) {
              console.log('✅ Client admin activated successfully:', email)
              // Get fresh token after activation
              const freshToken = await result.user.getIdToken(true)
              localStorage.setItem('firebaseToken', freshToken)
            } else {
              console.log('❌ Failed to activate client admin:', email)
            }
          }
        } else {
          // Check if regular user exists in our database
          console.log('DEBUG: Checking if regular user exists:', email)
          const regularUserExists = await userExists(email)
          console.log('DEBUG: Regular user exists:', regularUserExists)
          
          if (regularUserExists) {
            // Regular users cannot log in on web
            setErrorMessage('This account is for mobile app only. Please use the mobile app to log in.')
            setTimeout(() => setErrorMessage(''), 5000)
            setIsLoading(false)
            return
          } else {
            console.log('❌ User not found in database:', email)
          }
        }
        
        // Wait a moment for Firebase auth state to update
        setTimeout(async () => {
          // Determine user type based on database presence
          if (clientExists) {
            // Check if profile setup is needed using Firebase data
            const profileSetupNeeded = await needsProfileSetup(email)
            onLogin('client', { 
              email, 
              isFirstTime: profileSetupNeeded, 
              profile: null 
            })
          } else {
            // Regular user login - redirect to user dashboard or survey interface
            onLogin('user', { 
              email, 
              isFirstTime: false, 
              profile: null 
            })
          }
        }, 1500)
      }
    } catch (error) {
      setErrorMessage('Invalid email or password')
      setTimeout(() => setErrorMessage(''), 5000)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">V-Survey</h1>
          <p className="text-slate-300 text-lg">Professional survey management platform</p>
        </div>
        <div className="space-y-6">
          <img src={loginImage} alt="Survey Platform" className="rounded-lg shadow-xl" />
          <p className="text-slate-400 text-sm">Trusted by leading enterprises worldwide</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Please enter your credentials to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-gray-300 focus:border-slate-900 focus:ring-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-gray-300 focus:border-slate-900 focus:ring-slate-900"
              />
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login