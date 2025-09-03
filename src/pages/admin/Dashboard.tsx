import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/simpleAuthStore';
import { 
  Users, 
  ClipboardList, 
  Settings,
  Package,
  Frame,
  Tag
} from 'lucide-react';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // Stats state removed

  // We don't need this check anymore since PrivateRoute already handles this
  // and simpleAuthStore only has admin users
  // useEffect(() => {
  //   if (!user || user.role !== 'admin') {
  //     navigate('/');
  //   }
  // }, [user, navigate]);

  // Stats fetching effect removed

  const dashboardCards: DashboardCard[] = [
    {
      title: "Products Management",
      description: "Add, edit, and manage your product catalog",
      icon: <Package className="h-8 w-8 text-purple-600" />,
      path: "/admin/products",
      bgColor: "bg-purple-50"
    },
    {
      title: "Frame Management",
      description: "Add, edit, and manage available frame types",
      icon: <Frame className="h-8 w-8 text-pink-600" />,
      path: "/admin/frames",
      bgColor: "bg-pink-50"
    },
    {
      title: "Category Management",
      description: "Manage product categories and organization",
      icon: <Tag className="h-8 w-8 text-orange-600" />,
      path: "/admin/categories",
      bgColor: "bg-orange-50"
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      icon: <ClipboardList className="h-8 w-8 text-blue-600" />,
      path: "/admin/orders",
      bgColor: "bg-blue-50"
    },
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: <Users className="h-8 w-8 text-green-600" />,
      path: "/admin/users",
      bgColor: "bg-green-50"
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: <Settings className="h-8 w-8 text-indigo-600" />,
      path: "/admin/settings",
      bgColor: "bg-indigo-50"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
        <p className="mt-2 text-gray-600">Manage your framing business from one place.</p>
      </div>

      {/* Stats section removed */}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            className={`${card.bgColor} p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
          >
            <div className="flex items-start space-x-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                {card.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
