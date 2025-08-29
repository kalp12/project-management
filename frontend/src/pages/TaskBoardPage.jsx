import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";


const GET_TASKS = gql`
  query GetTasks($organizationSlug: String!, $projectSlug: String!) {
    tasks(organizationSlug: $organizationSlug, projectSlug: $projectSlug) {
      id
      title
      description
      status
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
    $taskId: Int!
    $status: String!
  ) {
    updateTask(
      organizationSlug: $organizationSlug
      projectSlug: $projectSlug
      taskId: $taskId
      status: $status
    ) {
      task {
        id
        status
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


export default function TaskBoard() {
  const { user } = useAuth();
  const { projectSlug } = useParams(); //  /projects/:projectSlug/tasks
  const [form, setForm] = useState({ title: "", description: "", status: "TODO" });
  const [commentContent, setCommentContent] = useState({});

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
          id: Math.random().toString(), // temporary ID
          title: form.title,
          description: form.description,
          status: form.status,
          assigneeEmail: user.email,
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
    optimisticResponse: ({ taskId, status }) => ({
      updateTask: {
        __typename: "UpdateTaskPayload",
        task: {
          id: taskId,
          status,
          __typename: "TaskType",
        },
      },
    }),
    update: (cache, { data: { updateTask } }) => {
      const existing = cache.readQuery({
        query: GET_TASKS,
        variables: { organizationSlug: user.organization.slug, projectSlug }
      });
      cache.writeQuery({
        query: GET_TASKS,
        variables: { organizationSlug: user.organization.slug, projectSlug },
        data: {
          tasks: existing.tasks.map(task =>
            task.id === updateTask.task.id
              ? { ...task, status: updateTask.task.status }
              : task
          ),
        },
      });
    },
  });

  
  const [addComment] = useMutation(ADD_COMMENT, {
    optimisticResponse: ({ taskId, content, authorEmail }) => ({
      createTaskComment: {
        __typename: "CreateTaskCommentPayload",
        comment: {
          id: Math.random().toString(),
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
    id: cache.identify({ id: taskId , __typename: "TaskType" }),
    fields: {
      comments(existing = []) {
        return [...existing, newComment];
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
        taskId: Number(id),
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
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="mt-2 border rounded p-1 text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

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
      </div>
    </div>
  );
}
