import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Calendar,
  User,
  Flag,
  Eye,
  Grid,
  List,
  ArrowUpDown,
  Filter,
} from "lucide-react";

// Mock BASE_URL - replace with your actual config
import BASE_URL from "../../config";

export default function ClientRFI() {
  const [rfis, setRfis] = useState([]);
  const [filteredRfis, setFilteredRfis] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [resolvingRfi, setResolvingRfi] = useState(null);
  const [selectedRfi, setSelectedRfi] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [solutionText, setSolutionText] = useState("");
  const [solutionFiles, setSolutionFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Mock token for demo - replace with actual token
  const token = localStorage.getItem("accessToken");
  const clientId = JSON.parse(localStorage.getItem("user"))?.id;

  // Fetch RFIs for the client
  const fetchRfis = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/sent-to-client/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch RFIs");
      }

      const data = await response.json();
      setRfis(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching RFIs:", error);
      setError("Failed to load RFIs. Please try again.");
      // Fallback to mock data if API fails
    } finally {
      setLoading(false);
    }
  };

  // Fetch users (you might need to adjust this based on your API)
  const fetchUsers = async () => {
    try {
      // Replace with your actual users API endpoint
      const mockUsers = {
        2: "John Smith",
        3: "Sarah Johnson",
        4: "Mike Wilson",
      };
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to mock data
      const mockUsers = {
        2: "John Smith",
        3: "Sarah Johnson",
        4: "Mike Wilson",
      };
      setUsers(mockUsers);
    }
  };

  useEffect(() => {
    fetchRfis();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortRfis();
  }, [activeTab, rfis, searchText, sortBy, sortOrder]);

  const filterAndSortRfis = () => {
    let filtered = [...rfis];

    // Filter by tab - treat "Sent to Client" as "Pending" for client view
    if (activeTab === "Pending") {
      filtered = filtered.filter((rfi) => rfi.status === "Pending");
    } else if (activeTab === "Resolved") {
      filtered = filtered.filter((rfi) => rfi.status === "Resolved");
    }

    // Filter by search
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (rfi) =>
          rfi.title.toLowerCase().includes(lowerSearch) ||
          rfi.details.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "created_at" || sortBy === "resolved_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRfis(filtered);
  };

  // Updated resolve function with your API integration
  const handleResolveSubmit = async () => {
    if (!solutionText.trim()) {
      setErrorMsg("Please provide a solution before resolving.");
      return;
    }

    setIsResolving(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("resolution_details", solutionText);
    formData.append("resolved_by", clientId); // Use client ID instead of send_to
    formData.append("status", "Resolved");

    solutionFiles.forEach((file) => {
      formData.append("documents", file);
    });

    try {
      const response = await fetch(
        `${BASE_URL}/api/resolveRfi/${resolvingRfi.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resolve RFI");
      }

      // Update the RFI in local state
      const updatedRfis = rfis.map((rfi) =>
        rfi.id === resolvingRfi.id
          ? {
              ...rfi,
              status: "Resolved",
              resolution_details: solutionText,
              resolved_at: new Date().toISOString(),
            }
          : rfi
      );

      setRfis(updatedRfis);
      setSolutionText("");
      setSolutionFiles([]);
      setErrorMsg(null);
      setSuccessMsg("🎉 RFI resolved successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      setResolvingRfi(null);

      // Optionally refetch data to ensure consistency
      // fetchRfis();
    } catch (error) {
      console.error("Error resolving RFI:", error);
      setErrorMsg("Failed to resolve RFI. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "text-green-600 bg-green-50 border-green-200";
      case "Sent to Client":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getDisplayStatus = (status) => {
    return status === "Sent to Client" ? "Pending" : status;
  };

  const pendingCount = rfis.filter(
    (rfi) => rfi.status === "Pending"
  ).length;
  const resolvedCount = rfis.filter((rfi) => rfi.status === "Resolved").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RFIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Success Message */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {successMsg}
        </div>
      )}

      {/* Error Message */}
      {(error || errorMsg) && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error || errorMsg}
            <button
              onClick={() => {
                setError(null);
                setErrorMsg(null);
              }}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Client RFI Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your requests for information
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Pending RFIs</p>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Resolved RFIs</p>
                    <p className="text-2xl font-bold">{resolvedCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Total RFIs</p>
                    <p className="text-2xl font-bold">{rfis.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {["All", "Pending", "Resolved"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200">
                    {tab === "All"
                      ? rfis.length
                      : tab === "Pending"
                      ? pendingCount
                      : resolvedCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search RFIs..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "cards"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredRfis.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No RFIs found
            </h3>
            <p className="text-gray-600">
              {searchText
                ? "Try adjusting your search terms."
                : "No RFIs match the current filter."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          // Table View
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setSortBy("title");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Title</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setSortBy("created_at");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Created</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRfis.map((rfi) => (
                    <tr
                      key={rfi.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {rfi.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {rfi.details}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            rfi.status
                          )}`}
                        >
                          {getDisplayStatus(rfi.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                            rfi.priority
                          )}`}
                        >
                          {rfi.priority || "Normal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rfi.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRfi(rfi)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          {(rfi.status === "Sent to Client" ||
                            rfi.status === "Pending") && (
                            <button
                              onClick={() => setResolvingRfi(rfi)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Cards View
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRfis.map((rfi) => (
              <div
                key={rfi.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                      {rfi.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        rfi.status
                      )}`}
                    >
                      {getDisplayStatus(rfi.status)}
                    </span>
                  </div>

                  {/* Details */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {rfi.details}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Flag className="h-4 w-4 mr-2" />
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          rfi.priority
                        )}`}
                      >
                        {rfi.priority || "Normal"} Priority
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(rfi.created_at).toLocaleDateString("en-GB")}{" "}
                        at{" "}
                        {new Date(rfi.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRfi(rfi)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>

                    {((rfi.status === "Sent to Client") || (rfi.status === "Pending")) && (
                      <button
                        onClick={() => setResolvingRfi(rfi)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View RFI Modal */}
      {selectedRfi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">RFI Details</h2>
                <button
                  onClick={() => setSelectedRfi(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRfi.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Details
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRfi.details}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                        selectedRfi.priority
                      )}`}
                    >
                      {selectedRfi.priority || "Normal"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedRfi.status
                      )}`}
                    >
                      {getDisplayStatus(selectedRfi.status)}
                    </span>
                  </div>
                </div>

                {selectedRfi.resolution_details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution
                    </label>
                    <p className="text-gray-900 bg-green-50 p-3 rounded-lg border border-green-200">
                      {selectedRfi.resolution_details}
                    </p>
                  </div>
                )}

                {selectedRfi.resolved_at && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    Resolved on{" "}
                    {new Date(selectedRfi.resolved_at).toLocaleDateString(
                      "en-GB"
                    )}{" "}
                    at{" "}
                    {new Date(selectedRfi.resolved_at).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Show Resolve button in modal for pending RFIs */}
              {selectedRfi.status === "Sent to Client" && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedRfi(null);
                      setResolvingRfi(selectedRfi);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve This RFI
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve RFI Modal */}
      {resolvingRfi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Resolve RFI</h2>
                <button
                  onClick={() => setResolvingRfi(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {resolvingRfi.title}
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {resolvingRfi.details}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solution Details *
                  </label>
                  <textarea
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                    placeholder="Provide detailed solution or response to this RFI..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSolutionFiles([...e.target.files])}
                      className="hidden"
                      id="solution-files"
                    />
                    <label
                      htmlFor="solution-files"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to upload files or drag and drop
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, Images up to 10MB each
                      </span>
                    </label>
                  </div>

                  {solutionFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Array.from(solutionFiles).map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-700">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const newFiles = Array.from(solutionFiles);
                              newFiles.splice(index, 1);
                              setSolutionFiles(newFiles);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setResolvingRfi(null)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveSubmit}
                    disabled={isResolving || !solutionText.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isResolving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Resolving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve RFI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
