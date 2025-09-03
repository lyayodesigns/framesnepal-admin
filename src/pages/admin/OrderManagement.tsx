import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { ArrowLeft, Package, Trash2 } from 'lucide-react';
import { Order } from '../../types';

export default function OrderManagement() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, deleteOrder } = useOrderStore();
  const order = orders.find((o) => o.id === orderId);

  const [status, setStatus] = useState<Order['status']>(order?.status ?? 'pending');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!order || !orderId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateOrderStatus(orderId, status);
      navigate('/admin');
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteOrder(orderId);
      navigate('/admin');
    } catch (error) {
      console.error('Failed to delete order:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to dashboard
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Order #{order?.id}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Created on {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Order['status'])}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Customer Details
                </h4>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{order?.shippingAddress?.firstName} {order?.shippingAddress?.lastName}</p>
                  <p>{order?.shippingAddress?.address}</p>
                  <p>
                    {order?.shippingAddress?.city}, {order?.shippingAddress?.state}{' '}
                    {order?.shippingAddress?.zipCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-6">
                  <img
                    src={order?.frame?.image}
                    alt={order?.frame?.name}
                    className="h-24 w-24 object-cover rounded"
                  />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {order?.frame?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Size: {order?.size?.dimensions}
                    </p>
                    <p className="mt-2 text-lg font-medium text-gray-900">
                      NPR {order?.totalPrice?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleSave}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Package className="mr-2 h-5 w-5" />
              Save Changes
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}