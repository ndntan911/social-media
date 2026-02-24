import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get("token");
      const userStr = searchParams.get("user");

      if (token && userStr) {
        try {
          // Store token and user in context
          localStorage.setItem("token", token);

          // Update auth context
          // Since we don't have a direct method to set user, we'll redirect to home
          // and let the AuthContext handle token validation
          navigate("/");
        } catch (error) {
          console.error("Error parsing OAuth callback data:", error);
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
