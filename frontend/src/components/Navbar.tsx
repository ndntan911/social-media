import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Instagram
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'text-indigo-600 border-b-2 border-indigo-600' : ''
                }`}
              >
                Home
              </Link>
              <Link
                to="/create"
                className={`text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/create') ? 'text-indigo-600 border-b-2 border-indigo-600' : ''
                }`}
              >
                Create
              </Link>
              <Link
                to={`/profile/${user?.username}`}
                className={`text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname.startsWith('/profile') ? 'text-indigo-600 border-b-2 border-indigo-600' : ''
                }`}
              >
                Profile
              </Link>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
