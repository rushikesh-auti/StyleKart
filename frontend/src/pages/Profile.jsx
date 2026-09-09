import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((store) => store.userAuth.user);

  return (
    <main className="container py-5">
      <h1 className="h3 mb-4">My Profile</h1>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-2">
            <strong>Name:</strong> {user?.name}
          </p>
          <p className="mb-0">
            <strong>Email:</strong> {user?.email}
          </p>
        </div>
      </div>
    </main>
  );
};

export default Profile;
