// AdminDesignWrapper.jsx
import React, { useState } from "react";
import AdminDesignProjects from "./AdminDesignProjects";
import AdminDesign from "./AdminDesign";

export default function AdminDesignWrapper() {
  const [selectedProject, setSelectedProject] = useState(null);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handleBack = () => {
    setSelectedProject(null);
  };

  return (
    <>
      {selectedProject ? (
        <AdminDesign selectedProject={selectedProject} onBack={handleBack} />
      ) : (
        <AdminDesignProjects onProjectSelect={handleProjectSelect} />
      )}
    </>
  );
}
