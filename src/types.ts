export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  prices: {
    M?: number;
    L?: number;
  };
  image?: string;
  isAvailable: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  size: 'M' | 'L';
  sugar: string;
  ice: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled';
  customerInfo: {
    name: string;
    phone: string;
  };
  paymentId?: string;
  customerUid?: string;
  createdAt: any; // Firestore Timestamp
}
