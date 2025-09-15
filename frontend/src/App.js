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

    // Build repos query for aggregated endpoint
    const reposParam = encodeURIComponent(`${DEFAULT_OWNER}/${DEFAULT_REPO}`);
    fetchAggregatedWorkflows(reposParam, controller.signal).catch((err) => {
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
      }
    });

    return () => {
      controller.abort();
    };
  }, []);

  const fetchAggregatedWorkflows = async (reposParam, signal) => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE}/workflows?repos=${reposParam}`;
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error('Failed to fetch aggregated workflows');
      }

      const data = await response.json();

      // data expected shape: { results: [ { repo: 'owner/repo', runs: [...] }, ... ] }
      if (!signal.aborted) {
        setWorkflows(data.results || []);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // request cancelled
      }
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
          {workflows.map((repoResult) => (
            <div key={repoResult.repo} className="repo-group">
              <h2>{repoResult.repo}</h2>
              {repoResult.error ? (
                <div className="repo-error workflow-card">
                  <p>Error: {repoResult.error}</p>
                </div>
              ) : Array.isArray(repoResult.runs) && repoResult.runs.length > 0 ? (
                repoResult.runs.map((run) => (
                  <div key={run.id} className="workflow-card">
                    <h3>{run.name}</h3>
                    <p>Status: {run.status}</p>
                    <p>Conclusion: {run.conclusion || 'N/A'}</p>
                    <p>Created: {new Date(run.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="workflow-card empty">
                  <p>No workflow runs found for this repository.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
