import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Projects from "./pages/ProjectPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProjectDashboard from "./pages/ProjectsDashboard.jsx";
import TaskBoard from "./pages/TaskBoardPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardLayout />
              
            </RequireAuth>
          }
        >
          <Route path="projects/dashboard" element={<ProjectDashboard />}/>
          <Route path="projects" element={<Projects />} />
          <Route path="/projects/:projectSlug/tasks" element={<TaskBoard />} />
          {/* <Route path="tasks/board" element={<TaskDashboard />} /> */}
          {/* <Route path="/tasks/:id" element={<TaskDetail />}/> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
