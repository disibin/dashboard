'use client'
import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const Context = createContext();

const ContextProvider = ({ children }) => {
  const router = useRouter();
  const [sidebar, setSidebar] = useState(false);
  const [dashboardSidebar, setDashboardSidebar] = useState(true);
  const [userSidebar, setUserSidebar] = useState(true);
  const [userData, setUserData] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const isLoggedIn = !!userData;

  // Fetch regular user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/user/me', {
          validateStatus: (status) => status < 500
        });
        if (response.data?.success && response.data?.data) {
          setUserData(response.data.data);
        } else {
          setUserData(null);
        }
      } catch (error) {
        setUserData(null);
      }
    };
    fetchUser();
  }, []);

  // Fetch staff member session
  useEffect(() => {
    const fetchStaffUser = async () => {
      try {
        const response = await axios.get('/api/staff/me', {
          validateStatus: (status) => status < 500
        });
        if (response.data?.success && response.data?.data) {
          setStaffData(response.data.data);
        } else {
          setStaffData(null);
        }
      } catch (error) {
        setStaffData(null);
      }
    };
    fetchStaffUser();
  }, []);

  const logout = async () => {
    try {
      await axios.post('/api/user/logout');
      setUserData(null);
      window.location.replace('/user-auth/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const staffLogout = async () => {
    try {
      await axios.post('/api/staff/logout');
    } catch (error) {
      console.error("Staff logout request failed:", error);
    } finally {
      setStaffData(null);
      window.location.replace('/staff-auth/login');
    }
  };

  const contextValues = {
    sidebar, setSidebar,
    userSidebar, setUserSidebar,
    dashboardSidebar, setDashboardSidebar,
    userData, setUserData,
    staffData, setStaffData,
    staffData: staffData, setStaffData: setStaffData,
    isLoggedIn, logout,
    staffLogout, staffLogout: staffLogout
  };

  return (
    <Context.Provider value={contextValues}>
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;
