export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Frame {
  name: string;
  image: string;
}

export interface Size {
  dimensions: string;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalPrice: number;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  items: any[]; // You can define a specific type for items if needed
  shippingAddress: ShippingAddress;
  frame: Frame;
  size: Size;
}
