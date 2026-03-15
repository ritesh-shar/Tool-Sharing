"use client";

import {useAuth} from "../context/AuthContext.jsx";
import { useRouter } from "next/navigation.js";
import {useTheme} from "../context/ThemeContext.jsx"

function Navbar(){
    const {user, logout} = useAuth();
    const {darkMode, toggleDarkMode} = useTheme();
    const router = useRouter();
    if(!user){
        return(
            <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 text-white">
                <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push("/Tools")}>Tool Sharing</h1>
                <div className="flex gap-4">
                <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/login")}>Login</button>
                <button className= "px-4 py-2 rounded bg-green-600 hover:bg-green-700" onClick={() => router.push("/register")}>Register</button>
                <button className="bg-gray-900 dark:bg-white text-white dark:text-black" onClick={toggleDarkMode}>{darkMode ? '☀️' : '🌙'}</button>
                </div>
            </nav>
        )
    }

    return(
        <>
      <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold cursor-pointer"  onClick={() => router.push('/tools')}>Tool Sharing</h1>
        <div className="flex gap-4 items-center">
        <span className="text-gray-300">Hello, {user.name}</span>
        <button className="px-3 py-2 rounded hover:bg-gray-700" onClick={() => router.push('/Tools')}>Browse Tools</button>
        <button className="px-3 py-2 rounded hover:bg-gray-700" onClick={() => router.push('/addTool')}>Add Tool</button>
        <button className="px-3 py-2 rounded hover:bg-gray-700" onClick={() => router.push('/myTools')}>My Tools</button>
        <button className="px-3 py-2 rounded hover:bg-gray-700" onClick={() => router.push('/myRentals')}>My Rentals</button>
        <button className="px-3 py-2 rounded bg-red-600 hover:bg-red-700" onClick={() => { logout(); router.push('/'); }}>Logout</button>
        <button className="bg-gray-900 dark:bg-white text-white dark:text-black" onClick={toggleDarkMode}>{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </nav>
      </>
    )}
      
export default Navbar;
