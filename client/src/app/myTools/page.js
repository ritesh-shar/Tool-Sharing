"use client";

import api from "../api/axios.js";
import {useRouter} from "next/navigation.js";
import {useAuth} from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";

function MyTools(){
    const { user } = useAuth();
    const router = useRouter();
    const [tools, setTools] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        else{
             const fetchMyTools = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/tools/me");
            setTools(response.data.tools);
        }

        catch(error){
            setError(error.response?.data?.message || "Failed to fetch your tools. Please try again.");
        }

        finally{
            setLoading(false);
        }
    };
        fetchMyTools();
        }
        
    }, [user, router, refresh]);

    const handleDelete = async (toolId) => {
        try{
            await api.delete(`/tools/${toolId}`);
            setRefresh(prev => !prev);
        }
        catch(error){
            setError(error.response?.data?.message || "Failed to delete the tool. Please try again.");
        }
    };

    return(
        <div className="max-w-6xl mx-auto px-6 py-8 dark:bg-color-900">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">My Tools</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {loading ? (
            <p className="dark:text-white">Loading...</p>
        ) : (
                tools.length === 0 ? <p className="dark:text-white">You have not listed any tools yet.</p>: (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map(tool => (
                        <div className="border rounded-lg p-4 flex flex-col gap-4" key={tool._id}>
                            <h3 className="font-bold text-lg dark:text-white">Name: {tool.toolName}</h3>
                            <p className="text-gray-600 text-sm dark:text-gray-200">Location: {tool.location}</p>
                            <p className="font-semibold dark:text-white">Price: ₹{tool.pricePerHour} per hour</p>
                            <p className={tool.isAvailable ? "text-green-600" : "text-red-600"}>{tool.isAvailable ? "Available for Rent" : "Currently Unavailable"}</p>
                            <button 
                            className = {`mt-auto px-4 py-2 rounded text-white ${!tool.isAvailable ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                            disabled={!tool.isAvailable}
                            onClick={() => handleDelete(tool._id)}>Delete</button>
                        </div>
                    ))}              
                    
                    </div>
                )
        )}
        </div>
    );

}
export default MyTools;
