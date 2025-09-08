import React, { useState } from "react";
import { useQuery, gql, useMutation } from "@apollo/client";
import ProjectForm from "../components/ProjectForm.jsx";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; 

const PROJECTS_QUERY = gql`
  query Projects($organizationSlug: String!) {
    projects(organizationSlug: $organizationSlug) {
      id
      name
      slug
      description
      status
      dueDate
    }
  }
`;
const DELETE_PROJECT = gql`
  mutation DeleteProject($organizationSlug: String!, $projectId: ID!) {
    deleteProject(organizationSlug: $organizationSlug, projectId: $projectId){
    success
    }
    }
`;

export default function ProjectsPage({ organizationSlug }) {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(PROJECTS_QUERY, {
    variables: { organizationSlug: user?.organization?.slug || "" },
    skip: !user,
  });
  const [deleteProject] = useMutation(DELETE_PROJECT);

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error.message}</p>;

  const projects = data?.projects || [];

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    ON_HOLD: "bg-yellow-100 text-yellow-800",
  };

return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingProject(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Project
        </motion.button>
      </div>
          
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectForm
              organizationSlug={user?.organization?.slug || ""}
              project={editingProject}
              onClose={() => {
                setShowForm(false);
                setEditingProject(null);
                refetch();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || "bg-gray-100 text-gray-800"
                    }`}
                >
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{project.description}</p>
              <p className="text-gray-500 text-xs">
                Due: {project.dueDate || "No deadline"}
              </p>

              <div className="mt-3 space-y-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingProject(project);
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </motion.button>

                <motion.div whileHover={{ scale: 1.02 }}>
                  <Link
                    to={`/projects/${project.slug}/tasks`}
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    View Tasks
                  </Link>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this project?")) {
                      try {
                        await deleteProject({
                          variables: {
                            organizationSlug: user?.organization?.slug || "",
                            projectId: project.id,
                          },
                          update: (cache, { data }) => {
                            if (data?.deleteProject?.success) {
                              cache.modify({
                                fields: {
                                  projects(existingProjects = [], { readField }) {
                                    return existingProjects.filter(
                                      (projRef) =>
                                        readField("id", projRef) !== project.id
                                    );
                                  },
                                },
                              });
                            }
                          },
                        });
                      } catch (error) {
                        console.error("Error deleting project:", error);
                      }
                    }
                  }}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}