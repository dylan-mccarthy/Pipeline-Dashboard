const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GitHub Actions Dashboard API is running' });
});

// Get workflows for a repository
app.get('/api/repos/:owner/:repo/workflows', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.actions.listRepoWorkflows({
      owner,
      repo,
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Get workflow runs for a repository
app.get('/api/repos/:owner/:repo/actions/runs', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 10,
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    res.status(500).json({ error: 'Failed to fetch workflow runs' });
  }
});

// Aggregate workflow runs for multiple repos
// Example: GET /api/workflows?repos=owner1/repo1,owner2/repo2
app.get('/api/workflows', async (req, res) => {
  try {
    const { repos } = req.query;
    if (!repos) {
      return res.status(400).json({ error: 'Missing repos query parameter' });
    }

    const repoList = repos.split(',').map((r) => r.trim()).filter(Boolean);

    // Fetch runs for all repos in parallel
    const fetchPromises = repoList.map(async (repoPair) => {
      const [owner, repo] = repoPair.split('/');
      if (!owner || !repo) {
        return { repo: repoPair, error: 'Invalid repo format, expected owner/repo' };
      }

      try {
        const { data } = await octokit.actions.listWorkflowRunsForRepo({
          owner,
          repo,
          per_page: 10,
        });
        return { repo: `${owner}/${repo}`, runs: data.workflow_runs || [] };
      } catch (err) {
        console.error(`Error fetching runs for ${owner}/${repo}:`, err.message || err);
        return { repo: `${owner}/${repo}`, error: err.message || 'Failed to fetch runs' };
      }
    });

    const results = await Promise.all(fetchPromises);
    res.json({ results });
  } catch (error) {
    console.error('Error aggregating workflow runs:', error);
    res.status(500).json({ error: 'Failed to aggregate workflow runs' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});