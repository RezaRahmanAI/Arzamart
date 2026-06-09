import { Category } from "../models/category";

export const CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Men",
    slug: "men",
    imageUrl: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59",
    isActive: true,
    href: "/shop/men",
    subCategories: [
      { id: "101", name: "Sherwani", slug: "sherwani", href: "/shop/men/sherwani", isActive: true, imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35" },
      { id: "102", name: "Thobe", slug: "thobe", href: "/shop/men/thobe", isActive: true, imageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a" },
      { id: "103", name: "Kabli", slug: "kabli", href: "/shop/men/kabli", isActive: true, imageUrl: "https://images.unsplash.com/photo-1594938291221-94f18cbb5660" },
      { id: "104", name: "Panjabi", slug: "panjabi", href: "/shop/men/panjabi", isActive: true, imageUrl: "https://images.unsplash.com/photo-1621510456681-233013d82a13" }
    ]
  },
  {
    id: "2",
    name: "Women",
    slug: "women",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    isActive: true,
    href: "/shop/women",
    subCategories: [
      { id: "201", name: "Abaya", slug: "abaya", href: "/shop/women/abaya", isActive: true, imageUrl: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb" },
      { id: "202", name: "Tops", slug: "tops", href: "/shop/women/tops", isActive: true, imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3" },
      { id: "203", name: "Co-ords Dress Set", slug: "coords", href: "/shop/women/coords", isActive: true, imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3" },
      { id: "204", name: "Scarf", slug: "scarf", href: "/shop/women/scarf", isActive: true, imageUrl: "https://images.unsplash.com/photo-1601924582970-84472305206c" }
    ]
  },
  {
    id: "3",
    name: "Kids",
    slug: "kids",
    imageUrl: "https://images.unsplash.com/photo-1514090458221-65bb69af63e6",
    isActive: true,
    href: "/shop/kids",
    subCategories: [
      { id: "301", name: "Girls", slug: "girls", href: "/shop/kids/girls", isActive: true, imageUrl: "https://images.unsplash.com/photo-1518837697477-94d4777248d6" },
      { id: "302", name: "Boys", slug: "boys", href: "/shop/kids/boys", isActive: true, imageUrl: "https://images.unsplash.com/photo-1503910392345-1593b4ff3af1" },
      { id: "303", name: "Mother & Daughter", slug: "mother-daughter", href: "/shop/kids/mother-daughter", isActive: true, imageUrl: "https://images.unsplash.com/photo-1518837697477-94d4777248d6" },
      { id: "304", name: "Father & Son", slug: "father-son", href: "/shop/kids/father-son", isActive: true, imageUrl: "https://images.unsplash.com/photo-1513159446162-54eb8bdf79b5" }
    ]
  },
  {
    id: "4",
    name: "Accessories",
    slug: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1491336477066-31156b5e4f35",
    isActive: true,
    href: "/shop/accessories",
    subCategories: [
      { id: "401", name: "Bags", slug: "bags", href: "/shop/accessories/bags", isActive: true, imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3" },
      { id: "402", name: "Home Decor", slug: "home-decor", href: "/shop/accessories/home-decor", isActive: true, imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38" },
      { id: "403", name: "Watches", slug: "watches", href: "/shop/accessories/watches", isActive: true, imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314" },
      { id: "404", name: "Wallets", slug: "wallets", href: "/shop/accessories/wallets", isActive: true, imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93" }
    ]
  }
];
