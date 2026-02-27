export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  label: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}
