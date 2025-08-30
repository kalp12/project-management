import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";

const GET_TASKS = gql`
  query GetTasks($organizationSlug: String!, $projectSlug: String!) {
    tasks(organizationSlug: $organizationSlug, projectSlug: $projectSlug) {
      id
      title
      description
      status
      assigneeEmail
      comments {
        id
        content
        authorEmail
        timestamp
        __typename
      }
      __typename
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask(
    $organizationSlug: String!
    $projectSlug: String!
    $title: String!
    $description: String
    $status: String!
    $assigneeEmail: String
  ) {
    createTask(
      organizationSlug: $organizationSlug
      projectSlug: $projectSlug
      title: $title
      description: $description
      status: $status
      assigneeEmail: $assigneeEmail
    ) {
      task {
        id
        title
        description
        status
        assigneeEmail
        comments {
          id
          content
          authorEmail
          timestamp
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask(
    $organizationSlug: String!
    $projectSlug: String!
    $taskId: ID!
    $title: String
    $description: String
    $status: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    updateTask(
      organizationSlug: $organizationSlug
      projectSlug: $projectSlug
      taskId: $taskId
      title: $title
      description: $description
      status: $status
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      task {
        id
        title
        description
        status
        assigneeEmail
        dueDate
        comments {
          id
          content
          authorEmail
          timestamp
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($organizationSlug: String!, $projectSlug: String!, $taskId: Int!, $content: String!, $authorEmail: String!) {
  createTaskComment(
    organizationSlug: $organizationSlug
    projectSlug: $projectSlug
    taskId: $taskId
    content: $content
    authorEmail: $authorEmail
  ) {
    comment {
      id
      content
      authorEmail
      timestamp
      __typename
    }
    __typename
  }
}
`;

function EditTaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    assigneeEmail: task.assigneeEmail || "",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
        <div className="space-y-3">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="w-full border rounded p-2"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border rounded p-2"
          />
          <input
            name="assigneeEmail"
            value={form.assigneeEmail}
            onChange={handleChange}
            placeholder="Assignee Email"
            className="w-full border rounded p-2"
          />
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            {["TODO", "IN_PROGRESS", "DONE"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const { user } = useAuth();
  const { projectSlug } = useParams(); //  /projects/:projectSlug/tasks
  const [form, setForm] = useState({ title: "", description: "", status: "TODO" });
  const [commentContent, setCommentContent] = useState({});
  const [editingTask, setEditingTask] = useState(null);

  const { data, loading, error } = useQuery(GET_TASKS, {
    variables: {
      organizationSlug: user?.organization?.slug || "",
      projectSlug
    },
    skip: !user || !projectSlug,
  });


  const [createTask, { loading: creating }] = useMutation(CREATE_TASK, {
    optimisticResponse: {
      createTask: {
        __typename: "CreateTaskPayload",
        task: {
          id: `temp-${Math.random()}`,
          title: form.title,
          description: form.description,
          status: form.status,
          assigneeEmail: user.email || "",
          comments: [],
          __typename: "TaskType",
        },
      },
    },
    update: (cache, { data: { createTask } }) => {
      const existing = cache.readQuery({
        query: GET_TASKS,
        variables: { organizationSlug: user.organization.slug, projectSlug }
      });
      cache.writeQuery({
        query: GET_TASKS,
        variables: { organizationSlug: user.organization.slug, projectSlug },
        data: {
          tasks: [...(existing?.tasks || []), createTask.task],
        },
      });
    },
    onCompleted: () => {
      setForm({ title: "", description: "", status: "TODO" });
    },
  });


  const [updateTask] = useMutation(UPDATE_TASK, {
    optimisticResponse: (vars) => ({
      updateTask: {
        __typename: "UpdateTaskPayload",
        task: {
          __typename: "TaskType",
          id: vars.taskId,
          title: vars.title || "",
          description: vars.description || "",
          status: vars.status || "TODO",
          assigneeEmail: vars.assigneeEmail || "",
          dueDate: vars.dueDate || null,
          comments: [],
        },
      },
    }),
    update: (cache, { data: { updateTask } }) => {
      cache.modify({
        id: cache.identify(updateTask.task),
        fields: {
          title: () => updateTask.task.title,
          description: () => updateTask.task.description,
          status: () => updateTask.task.status,
          assigneeEmail: () => updateTask.task.assigneeEmail,
          dueDate: () => updateTask.task.dueDate,
        },
      });
    },
  });


  const client = useApolloClient();
  const [addComment] = useMutation(ADD_COMMENT, {
    optimisticResponse: ({ taskId, content, authorEmail }) => ({
      createTaskComment: {
        __typename: "CreateTaskCommentPayload",
        comment: {
          id: `temp-${Math.random()}`,
          content,
          authorEmail,
          timestamp: new Date().toISOString(),
          __typename: "TaskCommentType",
        },
      },
    }),
    update: (cache, { data: { createTaskComment } }, { variables }) => {
      const taskId = variables?.taskId;
      if (!taskId) return;

      const newComment = createTaskComment.comment;

      cache.modify({
        id: cache.identify({ id: taskId, __typename: "TaskType" }),
        fields: {
          comments(existing = [], { toReference }) {
            return [...existing, toReference(newComment)];
          },
        },
      });
    }

  });



  const handleCreateTask = (e) => {
    e.preventDefault();
    createTask({
      variables: {
        organizationSlug: user.organization.slug,
        projectSlug,
        title: form.title,
        description: form.description,
        status: form.status,
        assigneeEmail: user.email,
      },
    });

  };


  const handleStatusChange = (id, status) => {
    updateTask({
      variables: {
        organizationSlug: user.organization.slug,
        projectSlug,
        taskId: id,
        status,
      },
    });
  };
  const handleAddComment = (taskId) => {
    if (!commentContent[taskId]?.trim()) return;
    addComment({
      variables: {
        organizationSlug: user.organization.slug,
        projectSlug,
        taskId,
        content: commentContent[taskId],
        authorEmail: user.email,
      },
    });
    setCommentContent({ ...commentContent, [taskId]: "" });
  };

  const handleSaveEdit = (form) => {
    updateTask({
      variables: {
        organizationSlug: user.organization.slug,
        projectSlug,
        taskId: editingTask.id,
        title: form.title,
        description: form.description,
        status: form.status,
        assigneeEmail: form.assigneeEmail,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      },
    });
    setEditingTask(null);
  };



  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const statuses = ["TODO", "IN_PROGRESS", "DONE"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
      {/* TASK BOARD */}
      {statuses.map((status) => (
        <div key={status} className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">{status.replace("_", " ")}</h2>
          <div className="space-y-3">
            {data?.tasks?.filter((t) => t.status === status).map((task) => (
              
              <div key={task.id} className="p-3 rounded-lg border bg-gray-50">
                
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
                

                {/* Status Dropdown */}
                <div className="flex justify-between items-center mt-2">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="mt-2 border rounded p-1 text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
    onClick={() => setEditingTask(task)}
    className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
  >
    Edit
  </button>
</div>
                

                {/* Comments */}
                <div className="mt-3">
                  <h4 className="font-semibold text-xs">Comments</h4>
                  {task.comments?.map((c) => (
                    <p key={c.id} className="text-xs text-gray-700">
                      <span className="font-medium">{c.authorEmail}:</span> {c.content}
                    </p>
                  ))}
                  <div className="flex mt-2 gap-2">
                    <input
                      type="text"
                      value={commentContent[task.id] || ""}
                      onChange={(e) =>
                        setCommentContent({ ...commentContent, [task.id]: e.target.value })
                      }
                      placeholder="Add comment..."
                      className="flex-1 border rounded p-1 text-sm"
                    />
                    <button
                      onClick={() => handleAddComment(Number(task.id))}
                      className="text-xs bg-blue-600 text-white px-2 rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* CREATE TASK FORM */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Create Task</h2>
        <form className="space-y-3" onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {creating ? "Creating..." : "Create Task"}

          </button>
        </form>

        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
}
