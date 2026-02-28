import { Category } from "./category";
import { Product } from "./product";

export interface HomeData {
  banners: any[];
  newArrivals: Product[];
  featuredProducts: Product[];
  categories: Category[];
}
