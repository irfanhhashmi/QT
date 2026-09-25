
export const API_BASE_URL = 'https://ais-dev-cs2t53fqk2t2p2i2smns7y-744138412938.asia-east1.run.app';

export const getApiUrl = (path: string) => {
  // If the path is already absolute, or starts with http, return it as is
  if (path.startsWith('http')) return path;
  
  // Always use relative path to route to the correct same-origin backend (both in local dev and on production custom domains),
  // which avoids CORS preflight redirects.
  return path;
};
