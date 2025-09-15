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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});