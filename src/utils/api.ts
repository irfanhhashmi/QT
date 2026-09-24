
export const API_BASE_URL = 'https://ais-dev-cs2t53fqk2t2p2i2smns7y-744138412938.asia-east1.run.app';

export const getApiUrl = (path: string) => {
  // If the path is already absolute, or starts with http, return it as is
  if (path.startsWith('http')) return path;
  
  // If the current origin is not the API_BASE_URL, use absolute URL
  if (window.location.origin !== API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  
  // Otherwise, use relative path
  return path;
};
