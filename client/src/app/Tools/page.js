"use client"

import { useState, useEffect } from "react";
import api from "../api/axios.js";


function BrowseTools(){
    const [tools, setTools] = useState([]);
    const [totalpages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [location, setLocation] = useState("");
    const [toolName, setToolName] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [isAvailable, setIsAvailable] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            setError("");
            try{
                const response = await api.get("/tools", {
                    params: {
                        page: currentPage,
                        location: location || undefined,
                        toolName: toolName || undefined,
                        maxPrice: maxPrice || undefined,
                        minPrice: minPrice || undefined,
                        isAvailable: isAvailable || undefined
                    }
                    
                });
                setTools(response.data.tools);
                setTotalPages(response.data.totalpages);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to fetch tools. Please try again.");
            } finally {
                setLoading(false);
            }

        };

        fetchTools();
    }, [currentPage, location, toolName, maxPrice, minPrice, isAvailable, refresh]);

    const handleRent = async (toolId) => {
        try{
            await api.post(`/rentals/${toolId}/rent`);
            setRefresh(prev => !prev);
        }
        catch(error){
            setError(error.response?.data?.message || "Failed to rent the tool. Please try again.");
        }
    }

    return(
        <div className="max-w-6xl mx-auto px-6 py-8 dark:bg-gray-900">
        <h1 className="font-bold text-2xl mb-6 dark:text-white">Browse Tools</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex gap-3 flex-wrap mb-6">
        <input className="border rounded px-3 py-2 dark:text-white" type="text" placeholder="Location" value={location} onChange={(e) => {setLocation(e.target.value); setCurrentPage(1);}} />
        <input className="border rounded px-3 py-2 dark:text-white" type="text" placeholder="Tool Name" value={toolName} onChange={(e) => {setToolName(e.target.value); setCurrentPage(1);}} />
        <input className="border rounded px-3 py-2 dark:text-white" type="number" placeholder="Min Price" value={minPrice} onChange={(e) => {setMinPrice(e.target.value); setCurrentPage(1);}} />
        <input className="border rounded px-3 py-2 dark:text-white" type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => {setMaxPrice(e.target.value); setCurrentPage(1);}} />
        <select className="border rounded px-3 py-2 dark:text-white" value={isAvailable} onChange={(e) => {setIsAvailable(e.target.value); setCurrentPage(1);}}>
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
        </select>
        </div>
        

        {loading ? <p>Loading...</p> :  (
                tools.length === 0 ? <p>No tools found.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">     
                {tools.map((tool) => (
                    <div className= "border rounded-lg shadow p-4 flex flex-col gap-2" key={tool._id}>
                        <h2 className="font-bold text-lg dark:text-white">Name: {tool.toolName}</h2>
                        <p className="text-gray-600 text-sm dark:text-white">About: {tool.description}</p>
                        <p className="text-gray-600 dark:text-white">Location: {tool.location}</p>
                        <p className="font-semibold dark:text-white"> ₹{tool.pricePerHour.toFixed(2)} / hour</p>
                        <p className={tool.isAvailable ? "text-green-600" : "text-red-500"}>
                                {tool.isAvailable ? "Available" : "Unavailable"} </p>
                        {tool.isAvailable && (<button className="mt-auto px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleRent(tool._id)}>Rent</button>)}
                    </div>
                ))}
            </div>
        )
    )}
        <div className="flex items-center gap-4 mt-8">
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
        <span> Page {currentPage} of {totalpages} </span>
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalpages))} disabled={currentPage === totalpages}>Next</button>
        </div>
    </div>
    )
}
export default BrowseTools;
