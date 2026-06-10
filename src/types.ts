export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  specs: Record<string, string>;
  description: string;
  smartReady: boolean;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}
