import { useState, useEffect } from 'react'

interface Profile {
  id: string
  email: string
  role: 'tutora' | 'admin'
  full_name: string
  created_at: string
}

// Usuarios predefinidos
const PREDEFINED_USERS = [
  { username: 'Admin', password: '201931', role: 'admin', full_name: 'Administrador' },
  { username: 'Pastora', password: '201931', role: 'admin', full_name: 'Rocio Palma' },
  { username: 'Sgalindo', password: 'S2025', role: 'tutora', full_name: 'Sandra Galindo' },
  { username: 'Kromero', password: 'K2025', role: 'tutora', full_name: 'Katty Romero' },
  { username: 'Egarcia', password: 'E2025', role: 'tutora', full_name: 'Esperanza Garcia' },
  { username: 'Lcombariza', password: 'L2025', role: 'tutora', full_name: 'Luz Marina Combariza' },
  { username: 'Gquintero', password: 'G2025', role: 'tutora', full_name: 'Gina Quintero' }
]

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setProfile({
          id: userData.username,
          email: userData.username + '@cdi660.com',
          role: userData.role as 'tutora' | 'admin',
          full_name: userData.full_name,
          created_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (username: string, password: string) => {
    console.log('Attempting login with:', username, password)
    
    const user = PREDEFINED_USERS.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    )
    
    console.log('Found user:', user)
    
    if (user) {
      const userData = {
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
      
      try {
        localStorage.setItem('currentUser', JSON.stringify(userData))
        
        const profileData = {
          id: user.username,
          email: user.username + '@cdi660.com',
          role: user.role as 'tutora' | 'admin',
          full_name: user.full_name,
          created_at: new Date().toISOString()
        }
        
        setUser(userData)
        setProfile(profileData)
        
        console.log('Login successful')
        console.log('User set:', userData)
        console.log('Profile set:', profileData)
        
        return { error: null }
      } catch (error) {
        console.error('Error saving user data:', error)
        return { error: { message: 'Error al guardar datos de usuario' } }
      }
    } else {
      console.log('Invalid credentials')
      return { error: { message: 'Usuario o contraseña incorrectos' } }
    }
  }

  const signOut = () => {
    localStorage.removeItem('currentUser')
    setUser(null)
    setProfile(null)
    window.location.reload() // Forzar recarga para mostrar login
  }

  const isAdmin = profile?.role === 'admin'
  const isTutora = profile?.role === 'tutora'

  return {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin,
    isTutora
  }
}