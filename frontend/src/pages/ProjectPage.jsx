import React, { useState } from "react";
import { useQuery, gql, useMutation } from "@apollo/client";
import ProjectForm from "../components/ProjectForm.jsx";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

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
        <button
          onClick={() => {
            setEditingProject(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <ProjectForm
          organizationSlug={user?.organization?.slug || ""}
          project={editingProject}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
            refetch();
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
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

            <span className="text-gray-500 text-xs block mt-1">
              <button
                onClick={() => {
                  setEditingProject(project);
                  setShowForm(true);
                }}
                className="mt-3 text-blue-600 hover:underline text-sm"
              >
                Edit
              </button>
              <Link
                to={`/projects/${project.slug}/tasks`}
                className="mt-3 block text-blue-600 hover:underline text-sm"
              >
                View Tasks
              </Link>
              <button
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
                                    (projRef) => readField("id", projRef) !== project.id
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
                className="mt-3 text-red-600 hover:underline text-sm"
              >
                Delete
              </button>
            </span>

          </div>
        ))}
      </div>
    </div>
  );
}
