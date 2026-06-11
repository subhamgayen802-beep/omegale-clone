import {  Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import React from "react";
import Login from "./pages/login";
import Signup from "./pages/signUp";
import HomePage from "./pages/homePage";  
import AdminPage from "./admin/adminPage";


export default function App() {

 
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }



  return (

      <Routes>

      <Route path="/" element={isAuthenticated ?<HomePage></HomePage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>

      <Route
  path="/admin"
  element={
    isAuthenticated && user?.role === "admin"
      ? <AdminPage />
      : <Navigate to="/" />
  }
/>

      </Routes>
  
  );
}