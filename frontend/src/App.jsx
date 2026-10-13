import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import People from './pages/People.jsx'
import Events from './pages/Events.jsx'
import Projects from './pages/Projects.jsx'
import Directory from './pages/Directory.jsx'
import Login from './pages/Login.jsx'
import RegisterFaculty from './pages/RegisterFaculty.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="people" element={<People />} />
        <Route path="events" element={<Events />} />
        <Route path="projects" element={<Projects />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<RegisterFaculty />} />
        <Route path="register/:faculty" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="directory" element={<Directory />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
