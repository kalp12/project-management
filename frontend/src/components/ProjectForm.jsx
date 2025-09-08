import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";

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
        status
        description
        dueDate
      }
    }
  }
`;

const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $organizationSlug: String!
    $projectId: ID!
    $name: String!
    $description: String
    $status: String!
    $dueDate: Date
  ) {
    updateProject(
      organizationSlug: $organizationSlug
      projectId: $projectId
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      project {
        id
        name
        slug
        status
        description
        dueDate
      }
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

export default function ProjectForm({ organizationSlug, project, onClose }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [status, setStatus] = useState(project?.status || "ACTIVE");
  const [dueDate, setDueDate] = useState(project?.dueDate || "");

  const [createProject, { loading: creating, error: createError }] = useMutation(CREATE_PROJECT, {
  update: (cache, { data: { createProject } }) => {
    const newProject = createProject.project;
    const existing = cache.readQuery({
      query: PROJECTS_QUERY,
      variables: { organizationSlug: organizationSlug },
    });
    cache.writeQuery({
      query: PROJECTS_QUERY,
      variables: { organizationSlug: organizationSlug },
      data: {
        projects: [...(existing?.projects || []), newProject],
      },
    });
  },
});

const [updateProject, { loading: updating, error: updateError }] = useMutation(UPDATE_PROJECT, {
  update: (cache, { data: { updateProject } }) => {
    const updated = updateProject.project;
    const updatedRef = cache.identify(updated);
    cache.modify({
      fields: {
        projects(existingRefs = [], { readField }) {
          return existingRefs.map((projRef) =>
            readField("id", projRef) === updated.id ? {__ref: updatedRef} : projRef
          );
        },
      },
    });
  },
});


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      alert("Project name is required!");
      return;
    }

    if (project) {
      await updateProject({
        variables: {
          organizationSlug,
          projectId: project.id,
          name,
          description,
          status,
          dueDate: dueDate || null,
        },
      });
    } else {
      
      await createProject({
        variables: {
          organizationSlug,
          name,
          description,
          status,
          dueDate: dueDate || null,
        },
      });
    }

    onClose();
  };
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        {project ? "Edit Project" : "Create New Project"}
      </h2>
      {(createError || updateError) && (
        <p className="text-red-500">
          {createError?.message || updateError?.message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate || ""}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={(creating || updating)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {creating || updating ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
