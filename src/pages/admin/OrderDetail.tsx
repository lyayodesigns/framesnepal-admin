import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Package } from 'lucide-react';
import { Order } from '../../types';

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = orderSnap.data();
        
        // Convert Firestore Timestamp to string for consistent handling
        const createdAt = orderData.createdAt?.toDate?.() 
          ? orderData.createdAt.toDate().toISOString() 
          : new Date().toISOString();
        
        const updatedAt = orderData.updatedAt?.toDate?.() 
          ? orderData.updatedAt.toDate().toISOString() 
          : new Date().toISOString();
        
        // Ensure imageUrl is available for rendering in the detail view
        const derivedImageUrl = orderData.imageUrl || orderData.items?.[0]?.imageUrl || null;

        // Derive frame details for display
        const firstItem = orderData.items?.[0] || {};
        const derivedFrameImage = orderData.frameImage || firstItem.frameImage || firstItem.imageUrl || null;
        const derivedFrameName = orderData.frameName || firstItem.frameName || firstItem.name || 'N/A';
        const derivedFrameOrientation = orderData.frameOrientation || firstItem.frameOrientation || null;

        // Derive size details for display
        const derivedSizeName = orderData.sizeName || firstItem.sizeName || null;
        const derivedSizeMultiplier = orderData.sizeMultiplier || firstItem.sizeMultiplier || null;

        // Derive image positioning details for display
        const derivedImagePosition = orderData.imagePosition || firstItem.imagePosition || { x: 0, y: 0 };
        const derivedImageZoom = orderData.imageZoom || firstItem.imageZoom || 100;

        setOrder({
          id: orderSnap.id,
          ...orderData,
          imageUrl: derivedImageUrl,
          frameImage: derivedFrameImage || undefined,
          frameName: derivedFrameName || undefined,
          frameOrientation: derivedFrameOrientation || undefined,
          sizeName: derivedSizeName || undefined,
          sizeMultiplier: derivedSizeMultiplier || undefined,
          imagePosition: derivedImagePosition,
          imageZoom: derivedImageZoom,
          createdAt,
          updatedAt
        } as Order);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to fetch order details');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to orders
          </button>
        </div>
        <div className="text-center py-12">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to orders
          </button>
        </div>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to orders
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Order #{order.id}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Created on {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                {order.status}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.userName || 'N/A'} ({order.userEmail || order.customerEmail || 'No email'})
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                NPR {order.finalPrice?.toFixed(2) || order.totalPrice?.toFixed(2)}
              </dd>
            </div>

            {order.discountAmount && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Discount</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  NPR {order.discountAmount.toFixed(2)} {order.promoCode && `(Code: ${order.promoCode})`}
                </dd>
              </div>
            )}

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Frame</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  {order.frameImage && (
                    <img
                      src={order.frameImage}
                      alt={order.frameName || 'Frame'}
                      className="h-32 w-32 object-cover rounded mr-4"
                    />
                  )}
                  <div>
                    <p className="text-lg font-semibold">{order.frameName || 'N/A'}</p>
                    {order.frameOrientation && (
                      <p className="text-sm text-gray-500">Orientation: {order.frameOrientation}</p>
                    )}
                  </div>
                </div>
              </dd>
            </div>

            {order.imageUrl && order.frameImage && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Order Preview</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-4">
                    {/* Preview Container */}
                    <div className="relative inline-block bg-gray-100 rounded-lg p-4">
                      <div 
                        className="relative"
                        style={{ 
                          width: order.frameOrientation === 'landscape' ? '600px' : '450px', 
                          height: order.frameOrientation === 'landscape' ? '450px' : '600px'
                        }}
                      >
                        {/* Frame Image - On Top */}
                        <div 
                          className="absolute inset-0 z-10 pointer-events-none"
                          style={{
                            transform: order.frameOrientation === 'landscape' ? 'rotate(90deg) scale(1.33)' : 'none',
                            transformOrigin: 'center'
                          }}
                        >
                          <img
                            src={order.frameImage}
                            alt="Frame"
                            className="absolute inset-0 w-full h-full"
                            style={{ objectFit: 'contain' }}
                          />
                        </div>

                        {/* Image Container - Behind Frame */}
                        <div 
                          className="absolute inset-0 z-0"
                          style={{ padding: '12%' }}
                        >
                          <div className="relative w-full h-full overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                              <div className="relative w-[90%] h-[90%] overflow-hidden">
                                <img
                                  src={order.imageUrl}
                                  alt="Customer image preview"
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transform: `translate(${order.imagePosition?.x || 0}px, ${order.imagePosition?.y || 0}px) scale(${(order.imageZoom || 100) / 100})`,
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Positioning Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-3">Image Positioning Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">X-Axis Position:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {order.imagePosition?.x || 0} ({50 + (order.imagePosition?.x || 0)}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Y-Axis Position:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {order.imagePosition?.y || 0} ({50 + (order.imagePosition?.y || 0)}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Zoom Level:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {order.imageZoom || 100}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Orientation:</span>
                          <span className="ml-2 font-medium text-gray-900 capitalize">
                            {order.frameOrientation || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </dd>
              </div>
            )}

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Size</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.sizeName ? (
                  <>
                    {order.sizeName} (Multiplier: {order.sizeMultiplier || 1})
                  </>
                ) : order.size?.dimensions ? (
                  <>
                    {order.size.dimensions}
                  </>
                ) : (
                  <span className="text-gray-400">No size information</span>
                )}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer Image</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.imageUrl ? (
                  <div>
                    <img 
                      src={order.imageUrl} 
                      alt="Customer uploaded image" 
                      className="max-w-sm max-h-48 object-contain rounded"
                    />
                    <div className="mt-2">
                      <a
                        href={order.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-500 break-all"
                      >
                        {order.imageUrl}
                      </a>
                    </div>
                  </div>
                ) : (
                  <span>No image uploaded</span>
                )}
              </dd>
            </div>

            {order.shippingDetails && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Shipping Details</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <p>{order.shippingDetails.fullName}</p>
                  <p>{order.shippingDetails.email}</p>
                  <p>{order.shippingDetails.phone}</p>
                  <p>{order.shippingDetails.address}</p>
                  <p>{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.postalCode}</p>
                </dd>
              </div>
            )}

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(order.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
