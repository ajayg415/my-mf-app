import { useSelector } from "react-redux";

const Dashboard = () => {
  const userData = useSelector((state) => state.mf.userData);


  return (
    <section className="dashboard-section">
      { userData && (
        <div className="mockup-code p-4 rounded-xl overflow-x-auto">
          <pre>
            <code>{JSON.stringify(userData, null, 2)}</code>
          </pre>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
