import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const GET_PROJECTS = gql`
  query($organizationSlug: String!) {
    projects(organizationSlug: $organizationSlug) {
      id
      name
      description
      taskCount 
      completionRate
    }
  }
`;

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

const CREATE_PROJECT = gql`
  mutation CreateProject(
    $organizationSlug: String!
    $name: String!
    $description: String
    $status: String!
    $dueDate: Date
  ) {
    createProject(
      organizationSlug: $organizationSlug
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      project {
        id
        name
        slug
        description
        status
        dueDate
        
      }
    }
  }
`;

export default function ProjectsDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
    dueDate: "",
  });
  const [errors, setErrors] = useState({});

  const { data, loading, error, refetch } = useQuery(GET_PROJECTS, {
    variables: { organizationSlug: user?.organization?.slug || "" },
    skip: !user,
  });

  const [createProject, { loading: creating, error: createError }] = useMutation(CREATE_PROJECT, {
    update: (cache, { data: { createProject } }) => {
      const newProject = createProject.project;
      const existing = cache.readQuery({
        query: PROJECTS_QUERY,
        variables: { organizationSlug: user?.organization?.slug || "" },
      });
      cache.writeQuery({
        query: PROJECTS_QUERY,
        variables: { organizationSlug: user?.organization?.slug || "" },
        data: {
          projects: [...(existing?.projects || []), newProject],
        },
      });
    },
  });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Project name is required";
    if (!form.status) errs.status = "Status is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await createProject({
      variables: {
        organizationSlug: user.organization.slug,
        ...form,
        dueDate: form.dueDate || null,
      },
    });
  };

  const statusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-700";
      case "DONE":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Project List */}
      <div className="lg:col-span-2 space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-semibold"
        >
          Projects
        </motion.h2>
        {data?.projects?.length ? (
          data.projects.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border rounded-xl p-4 shadow-sm bg-white flex justify-between items-center hover:shadow-lg transition-shadow duration-300"
            >
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-gray-600">{p.description}</p>
                <p className="text-sm text-gray-500">
                  {p.taskCount} tasks • {p.completionRate}% complete
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(
                  p.status
                )}`}
              >
                {p.status}
              </span>
            </motion.div>
          ))
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-gray-500 text-center"
          >
            No projects found.
          </motion.p>
        )}
      </div>

      {/* Create Project Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <h2 className="text-xl font-semibold mb-4">Create Project</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg p-2 transition-colors duration-300 focus:ring-2 focus:ring-blue-400"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border rounded-lg p-2 transition-colors duration-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded-lg p-2 transition-colors duration-300 focus:ring-2 focus:ring-blue-400"
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm">{errors.status}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full border rounded-lg p-2 transition-colors duration-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}