import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Activity,
  ArrowRight,
  Eye,
  MoreHorizontal,
  Bell,
  Plus,
  Filter,
  Download,
  Star,
  Users,
  DollarSign,
  BarChart3,
  Zap,
  Target,
  Briefcase,
} from "lucide-react";
import BASE_URL from "../../config";

const ProjectOverview = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        const clientId = userData?.id;
        if (!clientId) return;

        // Replace with your actual BASE_URL

        const response = await fetch(
          `${BASE_URL}/api/projects/client/${clientId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200 shadow-emerald-100";
      case "in progress":
        return "bg-blue-500/10 text-blue-700 border-blue-200 shadow-blue-100";
      case "planning":
        return "bg-amber-500/10 text-amber-700 border-amber-200 shadow-amber-100";
      case "on hold":
        return "bg-red-500/10 text-red-700 border-red-200 shadow-red-100";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200 shadow-gray-100";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80)
      return "from-emerald-400 via-emerald-500 to-emerald-600";
    if (progress >= 60) return "from-blue-400 via-blue-500 to-blue-600";
    if (progress >= 40) return "from-amber-400 via-amber-500 to-amber-600";
    return "from-red-400 via-red-500 to-red-600";
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-amber-600 bg-amber-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.projectName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      project.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
      {/* Content */}
      <div className="p-8">
        {error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{error}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {project.projectName}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        project.priority
                      )}`}
                    >
                      {project.priority}
                    </span>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Started</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {new Date(
                        project.project_start_date
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Duration</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {project.duration}
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
};
export default ProjectOverview;
