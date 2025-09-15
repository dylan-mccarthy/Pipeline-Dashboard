import React, { useState, useEffect } from 'react';
import './App.css';

// Configuration - can be moved to env variables or config file
const API_BASE = process.env.REACT_APP_API_BASE || '/api';
const DEFAULT_OWNER = process.env.REACT_APP_DEFAULT_OWNER || 'octocat';
const DEFAULT_REPO = process.env.REACT_APP_DEFAULT_REPO || 'Hello-World';

function App() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchWorkflows(controller.signal).catch((err) => {
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
      }
    });

    return () => {
      controller.abort();
    };
  }, []);

  const fetchWorkflows = async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE}/repos/${DEFAULT_OWNER}/${DEFAULT_REPO}/actions/runs`;
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      const data = await response.json();

      // Only update state if not aborted
      if (!signal.aborted) {
        setWorkflows(data.workflow_runs || []);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      // Only update error state if not aborted
      if (!signal.aborted) {
        setError(err.message);
        setLoading(false);
      }
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
