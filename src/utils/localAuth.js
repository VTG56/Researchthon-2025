const ADMIN_USERNAME = 'VTG56';
const ADMIN_PASSWORD = 'laptop';

export const login = (username, password) => {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem('isAdmin', 'true');
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem('isAdmin');
};

export const isAdmin = () => {
  return localStorage.getItem('isAdmin') === 'true';
};