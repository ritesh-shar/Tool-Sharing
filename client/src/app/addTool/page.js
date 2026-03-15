"use client"

import { useState } from "react";
import api from "../api/axios.js";
import {useRouter} from "next/navigation";

function AddTool(){
    const [toolName,setToolName] = useState("");
    const [description,setDescription] = useState("");
    const [location,setLocation] = useState("");
    const [images,setImages] = useState("");
    const [pricePerHour,setPricePerHour] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleClick(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const toolData = {toolName,description,location,images : [images] ,pricePerHour: parseFloat(pricePerHour)};

        try{
            await api.post("/tools", toolData);
            router.push("/tools");
        }

        catch(error){
            setError(error.response?.data?.message || "Failed to add tool. Please try again.");
        }
        finally{
            setLoading(false);
        }
    }

    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md dark:bg-gray-10">
            <h1 className="font-bold text-2xl mb-6 text-center"> Add a tool </h1>
            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleClick} className="flex flex-col gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="toolName">ToolName:</label>
                <input className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" required name="toolName" id="toolName" placeholder="Tool.." value={toolName} onChange={e => setToolName(e.target.value)}></input>
                <br></br>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="description">Description:</label>
                <input className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" required name="description" id="description" placeholder="describe tool" value={description} onChange={e => setDescription(e.target.value)}></input>
                <br></br>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="location">Location:</label>
                <input className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" required name="location" id="location" placeholder="Enter location" value={location} onChange={e => setLocation(e.target.value)}></input>
                <br></br>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="images">Images:</label>
                <input className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="url" required name="images" id="images" placeholder="Enter url" value={images} onChange={e => setImages(e.target.value)}></input>
                <br></br>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="pricePerHour">Price:</label>
                <input className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="number" required name="pricePerHour" id="pricePerHour" placeholder="Enter Amount per hour" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)}></input>
                <br></br>
                </div>
                <div className="flex gap-4 mt-4">
                <button className="rounded flex-1 px-1 py-2 bg-gray-300 hover:bg-gray-400" type="button" onClick={() => {setToolName("");setDescription("");setLocation("");setImages("");setPricePerHour("");}}>Reset</button>
                <button className="rounded flex-1 px-1 py-2 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50" type="submit" disabled={loading}>{loading ? "Adding tool..." : "Submit"}</button>
                </div>
            </form>
        </div>
        </div>
    )
}

export default AddTool;
