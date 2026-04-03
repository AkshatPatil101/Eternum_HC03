import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MapUI from './components/Map'
import MapUI3D from './components/Map3D'
import './App.css'
import Landing from '../pages/Landing/Landing'
import LoginSelection from '../pages/LoginSelection/LoginSelection'
import Dashboard from '../pages/Dashboard/Dashboard'
import HospitalAdmin from '../pages/HospitalAdmin/HospitalAdmin'
import EmtInterface from '../pages/EmtInterface/EmtInterface'
import MassCasualtyMode from '../pages/MassCasualtyMode/MassCasualtyMode'
import ComingSoon from '../pages/ComingSoon/ComingSoon'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/select" element={<LoginSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hospital-admin" element={<HospitalAdmin />} />
        <Route path="/emt" element={<EmtInterface />} />
        <Route path="/mass-casualty" element={<MassCasualtyMode />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
