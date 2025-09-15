import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockWorkflowRuns = [
  {
    id: 1,
    name: 'CI',
    status: 'completed',
    conclusion: 'success',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Deploy',
    status: 'in_progress',
    conclusion: null,
    created_at: '2023-01-02T00:00:00Z'
  }
];

const mockApiResponse = {
  workflow_runs: mockWorkflowRuns
};

beforeEach(() => {
  mockFetch.mockClear();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockApiResponse)
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders dashboard title', () => {
  render(<App />);
  const titleElement = screen.getByText(/GitHub Actions Pipeline Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('loads and displays workflows', async () => {
  render(<App />);

  // Wait for fetch to complete and workflows to render
  await waitFor(() => {
    expect(screen.getByText('CI')).toBeInTheDocument();
  });

  // Check that workflows are displayed
  expect(screen.getByText('Deploy')).toBeInTheDocument();
  expect(screen.getAllByText(/Status:/)).toHaveLength(2);
  expect(screen.getAllByText(/Conclusion:/)).toHaveLength(2);

  // Verify fetch was called with correct URL
  expect(mockFetch).toHaveBeenCalledWith('/api/repos/octocat/Hello-World/actions/runs', {
    signal: expect.any(AbortSignal)
  });
});
