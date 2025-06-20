import React, { useState, useEffect, useRef } from "react";
import BASE_URL from "../../config";
import UploadDrawingForm from "./UploadDrawingForm";
import { FiMoreHorizontal } from "react-icons/fi";
import { FileUp } from "lucide-react";

export default function AdminDesign({ selectedProject, onBack }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortOption, setSortOption] = useState(""); // 'date' or 'a-z'
  const [showDropdown, setShowDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // console.log(selectedProject);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       setShowActionDropdown(null);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const fetchDrawings = async () => {
    if (!selectedProject?.projectId) return;

    try {
      const response = await fetch(
        `${BASE_URL}/api/projects/design_drawing/${selectedProject.projectId}`
      );
      if (!response.ok) throw new Error("Failed to fetch drawings");

      const data = await response.json();
      setDrawings(
        Array.isArray(data.designDrawings) ? data.designDrawings : []
      );
    } catch (error) {
      console.error("Error fetching drawings:", error);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, [selectedProject]);

  const handleUploadSubmit = async () => {
    setShowUploadForm(false);
    await fetchDrawings();
  };

  const filteredDrawings = drawings.filter((drawing) => {
    const matchesSearch = drawing.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDiscipline =
      activeTab === "All" || drawing.discipline === activeTab;
    return matchesSearch && matchesDiscipline;
  });

  const sortedDrawings = [...filteredDrawings].sort((a, b) => {
    if (sortOption === "date") {
      return new Date(b.created_date) - new Date(a.created_date);
    } else if (sortOption === "a-z") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActionDropdown(null);
      }

      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }

      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-100">
      <main className="h-full overflow-y-auto">
        {showUploadForm ? (
          <div className="space-y-4 m-4">
            {/* <h1>hello</h1>
            <h2 className="text-xl font-bold text-center mb-6 text-purple-700">
              Upload New Drawing
            </h2> */}
            <div className="flex items-center gap-2 mb-6">
              <FileUp size={24} className="text-purple-700" />
              <h2 className="text-xl font-bold text-purple-700">
                Upload New Drawing
              </h2>
            </div>
            <UploadDrawingForm
              onClose={() => setShowUploadForm(false)}
              onSubmit={handleUploadSubmit}
              selectedProject={selectedProject}
            />
          </div>
        ) : (
          <div className="container px-6 my-6 grid">
            <div className="flex justify-between">
              <h1 className="text-2xl font-semibold text-gray-600 mb-2">
                {selectedProject.projectName || "No Project Selected"}
              </h1>
              <div className="flex justify-end gap-4 mb-2">
                <div className="relative w-[280px]">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-2 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:border-purple-500 focus:ring focus:ring-purple-200 focus:outline-none"
                    type="text"
                    placeholder="Search"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="px-3 py-1 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Upload Drawing
                </button>
                <button
                  onClick={onBack}
                  className="px-3 py-1 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Back
                </button>
              </div>
            </div>

            <hr className="border border-gray-400" />

            <div className="flex justify-between items-center gap-3 mb-4 bg-white w-full mt-4">
              <div className="flex gap-3">
                {[
                  "All",
                  "Architecture",
                  "Interior",
                  "Structural",
                  "MEP",
                  "Others",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      activeTab === tab
                        ? "bg-purple-600 text-white"
                        : "bg-white hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown((prev) => !prev)}
                    className="px-3 py-1 bg-white border text-sm font-medium rounded hover:bg-gray-100"
                  >
                    Filter By ▼
                  </button>
                  {showFilterDropdown && (
                    <div
                      className="absolute left-0 mt-1 w-44 bg-white border shadow-lg rounded text-sm z-20"
                      ref={filterDropdownRef}
                    >
                      {["Version", "Sent By", "Status", "Discipline"].map(
                        (filter) => (
                          <button
                            key={filter}
                            onClick={() => {
                              setShowFilterDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            {filter}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="px-3 py-1 bg-white border text-sm font-medium rounded hover:bg-gray-100"
                  >
                    Sort by ▼
                  </button>
                  {showDropdown && (
                    <div
                      className="absolute right-0 mt-1 w-44 bg-white border shadow-lg rounded text-sm z-20"
                      ref={sortDropdownRef}
                    >
                      <button
                        onClick={() => {
                          setSortOption("date");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Date
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("a-z");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        A to Z
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full overflow-hidden rounded-lg shadow">
              <div className="w-full overflow-x-auto">
                <table className="w-full whitespace-no-wrap">
                  <thead>
                    <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b bg-gray-50">
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Latest Version</th>
                      <th className="px-4 py-3">Discipline</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sent By</th>
                      <th className="px-4 py-3">Previous Versions</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {sortedDrawings.map((drawing) => (
                      <tr key={drawing.id} className="text-gray-700 text-sm">
                        <td className="px-4 py-3">
                          {drawing.document_path &&
                            JSON.parse(drawing.document_path).map((path, i) => (
                              <a
                                key={i}
                                href={path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Document {i + 1}
                              </a>
                            ))}
                        </td>
                        <td className="px-4 py-3">{drawing.name}</td>
                        <td className="px-4 py-3">
                          {drawing.latest_version_path ? "v1.0" : "N/A"}
                        </td>
                        <td className="px-4 py-3">{drawing.discipline}</td>
                        <td className="px-4 py-3">
                          {new Date(drawing.created_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{drawing.status}</td>
                        <td className="px-4 py-3">
                          {drawing.sent_by || "Unassigned"}
                        </td>
                        <td className="px-4 py-3">
                          {drawing.previous_versions === "NULL"
                            ? "None"
                            : drawing.previous_versions}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            ref={dropdownRef}
                            className="inline-block text-left"
                          >
                            <button
                              onClick={() =>
                                setShowActionDropdown((prev) =>
                                  prev === drawing.id ? null : drawing.id
                                )
                              }
                              className="p-1 rounded-full hover:bg-gray-200"
                            >
                              <FiMoreHorizontal className="w-5 h-5 text-gray-600" />
                            </button>
                            {showActionDropdown === drawing.id && (
                              <div className="absolute right-8 z-10 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg text-sm">
                                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">
                                  Submit to client
                                </button>
                                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">
                                  Share
                                </button>
                                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">
                                  Rename
                                </button>
                                <button className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100">
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedDrawings.length === 0 && (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center text-gray-500 py-6"
                        >
                          No drawings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
