/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {  
        const savedTheme = localStorage.getItem("theme");
        if(savedTheme === 'true') {setDarkMode(true);}
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            localStorage.setItem("theme", !prev);
            return !prev;
        });
    };

        return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-white dark:bg-gray-900`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
