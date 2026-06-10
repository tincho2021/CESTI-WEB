import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { products as initialProducts } from '../data/products';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const compressBase64Image = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/') || base64Str.length < 500000) {
      resolve(base64Str);
      return;
    }

    console.log(`Compressing large base64 image of size: ${base64Str.length} chars`);
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          console.log(`Compressed image from ${base64Str.length} to ${compressed.length} characters.`);
          resolve(compressed);
        } else {
          resolve(base64Str);
        }
      } catch (err) {
        console.error('Error during canvas compression:', err);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  seedDefaultProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productsList, setProductsList] = useState<Product[]>([]);

  const seedDefaultProducts = async () => {
    try {
      console.log('Forced seeding of default products to Firestore...');
      for (const item of initialProducts) {
        await setDoc(doc(db, 'products', item.id), item);
      }
      console.log('Forced seeding completed successfully.');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'products');
    }
  };

  useEffect(() => {
    const productsCollection = collection(db, 'products');

    const migrateLocalProducts = async () => {
      const localStored = localStorage.getItem('cesti_products_dynamic');
      if (localStored) {
        try {
          const localProducts = JSON.parse(localStored) as Product[];
          if (Array.isArray(localProducts) && localProducts.length > 0) {
            console.log('Migrating local products to Firestore...', localProducts);
            for (const item of localProducts) {
              const compressedImage = await compressBase64Image(item.image || '');
              const sanitizedItem: Product = {
                id: item.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                name: item.name || 'Producto sin nombre',
                price: Number(item.price) || 0,
                category: item.category || 'Varios',
                image: compressedImage,
                description: item.description || '',
                smartReady: typeof item.smartReady === 'boolean' ? item.smartReady : false,
                stock: Number(item.stock) || 0,
                specs: item.specs || {}
              };
              
              try {
                await setDoc(doc(db, 'products', sanitizedItem.id), sanitizedItem);
              } catch (writeErr) {
                console.error(`Failed to write migrated product ${sanitizedItem.id}:`, writeErr);
                // Fail-safe fallback if the error is due to size exceed
                const errMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
                if (errMsg.includes('size') || errMsg.includes('exceeds')) {
                  console.log(`Fallback: resetting image of ${sanitizedItem.id} to category default due to size limit.`);
                  sanitizedItem.image = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600';
                  try {
                    await setDoc(doc(db, 'products', sanitizedItem.id), sanitizedItem);
                  } catch (fallbackErr) {
                    console.error(`Fallback print failed for ${sanitizedItem.id}:`, fallbackErr);
                  }
                }
              }
            }
            console.log('Migration of local products completed successfully.');
          }
          // Mark as migrated to prevent duplicate efforts, and remove the old key
          localStorage.setItem('cesti_products_dynamic_migrated', localStored);
          localStorage.removeItem('cesti_products_dynamic');
        } catch (e) {
          console.error('Error migrating local products to Firestore:', e);
          // Ensure we don't block the app infinite list load state
          localStorage.removeItem('cesti_products_dynamic');
        }
      }
    };

    // Run the migration as soon as the component loads
    migrateLocalProducts();

    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(productsCollection, async (snapshot) => {
      if (snapshot.empty) {
        // If empty, and we didn't just migrate anything (no localStored either), seed Firestore with the initial products list
        const localStored = localStorage.getItem('cesti_products_dynamic_migrated') || localStorage.getItem('cesti_products_dynamic');
        if (!localStored) {
          try {
            console.log('Seeding initial products to Firestore...');
            for (const item of initialProducts) {
              await setDoc(doc(db, 'products', item.id), item);
            }
          } catch (e) {
            console.error('Error seeding initial products to Firestore:', e);
          }
        }
      } else {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        // Set the active products state
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
    try {
      const compressedImage = await compressBase64Image(p.image || '');
      const newProduct: Product = {
        ...p,
        image: compressedImage,
        id: newId
      };
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
      const compressedImage = await compressBase64Image(p.image || '');
      const updatedProduct: Product = {
        ...p,
        image: compressedImage
      };
      await setDoc(doc(db, 'products', p.id), updatedProduct);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${p.id}`);
    }
  };

  return (
    <ProductContext.Provider value={{ products: productsList, addProduct, removeProduct, updateProduct, seedDefaultProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};

