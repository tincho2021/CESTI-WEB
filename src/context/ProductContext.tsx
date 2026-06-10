import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { products as initialProducts } from '../data/products';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    const productsCollection = collection(db, 'products');

    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(productsCollection, async (snapshot) => {
      if (snapshot.empty) {
        // If empty, seed Firestore with the initial products list
        try {
          console.log('Seeding products to Firestore...');
          // Seed sequentially or in batch to ensure consistency
          for (const item of initialProducts) {
            await setDoc(doc(db, 'products', item.id), item);
          }
        } catch (e) {
          console.error('Error seeding initial products to Firestore:', e);
        }
      } else {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        // Sort products by original ID/timestamp to keep display consistent
        setProductsList(list);
      }
    }, (error) => {
      // Gracefully handle permission errors
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const addProduct = async (p: Omit<Product, 'id'>) => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...p,
      id: newId
    };
    try {
      await setDoc(doc(db, 'products', newId), newProduct);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${newId}`);
    }
  };

  const removeProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${productId}`);
    }
  };

  const updateProduct = async (p: Product) => {
    try {
      await setDoc(doc(db, 'products', p.id), p);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${p.id}`);
    }
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

