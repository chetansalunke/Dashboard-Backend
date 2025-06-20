import React, { useState, useEffect } from "react";
import UserTable from "./UserTable";
import UserForm from "./UserForm";
import BASE_URL from "../../config";
import {
  Users as UsersIcon,
  UserPlus,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";

export default function Users() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    role: "Select",
    status: "internal_stakeholder",
  });
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/all`);

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add user");

      await fetchUsers();

      setFormData({
        username: "",
        email: "",
        password: "",
        phone_number: "",
        role: "Select",
        status: "internal_stakeholder",
      });

      setIsFormOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleDelete = async (index) => {
    const userId = users[index]._id;
    try {
      const response = await fetch(`${BASE_URL}/api/auth/delete/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="container px-4 py-6 mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <UsersIcon size={24} className="text-purple-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-800">
                {isFormOpen ? "Add New User" : "User Management"}
              </h1>
            </div>

            <div className="flex space-x-3">
              {!isLoading && !isFormOpen && (
                <button
                  onClick={fetchUsers}
                  className="px-3 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 transition duration-150 flex items-center"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Refresh
                </button>
              )}

              {isFormOpen ? (
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-150 flex items-center shadow-sm"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back to List
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsFormOpen(true);
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      phone_number: "",
                      role: "Select",
                      status: "internal_stakeholder",
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition duration-150 flex items-center shadow-sm"
                >
                  <UserPlus size={16} className="mr-1" />
                  New User
                </button>
              )}
            </div>
          </div>

          {!isFormOpen && (
            <p className="text-gray-500 mt-2">
              Manage your team members and their account permissions here.
            </p>
          )}
        </div>

        {/* Content Section */}
        <div className="transition-all duration-300">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
          ) : isFormOpen ? (
            <UserForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
            />
          ) : (
            <UserTable users={users} handleDelete={handleDelete} />
          )}
        </div>
      </main>
    </div>
  );
}
