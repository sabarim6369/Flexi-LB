import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { apiurl } from './../api';

interface Props {
  children: JSX.Element;
}

const AuthRoute = ({ children }: Props) => {
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

  if (loading) return <div>Loading...</div>;

  if (isValid) return <Navigate to="/dashboard" replace />;

  return children;
};

export default AuthRoute;
