import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/simpleAuthStore';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      signOut();
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800" onClick={closeMenu}>
              FrameCraft
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              to="/"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>

            {/* Desktop Auth Section */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden lg:inline ml-1">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
              onClick={closeMenu}
            >
              Home
            </Link>
            {user && <Link
              to="/admin"
              className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 transition-colors"
              onClick={closeMenu}
            >
              Admin Dashboard
            </Link>}
          </div>

          {/* Mobile Auth Section */}
          <div className="pt-4 pb-3 border-t border-gray-100">
            {user ? (
              <div className="px-4 space-y-3">
                <Link
                  to="/admin"
                  className="flex items-center px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  onClick={closeMenu}
                >
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 transition-colors w-full"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                <Link
                  to="/"
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
