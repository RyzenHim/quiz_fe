"use client"
import axios from "axios"
import { useState, useEffect } from "react"

export default function Login() {
  const [data, setData] = useState({
    email: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchdata()
  }, [])

  const fetchdata = async () => {
    try {
      const res = await axios.get("url")
      setData({
        email: res.data.email || "",
        password: ""
      })
    } catch (err) {
      setError("Failed to fetch data")
    }
  }

  const datasubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!data.email || !data.password) {
        throw new Error("All fields are required")
      }

      const res = await axios.post("url", data)

      console.log(res.data)
      alert("Login Successful ✅")
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        
        <h1 className="text-2xl font-bold text-center mb-6">
          Login Form
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={datasubmit} className="space-y-4">
          
          <div>
            <label className="block mb-1 font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  )
}