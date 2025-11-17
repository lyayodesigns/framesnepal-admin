import { create } from 'zustand';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc, orderBy } from '@firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  createOrder: (orderData: Partial<Order>) => Promise<void>;
  fetchOrders: (userId: string) => Promise<void>;
  getAllOrders: () => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  createOrder: async (orderData: Partial<Order>) => {
    set({ loading: true, error: null });
    try {
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newOrder = {
        id: docRef.id,
        ...orderData
      } as Order;

      set(state => ({
        orders: [...state.orders, newOrder],
        currentOrder: newOrder,
        loading: false
      }));
    } catch (error) {
      console.error('Error creating order:', error);
      set({ error: 'Failed to create order', loading: false });
    }
  },

  fetchOrders: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      set({ orders, loading: false });
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ error: 'Failed to fetch orders', loading: false });
    }
  },

  getAllOrders: async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      
      if (querySnapshot.empty) {
        return [];
      }
      
      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to string for consistent handling
        const createdAt = data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        const updatedAt = data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : new Date().toISOString();
        
        // Prefer explicit top-level imageUrl, otherwise fall back to nested items[0].imageUrl (as stored by checkout)
        const derivedImageUrl = data.imageUrl || data.items?.[0]?.imageUrl || '';

        // Derive frame fields from either top-level or nested item
        const firstItem = data.items?.[0] || {};
        const derivedFrameId = data.frameId || firstItem.frameId || firstItem.productId || '';
        const derivedFrameName = data.frameName || firstItem.frameName || firstItem.name || '';
        const derivedFrameImage = data.frameImage || firstItem.frameImage || firstItem.imageUrl || '';
        const derivedFrameOrientation = data.frameOrientation || firstItem.frameOrientation || '';
        const derivedFramePrice = data.framePrice || firstItem.framePrice || firstItem.price || 0;
        
        return {
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          userName: data.userName || '',
          frameId: derivedFrameId,
          frameName: derivedFrameName,
          frameImage: derivedFrameImage,
          frameOrientation: derivedFrameOrientation,
          framePrice: derivedFramePrice,
          sizeId: data.sizeId || '',
          sizeName: data.sizeName || '',
          sizeMultiplier: data.sizeMultiplier || 1,
          totalPrice: data.totalPrice || 0,
          finalPrice: data.finalPrice || 0,
          imagePosition: data.imagePosition || { x: 0, y: 0 },
          imageZoom: data.imageZoom || 1,
          imageUrl: derivedImageUrl || null,
          shippingDetails: data.shippingDetails || {},
          promoCode: data.promoCode,
          discountAmount: data.discountAmount,
          status: data.status || 'pending',
          createdAt: createdAt,
          updatedAt: updatedAt,
          customerEmail: data.userEmail || data.shippingDetails?.email || '',
          // For backward compatibility with the admin panel
          items: [{
            id: doc.id,
            productId: derivedFrameId,
            orderId: doc.id,
            quantity: 1,
            price: derivedFramePrice,
            imageUrl: derivedImageUrl,
            name: derivedFrameName
          }],
          shippingAddress: data.shippingDetails ? {
            firstName: data.shippingDetails.fullName?.split(' ')[0] || '',
            lastName: data.shippingDetails.fullName?.split(' ').slice(1).join(' ') || '',
            address: data.shippingDetails.address || '',
            city: data.shippingDetails.city || '',
            state: data.shippingDetails.state || '',
            zipCode: data.shippingDetails.postalCode || ''
          } : undefined
        };
      });
      
      return orders as Order[];
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    set({ loading: true, error: null });
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date().toISOString()
      });

      const updatedDoc = await getDoc(orderRef);
      const updatedOrder = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Order;

      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? updatedOrder : order
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating order:', error);
      set({ error: 'Failed to update order', loading: false });
    }
  },

  deleteOrder: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);

      set(state => ({
        orders: state.orders.filter(order => order.id !== orderId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting order:', error);
      set({ error: 'Failed to delete order', loading: false });
    }
  },

  setCurrentOrder: (order: Order | null) => set({ currentOrder: order })
}));
