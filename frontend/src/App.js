import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      // Example: fetch from a specific repo
      const response = await fetch('/api/repos/octocat/Hello-World/actions/runs');
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      const data = await response.json();
      setWorkflows(data.workflow_runs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GitHub Actions Pipeline Dashboard</h1>
        {loading && <p>Loading workflows...</p>}
        {error && <p>Error: {error}</p>}
        <div className="workflows">
          {workflows.map((run) => (
            <div key={run.id} className="workflow-card">
              <h3>{run.name}</h3>
              <p>Status: {run.status}</p>
              <p>Conclusion: {run.conclusion}</p>
              <p>Created: {new Date(run.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
