// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  city?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  // Optional: per-size pricing for frames/products
  sizes?: ProductSize[];
}

// Product size pricing definition
export interface ProductSize {
  dimensions: string; // e.g. "8x10 in" or "A4"
  price: number;      // price for this size
}

// Order types
export interface OrderItem {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  price: number;
  name?: string;
  imageUrl?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface FrameDetails {
  name: string;
  image: string;
}

export interface SizeDetails {
  dimensions: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  frameId?: string;
  frameName?: string;
  frameImage?: string;
  frameOrientation?: string;
  framePrice?: number;
  sizeId?: string;
  sizeName?: string;
  sizeMultiplier?: number;
  totalPrice: number;
  finalPrice?: number;
  imagePosition?: { x: number; y: number };
  imageZoom?: number;
  imageUrl?: string | null;
  shippingDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    state?: string;
  };
  promoCode?: string;
  discountAmount?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string | any; // Can be string or Firestore Timestamp
  updatedAt: string | any; // Can be string or Firestore Timestamp
  
  // For backward compatibility with existing code
  customerEmail?: string;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
  frame?: FrameDetails;
  size?: SizeDetails;
}

export interface ProfileOrder {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  cancelledAt?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    address: string;
    city: string;
    district: string;
  };
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// AI Generation types
export interface AIGeneration {
  id: string;
  userId: string;
  prompt: string;
  result: string;
  image_url: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}