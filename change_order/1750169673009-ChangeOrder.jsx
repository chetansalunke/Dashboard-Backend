import React, { useState, useEffect } from "react";
import BASE_URL from "../../config";
import ProjectDropdown from "./RFI/ProjectDropdown";
import ChangeOrderControl from "./ChangeOrderControl";
import ChangeOrderTable from "./ChangeOrderTable";
import ChangeOrderForm from "./ChangeOrderForm";

export default function ChangeOrder() {
  const [rfis, setRfis] = useState([]);
  const [filteredRfis, setFilteredRfis] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [openedChangeOrder, setOpenedChangeOrder] = useState(null);
  const [sortOption, setSortOption] = useState("a-z");
  const [activeTab, setActiveTab] = useState("All");

  const storedUser = localStorage.getItem("user");
  const userID = storedUser ? JSON.parse(storedUser)?.id : null;
  const role = storedUser ? JSON.parse(storedUser)?.role : null;
  // console.log(role);
  // console.log("Selected Project ID:", selectedProjectId);
  // console.log(users);
  const [projectList, setProjectList] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedProjectId) {
      fetchRfis(selectedProjectId);
    }
  }, [token, selectedProjectId]);

  useEffect(() => {
    filterRfisByTabAndSearch();
  }, [activeTab, rfis, searchText, sortOption]); // ✅ Added sortOption

  const fetchProjects = async () => {
    try {
      // const response = await fetch(`${BASE_URL}/api/projects/all`);
      let url = "";

      if (role === "admin" || role === "expert") {
        url = `${BASE_URL}/api/projects/all`;
      } else {
        url = `${BASE_URL}/api/projects/assigned-projects/${userID}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setProjectList(Array.isArray(data.projects) ? data.projects : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjectList([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await response.json();
      const userMap = {};
      userData.users.forEach((user) => {
        userMap[user.id] = user.username;
      });
      setUsers(userMap);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    }
  };

  const fetchRfis = async (projectIdToFetch) => {
    if (!projectIdToFetch) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/getAllRfi`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        await handleRefreshToken();
        return fetchRfis(projectIdToFetch);
      }

      if (!response.ok) throw new Error("Failed to fetch RFIs");

      const data = await response.json();
      const filtered = data.filter(
        (rfi) => rfi.project_id === Number(projectIdToFetch)
      );
      setRfis(filtered);
    } catch (err) {
      console.error("Error fetching RFIs:", err);
      setError("Failed to load RFIs");
    } finally {
      setLoading(false);
    }
  };

  const filterRfisByTabAndSearch = () => {
    let filtered = [...rfis];
    if (sortOption === "a-z") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "date") {
      filtered.sort(
        (a, b) => new Date(b.dateRequested) - new Date(a.dateRequested)
      );
    }
    setFilteredRfis(filtered);
  };

  const handleRefreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error("Failed to refresh token");

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      setToken(data.accessToken);
    } catch (error) {
      console.error("Token refresh failed:", error);
      setError("Session expired. Please log in again.");
    }
  };

  const [changeOrders, setChangeOrders] = useState([]);
  

  const fetchChangeOrders = async () => {
    if (!selectedProjectId || !token) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/co/project/${selectedProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch change orders");

      const data = await res.json();

      const mappedData = data.map((item) => ({
        id: item.id,
        change_request_number: item.change_request_number,
        project_id: item.project_id,
        title: item.description_of_change,
        description: item.reason_for_change,
        dateRequested: new Date(item.date).toISOString().split("T")[0],
        dateApproved: item.resolved_at
          ? new Date(item.resolved_at).toISOString().split("T")[0]
          : "Pending",
        component: item.change_component,
        createdBy: item.requester,
        assignedTo: item.send_to,
        communication: item.mode_of_communication,
        fullDescription: item.description_of_change,
        details: item.details_of_change,
        location_of_change: item.location_of_change,
        area: item.area,
        reason_for_change: item.reason_for_change,
        proof_of_instruction: item.proof_of_instruction,
        sent_to_client: item.sent_to_client,
        document_upload: item.document_upload,
        status: item.status,
        resolved_at: item.resolved_at,
        resolution_details: item.resolution_details,
        resolution_documents: item.resolution_documents,
      }));
      console.log(mappedData.resolution_document);
      setChangeOrders(mappedData);
    } catch (error) {
      console.error("Failed to fetch change orders:", error);
    }
  };

  return (
    <div className="bg-gray-100">
      <main className="h-full w-full overflow-y-auto">
        <div className="container px-6 my-6 grid">
          {(
            <h1 className="text-xl font-semibold tracking-wide text-black uppercase mb-1">
              {selectedProjectName && `${selectedProjectName}`}
            </h1>
          )}

          {!openedChangeOrder && !showForm && (
            <div className="flex justify-between">
              <ProjectDropdown
                projectList={projectList}
                selectedProjectId={selectedProjectId}
                onChange={(selectedId) => {
                  setSelectedProjectId(selectedId);
                  const selectedProject = projectList.find(
                    (p) => p.id === Number(selectedId)
                  );
                  setSelectedProjectName(selectedProject?.projectName || "");
                }}
              />
              {!openedChangeOrder && !showForm && selectedProjectId && (
                <ChangeOrderControl
                  setActiveTab={setActiveTab}
                  onSearchChange={setSearchText}
                  setSortOption={setSortOption}
                  userRole={role}
                  user={storedUser}
                  activeTab={activeTab}
                  // setActiveTab={setActiveTab}
                  onCreateClick={() => setShowForm(true)} // 👈 again here
                  fetchChangeOrders={fetchChangeOrders}

                />
              )}
            </div>
          )}
          <hr className="border border-gray-400 m-2" />
          {showForm ? (
            <ChangeOrderForm
              onSubmit={(data) => {
                console.log("Submitted Data:", data);
                // TODO: call your backend API here
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
              userRole={role}
              user={storedUser}
              userID={userID}
              projectList={projectList}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
            />
          ) : (
            <>
              {/* {!openedChangeOrder && !showForm && (
                <ChangeOrderControl
                  setActiveTab={setActiveTab}
                  onSearchChange={setSearchText}
                  setSortOption={setSortOption}
                  userRole={role}
                  user={storedUser}
                  activeTab={activeTab}
                  // setActiveTab={setActiveTab}
                  onCreateClick={() => setShowForm(true)} // 👈 again here
                />
              )} */}

              <ChangeOrderTable
                rfis={filteredRfis}
                users={users}
                onOpen={(rfi) => setOpenedChangeOrder(rfi)}
                sortOption={sortOption}
                selectedProjectId={selectedProjectId}
                userID={userID}
                userRole={role}
                user={storedUser}
                activeTab={activeTab}
                fetchChangeOrders={fetchChangeOrders}
                changeOrders={changeOrders}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
