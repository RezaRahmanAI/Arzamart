import { Order, OrderStatus } from "../models/order";

export const MOCK_ORDERS: Order[] = [
  {
    id: 101,
    orderNumber: "ORD-101",
    status: OrderStatus.Processing,
    customerName: "Sarah Ahmed",
    customerPhone: "+1 (555) 201-8890",
    shippingAddress: "123 Olive Grove Avenue, Apt 4B, New York, NY 10012",
    subTotal: 170,
    shippingCost: 0,
    tax: 14.45,
    total: 184.45,
    itemsCount: 3,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 1,
        productId: 1,
        productName: "Modest Silk Abaya",
        unitPrice: 120,
        quantity: 1,
        size: "Medium",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBdCokpUwyySv_CwFuQed1QC7hxqnQtjP8DG-04T1HpbkVvXoprIdTNo8qGa99JAHBdp4Nb_IAj48tLc60-77pxh1CpwM_ECcXrxzIeouzGVCoGpDykBggPD2fajBbqEw30ckrXgyQBys2UAHvYmII6SmOH3fHMeD70gGLgvwUxX6oHrTFxycgY03X6O-y0VjkRgFtGZKDNWlXzvUn2_jJ8W2iaNfSP7ahIyBp4r8lQcZh0y4yCpAOckDekotOe07ST3U5d-zi9Xxs",
        totalPrice: 120,
      },
      {
        id: 2,
        productId: 2,
        productName: "Premium Chiffon Hijab",
        unitPrice: 25,
        quantity: 2,
        size: "One Size",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCbnsCt3QIKY5UNSA6-NhEGRLenR5dhk7TGZuUu-Y2Go0wcAVmbeGB8m6W3l-_IByKd6OQGbgwaxi7PWbWY37IKSVDOFNhNAUtiSDptavRmRNBOeP1TEf-PwbdabY7mFU7ol0BWAnRJVpeE8VgrnYjCED-6WCnJGr7uOxTncQ51x7eTgqN0QpWo1hJVVNMlcGUtXDXf_jtyh6uHkTEm5Pf4nUrS12M-MfFnEtEneZfn8kgjkio92zJHijlLbFOtdqQEwn0qZZ_rTk8",
        totalPrice: 50,
      },
    ],
  },
];
