import Signup from "./authentication/Signup";
import { useAuth } from "../contexts/AuthContext";
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Profile from "./authentication/Profile";
import Login from "./authentication/Login";
import ForgotPassword from "./authentication/ForgotPassword";
import UpdateProfile from "./authentication/UpdateProfile";
import Dashboard from "./google-drive/Dashboard";



function App() {
  const { currentUser } = useAuth()
  return (

    <HashRouter>



      <Routes>
        {/* Drive */}
        <Route path="/" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/folder/:folderId" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/search/:query" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/favorites" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />


        {/* Profile */}
        <Route path="/user" element={currentUser ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/update-profile" element={currentUser ? <UpdateProfile /> : <Navigate to="/login" />} />
        {/* Auth */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/tagged/:filterTagId" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>


    </HashRouter>




  );
}

export default App;
