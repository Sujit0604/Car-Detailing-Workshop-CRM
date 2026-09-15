import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./routes/AppRouter.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          style: {
            background: "#111",
            color: "#f0ede8",
            border: "1px solid #2a2a2a",
            fontFamily: "'Barlow', sans-serif",
          },
        }}
      />
    </AuthProvider>
  );
}