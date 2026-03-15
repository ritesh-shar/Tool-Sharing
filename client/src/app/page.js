"use client";

import {useRouter} from "next/navigation";

function LandingPage(){
  const router = useRouter();
  return(
    <div>

      <section className = "min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-5xl font-bold mb-4 dark:text-white">Any tool, Any time</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Use our website to rent tools to make whatever your imagination says.</p>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Our site used and recommended by people from all ages.</p>
        <div className="flex gap-4 mt-4">
    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => router.push('/register')}>Get Started</button>
    <button className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white dark:border-gray-600" onClick={() => router.push('/login')}>Login</button>
</div>
      </section>

      <section className = "min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-5xl font-bold mb-4 dark:text-white">Why us ?</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">A normal drill costs &#8377;3899. Our website lets you rent it for much cheaper.</p>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Only verified users can access and rent tools,So you know who is renting your tools</p>
      </section>

      <section className = "min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-5xl font-bold mb-4 dark:text-white" >How to get started</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">1. Sign up</p>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">2. Browse for tools.</p>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">3. Rent the tool for however long.</p>
      </section>

     <footer className="text-center py-6 text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
    <p>&copy; Ritesh Kumar Sharma 2026</p>
    <div className="flex justify-center gap-6 mt-2">
        <a href="https://github.com/ritesh-shar" target="_blank" className="hover:text-blue-500">GitHub</a>
    </div>
</footer>
   
    </div>

  )
}

export default LandingPage
