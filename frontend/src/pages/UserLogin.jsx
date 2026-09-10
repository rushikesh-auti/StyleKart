import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserSession } from "../store/userAuthSlice";
import { adminApiUrl } from "../utils/adminApi";

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        adminApiUrl(isRegistering ? "/auth/register" : "/auth/login"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to authenticate");
      }

      dispatch(setUserSession({ token: data.token, user: data.user }));
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-6 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 mb-2">
                {isRegistering ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-muted mb-4">
                {isRegistering
                  ? "Join StyleKart and start shopping."
                  : "Sign in to continue shopping."}
              </p>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                {isRegistering && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="name">
                      Name
                    </label>
                    <input
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="form-control"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="form-control"
                    id="password"
                    name="password"
                    type="password"
                    minLength={isRegistering ? 8 : undefined}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                {isRegistering && (
                  <div className="mb-4">
                    <label className="form-label" htmlFor="confirmPassword">
                      Confirm password
                    </label>
                    <input
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : isRegistering
                      ? "Create account"
                      : "Login"}
                </button>
              </form>

              <button
                className="btn btn-link w-100 mt-3"
                type="button"
                onClick={() => {
                  setIsRegistering((current) => !current);
                  setError("");
                }}
              >
                {isRegistering
                  ? "Already have an account? Login"
                  : "New to StyleKart? Create an account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UserLogin;
