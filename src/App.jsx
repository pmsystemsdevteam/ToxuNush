// App.js
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./Layout/MainLayout";
import AdminLayout from "./Layout/AdminLayout";
import LoginPage from "./Page/LoginPage/LoginPage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="App">
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Ana sayfa rotaları MainLayout içinde */}
          <Route path="/*" element={<MainLayout />} />
          
          {/* Admin rotaları AdminLayout içinde */}
          <Route path="/admin/*" element={<AdminLayout />} />
          
          {/* Login sayfası için ayrı bir route */}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;