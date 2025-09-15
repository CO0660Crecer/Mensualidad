import React, { useState } from 'react'
import { Eye, EyeOff, Rocket, Star } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function AuthForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña')
      return
    }
    
    setLoading(true)
    setError('')
    console.log('Form submitted with:', username, password)

    try {
      const { error } = await signIn(username, password)
      console.log('SignIn result:', { error })
      if (error) {
        setError(error.message)
      } else {
        console.log('Login successful, should redirect now')
      }
    } catch (err: any) {
      setError('Error de conexión. Intenta nuevamente.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo púrpura espacial */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        {/* Estrellas animadas */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              <Star className="w-1 h-1 text-white opacity-60" />
            </div>
          ))}
        </div>
        
        {/* Planetas decorativos */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-600 rounded-full opacity-30 blur-sm"></div>
        <div className="absolute bottom-32 left-16 w-20 h-20 bg-indigo-500 rounded-full opacity-40 blur-sm"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-pink-400 rounded-full opacity-50"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Tarjeta de login */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* Decoración superior */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"></div>
            
            {/* Cohete decorativo */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl rotate-12 flex items-center justify-center shadow-lg">
              <Rocket className="w-8 h-8 text-white transform -rotate-12" />
            </div>

            {/* Header */}
            <div className="text-center mb-8 pt-4">
              {/* Logo CDI 660 */}
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <img 
                  src="/public/CDI660 BBB.png" 
                  alt="CDI 660 Logo" 
                  className="w-full h-full object-contain rounded-full shadow-lg"
                />
              </div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                LOGIN
              </h1>
              <p className="text-purple-500 font-medium text-sm tracking-wider">
                LANDING PAGE
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors bg-gray-50 text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors bg-gray-50 text-gray-700 placeholder-gray-400 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>


              {/* Botón de login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>

          </div>

          {/* Información de usuarios de prueba */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white text-xs">
            <h3 className="font-bold mb-2 text-center">Usuarios de Prueba:</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="font-semibold">Administradores:</p>
                <p>Admin / 201931</p>
                <p>Pastora / 201931</p>
              </div>
              <div>
                <p className="font-semibold">Tutoras:</p>
                <p>Sgalindo / S2025</p>
                <p>Kromero / K2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}