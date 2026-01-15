import { useSelector } from "react-redux";

const Dashboard = () => {
  const userData = useSelector((state) => state.mf.userData);


  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      { userData && (
        <div className="mockup-code p-4 rounded-xl overflow-x-auto">
          <pre>
            <code>{JSON.stringify(userData, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
