export interface CheckoutState {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  deliveryMethodId?: number;
}
