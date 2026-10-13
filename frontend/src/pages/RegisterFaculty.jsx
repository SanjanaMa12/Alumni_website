import { Navigate } from 'react-router-dom'
import FacultyGrid from '../components/FacultyGrid.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterFaculty() {
  const { user } = useAuth()
  if (user) return <Navigate to="/profile" replace />

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-maroon">Select Your Faculty</h1>
        <p className="mt-2 text-gray-500">Pick your faculty to proceed to registration</p>
      </div>
      <FacultyGrid />
    </section>
  )
}
