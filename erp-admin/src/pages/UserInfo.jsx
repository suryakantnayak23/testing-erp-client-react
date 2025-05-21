"use client"

import { useState, useEffect } from "react"
import userData from "../data/userData"
import {
  FaEnvelope,
  FaIdCard,
  FaCalendar,
  FaMapMarkerAlt,
  FaPhone,
  FaTint,
  FaClock,
  FaSave,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUserPlus,
  FaDownload,
} from "react-icons/fa"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function UserInfo() {
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [formData, setFormData] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [apiResponse, setApiResponse] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newUser, setNewUser] = useState({
    id: "",
    name: {
      first: "",
      last: "",
    },
    email: "",
    username: "",
    password: "",
    dateOfBirth: "",
    "Blood-group": "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    phone: "",
    accountCreated: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  })

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:8080/api/user-profiles/all")

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()
        console.log("API users data:", data)

        // If the API returns an array directly
        const usersList = Array.isArray(data)
          ? data
          : // If the API returns an object with a data property that's an array
            data.data && Array.isArray(data.data)
            ? data.data
            : []

        if (usersList.length > 0) {
          // Process each user to ensure correct field mapping
          const processedUsers = usersList.map((user) => {
            // Map blood group from any of its possible field names
            const bloodGroup = user.blood_group || user.bloodGroup || user["Blood-group"] || null

            console.log(`User ${user.name?.first} ${user.name?.last} blood group:`, bloodGroup)

            return {
              ...user,
              // Ensure consistent field naming
              "Blood-group": bloodGroup,
            }
          })

          console.log("Processed users:", processedUsers)

          setUsers(processedUsers)
          setFormData(processedUsers[0])
        } else {
          // Fallback to dummy data if API returns empty array
          console.log("API returned no users, using fallback data")
          setUsers(userData.users)
          setFormData(userData.users[0])
        }
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err.message)
        // Fallback to dummy data on error
        setUsers(userData.users)
        setFormData(userData.users[0])

        toast.error(`Failed to load users: ${err.message}`, {
          position: "top-right",
          autoClose: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleNewUserInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setNewUser((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setNewUser((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Get the current user's ID
      const userId = formData.id

      // Format data to match API expectations
      const userData = {
        ...formData,
        // Handle blood group field - use bloodGroup instead of Blood-group if needed
        bloodGroup: formData["Blood-group"] || "",
      }

      console.log("Updating user data for ID:", userId)
      console.log("Update payload:", JSON.stringify(userData))

      // Make API call to update user data
      const response = await fetch(`http://localhost:8080/api/user-profiles/update/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const responseData = await response.json()
      console.log("API response:", responseData)

      // Update the current user data in the users array
      const updatedUsers = [...users]
      updatedUsers[currentUserIndex] = formData
      setUsers(updatedUsers)

      // Show success toast
      toast.success("Profile updated successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } catch (error) {
      console.error("Error updating user:", error)

      // Show error toast
      toast.error(`Failed to update user: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })

      // Still update the local state even if API fails
      const updatedUsers = [...users]
      updatedUsers[currentUserIndex] = formData
      setUsers(updatedUsers)
    }

    setIsEditing(false)
  }

  const handleUserChange = (direction) => {
    let newIndex
    if (direction === "next") {
      newIndex = (currentUserIndex + 1) % users.length
    } else {
      newIndex = currentUserIndex - 1
      if (newIndex < 0) newIndex = users.length - 1
    }
    setCurrentUserIndex(newIndex)
    setFormData(users[newIndex])
    setIsEditing(false)
  }

  const handleAddUser = () => {
    setShowModal(true)
  }

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()

    // Generate a random ID
    const userId = Math.floor(100000 + Math.random() * 900000).toString()

    // Format data to match API expectations
    const userWithId = {
      ...newUser,
      id: userId,
      // Handle blood group field - use bloodGroup instead of Blood-group if needed
      bloodGroup: newUser["Blood-group"] || "",
    }

    try {
      // Log the request for debugging
      console.log("Submitting user data to API:", JSON.stringify(userWithId))

      // Make API call to submit user data with additional CORS settings
      const response = await fetch("http://localhost:8080/api/user-profiles/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify(userWithId),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const responseData = await response.json()
      console.log("API response:", responseData)

      // Store API response in state
      setApiResponse(responseData)

      // Map API response to user data format ensuring Blood-group is properly set
      const userData = responseData.data || responseData

      // Update the current user with data from API response
      const updatedUser = {
        ...userWithId,
        ...userData,
        // Make sure we handle both formats of blood group field
        "Blood-group":
          userData.blood_group || userData.bloodGroup || userData["Blood-group"] || userWithId["Blood-group"] || "",
      }

      // Add new user to the array
      const updatedUsers = [...users, updatedUser]
      setUsers(updatedUsers)

      // Set this as the current user to display
      setCurrentUserIndex(updatedUsers.length - 1)
      setFormData(updatedUser)

      // Show success toast with API response info
      toast.success("User added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } catch (error) {
      console.error("Error submitting user:", error)

      // Show error toast
      toast.error(`Failed to submit user: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })

      // Still add the user locally even if API fails
      const updatedUsers = [...users, userWithId]
      setUsers(updatedUsers)
      setCurrentUserIndex(updatedUsers.length - 1)
      setFormData(userWithId)
    }

    // Close the modal and reset form
    setShowModal(false)
    setNewUser({
      id: "",
      name: {
        first: "",
        last: "",
      },
      email: "",
      username: "",
      password: "",
      dateOfBirth: "",
      "Blood-group": "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      phone: "",
      accountCreated: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    })
  }

  const handleDownloadUsers = () => {
    // Prepare data for Excel
    const excelData = users.map((user) => ({
      "User ID": user.id,
      "First Name": user.name.first,
      "Last Name": user.name.last,
      Username: user.username,
      Email: user.email,
      Phone: user.phone,
      "Date of Birth": user.dateOfBirth,
      "Blood Group": user["Blood-group"],
      "Street Address": user.address?.street,
      City: user.address?.city,
      State: user.address?.state,
      "Postal Code": user.address?.postalCode,
      Country: user.address?.country,
      "Account Created": user.accountCreated,
      "Last Login": user.lastLogin,
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users")

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "users_data.xlsx")

    // Show success toast
    toast.success("Users data downloaded successfully!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Information</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleUserChange("prev")}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Previous user"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              User {currentUserIndex + 1} of {users.length}
            </span>
            <button
              onClick={() => handleUserChange("next")}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Next user"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadUsers}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title="Download Users Data"
          >
            <FaDownload className="mr-2 inline h-4 w-4" />
            Download Users
          </button>
          <button
            onClick={handleAddUser}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title="Add new user"
          >
            <FaUserPlus className="mr-2 inline h-4 w-4" />
            Add User
          </button>
          {isEditing ? (
            <div className="space-x-2">
              <button
                onClick={handleSubmit}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <FaSave className="mr-2 inline h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <FaTimes className="mr-2 inline h-4 w-4" />
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50">
          <div className="relative max-h-full w-full max-w-md p-4">
            <div className="animate-fade-in-up relative rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between border-b pb-4 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New User</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="new-firstName"
                      name="name.first"
                      className="input-field"
                      value={newUser.name.first}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="new-lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="new-lastName"
                      name="name.last"
                      className="input-field"
                      value={newUser.name.last}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-username" className="form-label">
                      Username
                    </label>
                    <input
                      type="text"
                      id="new-username"
                      name="username"
                      className="input-field"
                      value={newUser.username}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="new-email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="new-email"
                      name="email"
                      className="input-field"
                      value={newUser.email}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      name="password"
                      className="input-field"
                      value={newUser.password}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="new-blood-group" className="form-label">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      id="new-blood-group"
                      name="Blood-group"
                      className="input-field"
                      value={newUser["Blood-group"]}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-phone" className="form-label">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="new-phone"
                    name="phone"
                    className="input-field"
                    value={newUser.phone}
                    onChange={handleNewUserInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-dob" className="form-label">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="new-dob"
                    name="dateOfBirth"
                    className="input-field"
                    value={newUser.dateOfBirth}
                    onChange={handleNewUserInputChange}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Address</h4>

                  <div>
                    <label className="form-label" htmlFor="new-street">
                      Street
                    </label>
                    <input
                      type="text"
                      id="new-street"
                      name="address.street"
                      className="input-field"
                      value={newUser.address.street}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="form-label" htmlFor="new-city">
                        City
                      </label>
                      <input
                        type="text"
                        id="new-city"
                        name="address.city"
                        className="input-field"
                        value={newUser.address.city}
                        onChange={handleNewUserInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="new-state">
                        State
                      </label>
                      <input
                        type="text"
                        id="new-state"
                        name="address.state"
                        className="input-field"
                        value={newUser.address.state}
                        onChange={handleNewUserInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="new-postalCode">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="new-postalCode"
                        name="address.postalCode"
                        className="input-field"
                        value={newUser.address.postalCode}
                        onChange={handleNewUserInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="new-country">
                        Country
                      </label>
                      <input
                        type="text"
                        id="new-country"
                        name="address.country"
                        className="input-field"
                        value={newUser.address.country}
                        onChange={handleNewUserInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card col-span-1 flex flex-col items-center p-6 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
            <span className="text-3xl font-semibold">
              {formData.name.first.charAt(0)}
              {formData.name.last.charAt(0)}
            </span>
          </div>
          <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
            {formData.name.first} {formData.name.last}
          </h3>
          <div className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">@{formData.username}</div>

          <div className="mt-4 flex w-full flex-col space-y-2 px-2">
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaEnvelope className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{formData.email}</span>
            </div>
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaIdCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">ID: {formData.id}</span>
            </div>
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaCalendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">DOB: {formatDate(formData.dateOfBirth)}</span>
            </div>
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaPhone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{formData.phone}</span>
            </div>
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaTint className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Blood: {formData["Blood-group"] || "Not Specified"}
              </span>
            </div>
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaMapMarkerAlt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {formData.address.city}, {formData.address.country}
              </span>
            </div>
            <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaClock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Joined: {formatDate(formData.accountCreated)}
              </span>
            </div>
          </div>
        </div>

        <div className="card col-span-1 lg:col-span-2">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "personal"
                      ? "text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("personal")}
                  role="tab"
                >
                  Personal Information
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "address"
                      ? "text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("address")}
                  role="tab"
                >
                  Address Details
                </button>
              </li>
              <li role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "account"
                      ? "text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("account")}
                  role="tab"
                >
                  Account Information
                </button>
              </li>
            </ul>
          </div>
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === "personal" && (
              <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-6 mb-6 md:grid-cols-2">
                    <div>
                      <label className="form-label" htmlFor="firstName">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="name.first"
                        className="input-field"
                        value={formData.name.first}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="lastName">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="name.last"
                        className="input-field"
                        value={formData.name.last}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="username">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className="input-field"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="email">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="input-field"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="dateOfBirth">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        className="input-field"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="bloodGroup">
                        Blood Group
                      </label>
                      <input
                        type="text"
                        id="bloodGroup"
                        name="Blood-group"
                        className="input-field"
                        value={formData["Blood-group"] || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Not Specified"
                      />
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Address Details Tab */}
            {activeTab === "address" && (
              <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-6 mb-6 md:grid-cols-2">
                    <div>
                      <label className="form-label" htmlFor="phone">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="input-field"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Address</h4>

                      <div>
                        <label className="form-label" htmlFor="street">
                          Street
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="address.street"
                          className="input-field"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="form-label" htmlFor="city">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="address.city"
                            className="input-field"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor="state">
                            State
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="address.state"
                            className="input-field"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor="postalCode">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            name="address.postalCode"
                            className="input-field"
                            value={formData.address.postalCode}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor="country">
                            Country
                          </label>
                          <input
                            type="text"
                            id="country"
                            name="address.country"
                            className="input-field"
                            value={formData.address.country}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Account Information Tab */}
            {activeTab === "account" && (
              <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-6 mb-6 md:grid-cols-2">
                    <div>
                      <label className="form-label" htmlFor="accountCreated">
                        Account Created
                      </label>
                      <input
                        type="text"
                        id="accountCreated"
                        name="accountCreated"
                        className="input-field"
                        value={formatDate(formData.accountCreated)}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="lastLogin">
                        Last Login
                      </label>
                      <input
                        type="text"
                        id="lastLogin"
                        name="lastLogin"
                        className="input-field"
                        value={formatDate(formData.lastLogin)}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserInfo
