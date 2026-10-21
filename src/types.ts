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
  technicalDoc?: string | null;
  technicalDocName?: string | null;
  technicalDocKind?: 'image' | 'pdf' | null;
}

export interface CartItem extends Product {
  quantity: number;
}
