import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { products as initialProducts } from '../data/products';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  removeProduct: (productId: string) => void;
  updateProduct: (product: Product) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cesti_products_dynamic');
    if (stored) {
      try {
        setProductsList(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored products', e);
        setProductsList(initialProducts);
      }
    } else {
      setProductsList(initialProducts);
    }
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProductsList(newProducts);
    localStorage.setItem('cesti_products_dynamic', JSON.stringify(newProducts));
  };

  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...p,
      id: `prod-${Date.now()}`
    };
    saveProducts([...productsList, newProduct]);
  };

  const removeProduct = (productId: string) => {
    saveProducts(productsList.filter(item => item.id !== productId));
  };

  const updateProduct = (p: Product) => {
    saveProducts(productsList.map(item => item.id === p.id ? p : item));
  };

  return (
    <ProductContext.Provider value={{ products: productsList, addProduct, removeProduct, updateProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};
