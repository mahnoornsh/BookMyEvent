import API from './axios';

export const signupUser = async ({ fullName, email, password, role }) => {
  const { data } = await API.post('/auth/register', {
    name: fullName,
    email,
    password,
    role: role === 'customer' ? 'user' : role
  });
  return data;
};

export const loginUser = async ({ email, password }) => {
  const { data } = await API.post('/auth/login', { email, password });
  return data;
};

export const logoutUser = async () => {
  await API.post('/auth/logout');
};