"use client"
import {useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext";
import {useRouter} from "next/navigation";

function LoginUser(){

    const[email,setEmail] = useState("");
    const[password,setPassword] = useState("");
    const[error, setError] = useState("");
    const[loading,setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");   
        setLoading(true);
        const userData = {email,password};
        try{
            const response = await api.post("/users/login", userData);
            login(response.data);
            router.push("/Tools");
        }
        catch(error){
            setError(error.response?.data?.message || "Login failed. Please try again.");
        }
        finally{
            setLoading(false);
        }
    }

    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-200 p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="font-bold text-2xl mb-6 text-center dark:text-gray-900">Login Now to start renting</h1>
            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-900" htmlFor="email">Email:</label>
                <input className="w-full border rounded px-3 py-2" type="email" required placeholder="Email.." id="email" name="email" value={email} onChange={emailChange => setEmail(emailChange.target.value)}></input>
                <br></br>
                </div>
                <div>
                <label className="block text-sm font-medium mb-1" htmlFor="password">Password:</label>
                <input className="w-full border rounded px-3 py-2" type="password" required placeholder="Password.." id="password" name="password" value={password} onChange={passwordChange => setPassword(passwordChange.target.value)}></input>
                <br></br>
                </div>
                <div className="flex gap-4 mt-4">
                <button className="flex-1 px-4 py-2 rounded border hover:bg-gray-100" type="button" onClick={()=>{setEmail("");setPassword("");}}>Reset</button>
                <button className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" type="submit" disabled={loading}>   {loading ? "Logging in..." : "Submit"}</button>
                </div>
            </form>
        </div>
        </div>
    )

}

export default LoginUser;
