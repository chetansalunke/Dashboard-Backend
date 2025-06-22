// AdminDesignProjects.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config";
import imageLogo from "./imageLogo.jpg";
import { FaUserCircle, FaSort, FaFilter } from "react-icons/fa";

export default function AdminDesignProjects() {
  const [allProjects, setAllProjects] = useState([]); // Store all original projects
  const [displayProjects, setDisplayProjects] = useState([]); // Projects to display
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sortOption, setSortOption] = useState("date-latest");
  const [activePhase, setActivePhase] = useState("All");
  const navigate = useNavigate();

  const phases = [
    "All",
    "Concept",
    "Design Development",
    "Tendering",
    "Execution",
    "Handover",
  ];

  const handleProjectClick = (project) => {
    navigate("/admin-design", {
      state: { project },
    });
  };
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowDropdown(false);
  };

  const handlePhaseChange = (phase) => {
    setActivePhase(phase);
    filterAndSortProjects(allProjects, phase, sortOption);
  };

  // Function to handle both filtering and sorting
  const filterAndSortProjects = (projects, phase, sort) => {
    let result = [...projects];

    // Filter by phase if not "All"
    if (phase !== "All") {
      result = result.filter((project) => project.phase === phase);
    }

    // Sort based on selected option
    if (sort === "date-latest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === "a-z") {
      result.sort((a, b) => a.projectName.localeCompare(b.projectName));
    }

    setDisplayProjects(result);
  };

  // Effect for sorting and filtering when options change
  useEffect(() => {
    if (allProjects.length > 0) {
      filterAndSortProjects(allProjects, activePhase, sortOption);
    }
  }, [sortOption, activePhase, allProjects]);

  // Effect for initial data loading
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/projects/all`);
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        if (data && Array.isArray(data.projects)) {
          setAllProjects(data.projects);
          setDisplayProjects(data.projects); // Initialize display projects
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "On Hold":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "Completed":
        return "bg-green-50 text-green-600 border-green-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Reduced padding */}
      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800">Design Projects</h1>
          <p className="text-sm text-gray-500">
            Manage and monitor all your design projects
          </p>
        </div>

        {/* Filters & Sort - More compact */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <FaFilter className="text-gray-400" />
            <div className="flex gap-1">
              {phases.map((phase) => (
                <button
                  key={phase}
                  onClick={() => handlePhaseChange(phase)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    activePhase === phase
                      ? "bg-indigo-100 text-indigo-600 font-medium"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaSort className="text-gray-400" />
              Sort by {sortOption === "date-latest" ? "Date" : "Name"}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 shadow-lg rounded-md text-xs z-20">
                <button
                  onClick={() => handleSortChange("date-latest")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  Latest First
                </button>
                <button
                  onClick={() => handleSortChange("a-z")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  Name (A to Z)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Projects Grid - Smaller gap */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">
              No projects found for the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayProjects.map((project) => (
              <div
                key={project._id}
                onClick={() => handleProjectClick(project)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="bg-gray-50 p-3 flex justify-center items-center border-b">
                  <img
                    src={imageLogo}
                    alt={project.projectName}
                    className="h-12 object-contain"
                  />
                </div>

                <div className="p-3">
                  <h3 className="text-base font-semibold text-gray-800 mb-2 truncate">
                    {project.projectName}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>

                    <span className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
