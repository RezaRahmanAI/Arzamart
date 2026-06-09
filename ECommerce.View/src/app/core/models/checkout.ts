export interface CheckoutState {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  deliveryMethodId?: number;
}

export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  price: number;
  estimatedDelivery: string;
}
