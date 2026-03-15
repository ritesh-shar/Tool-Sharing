/* eslint-disable react-hooks/exhaustive-deps */

'use client'

import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    useEffect(() => {   
         const storedUser = localStorage.getItem("user");
        if(storedUser){ setUser(JSON.parse(storedUser));}
    }, []); 
    
const login = (userData) => {
    setUser(userData);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData));
};

const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

return (
    <AuthContext.Provider value={{user, login, logout}}>
        {children}
    </AuthContext.Provider>
)

};

export const useAuth = () => useContext(AuthContext);
