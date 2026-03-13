import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ResearchBuilder from "@/pages/ResearchBuilder";
import Results from "@/pages/Results";
import History from "@/pages/History";
import Templates from "@/pages/Templates";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/research" element={<ResearchBuilder />} />
          <Route path="/results/:taskId" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/templates" element={<Templates />} />
        </Routes>
      </Layout>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
