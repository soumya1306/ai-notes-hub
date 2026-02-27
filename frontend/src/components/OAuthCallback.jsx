import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {

  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      loginWithTokens(access_token, refresh_token);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [loginWithTokens, navigate]);

  return (
    <div className="app-container">
      <p>Signing you in...</p>
    </div>
  );
}