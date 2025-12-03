import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, setAuthToken, getAuthToken, setUser, getUser, clearAuth } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      const user = getUser();

      if (token && user) {
        setAuthToken(token);
        try {
          // Verify token is still valid
          const res = await authAPI.verify();
          const serverUser = res.data?.user || user;
          // Persist the freshest user from server
          setUser(serverUser);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: serverUser, token },
          });
        } catch (error) {
          const status = error?.response?.status;
          if (status === 401) {
            // Token is invalid, clear auth
            clearAuth();
            dispatch({ type: 'LOGOUT' });
          } else {
            // Non-auth errors (network, 404, server down):
            // fall back to existing local session without forcing logout.
            console.warn('Auth verify unreachable; continuing with local session');
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token },
            });
          }
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authAPI.login(credentials);
      const { user, token } = response.data;

      setAuthToken(token);
      setUser(user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errData = error.response?.data;
      let message = errData?.message || 'Login failed';
      if (Array.isArray(errData?.errors)) {
        message = errData.errors
          .map(e => e.msg || e.message || `${e.param || 'field'} is invalid`)
          .join(', ');
      }
      // Network or server unreachable
      if (!error.response) {
        message = 'Cannot reach server. Check backend status or API URL.';
      }
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authAPI.register(userData);
      const { user, token } = response.data;

      setAuthToken(token);
      setUser(user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errData = error.response?.data;
      let message = errData?.message || 'Registration failed';
      if (Array.isArray(errData?.errors)) {
        // Collect validator errors into a readable message
        message = errData.errors
          .map(e => e.msg || e.message || `${e.param || 'field'} is invalid`)
          .join(', ');
      }
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearAuth();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    setUser(updatedUser);
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;