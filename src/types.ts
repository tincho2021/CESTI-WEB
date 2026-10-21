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
  department?: 'combustible' | 'electronica';
}

export interface CartItem extends Product {
  quantity: number;
}
