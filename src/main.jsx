import React from "react";
import {createRoot} from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import "./styles/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/styles-legacy-ui.css";
import "./styles/customer-ui.css";
import "./styles/responsive.css";
import ErrorBoundary from "./components/error/ErrorBoundary.jsx";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* Lưới an toàn cuối cùng: lỗi ở provider/router phía trên cũng không làm trắng trang */}
        <ErrorBoundary>
            <App/>
        </ErrorBoundary>
        <ToastContainer position="top-center" autoClose={3000} newestOnTop/>
    </React.StrictMode>
);
