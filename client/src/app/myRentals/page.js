"use client";

import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation.js";

function MyRentals(){
    const { user } = useAuth();
    const router = useRouter();
    const [rentals, setRentals] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        const fetchMyRentals = async () => {
            setLoading(true);
            setError("");
            try{
                const response = await api.get("/rentals/myrentals");
                setRentals(response.data.rentals);
            }

            catch(error){
                setError(error.response?.data?.message || "Failed to fetch your rentals. Please try again.");
            }

            finally{
                setLoading(false);
            }
        };
        fetchMyRentals();
    }, [user, router, refresh]);

    const endRental = async (rentalId) => {
        try{
            await api.post(`/rentals/${rentalId}/end`);
            setRefresh(prev => !prev);
        }

        catch(error){
            setError(error.response?.data?.message || "Failed to end the rental. Please try again.");
        }
    };
    return(
        <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">My Rentals</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {loading ? (
            <p className="dark:text-white">Loading...</p>
        ) : (rentals.length === 0 ? (
            <p className="dark:text-white">You have no rentals.</p>
        ) :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> 
        {rentals.map(rental => (
            <div className="border rounded-lg p-4 flex flex-col gap-4 dark:bg-orange-100" key = {rental._id}>
                <h3 className="font-bold text-lg">Name: {rental.tool.toolName}</h3>
                {rental.status === 'Completed' && (<p className="text-green-600">Status: {rental.status}</p>)}
                {rental.status === 'Active' && (<p className="text-red-600">Status: {rental.status}</p>)}
                {rental.status === 'Active' && (<button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded" onClick={() => endRental(rental._id)}>End Rental</button>)}
                <p className="text-gray-600">Start Time: {new Date(rental.rentTimeStart).toLocaleString(
                    "en-US",
                    {   
                        minute: "2-digit",
                        hour: "2-digit",
                        day: "numeric",
                        month:"short",
                        year: "numeric",
                        hour12: true,
                    }    
                        
                )}</p>
                
                <p className="font-bold">Total Cost: {rental.totalCost ? `₹${rental.totalCost}` : 'Ongoing'}</p>
                </div>
                ))}
        </div>
    )}
    </div>
    );
}

export default MyRentals;
