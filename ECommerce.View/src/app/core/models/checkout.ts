export interface CheckoutState {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
  deliveryMethodId?: number;
}
