import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { apiurl } from './../api';
import Lottie from "lottie-react";
import loadingAnimation from "@/Lottie/Loader.json";

interface Props {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: Props) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsValid(false);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(`${apiurl}/auth/user/check-validity`, { token });
        setIsValid(res.data.valid);
      } catch (err) {
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Lottie 
        animationData={loadingAnimation} 
        loop={true}
        style={{ width: 300, height: 300 }}
      />
    </div>
  );

  if (!isValid) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
