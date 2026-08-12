import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Customer, DailyExpense, HeroSectionContent, StoreInfoContent } from '../types';
import { 
  supabase, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_HERO_CONTENT, 
  INITIAL_STORE_INFO 
} from '../lib/supabase';
import confetti from 'canvas-confetti';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppContextType {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  expenses: DailyExpense[];
  simulatedDate: string; // '2026-07-28' | '2026-07-29' | '2026-07-30' | '2026-07-31' | 'TODOS'
  heroContent: HeroSectionContent;
  storeInfo: StoreInfoContent;
  selectedCategory: string;
  searchQuery: string;
  cart: CartItem[];
  isAuthenticated: boolean;
  userEmail: string | null;
  isLoading: boolean;
  setSimulatedDate: (dateStr: string) => void;
  setSelectedCategory: (slug: string) => void;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  loginAdmin: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  updateHeroContent: (newContent: HeroSectionContent) => Promise<void>;
  updateStoreInfo: (newInfo: StoreInfoContent) => Promise<void>;
  saveProduct: (product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveCustomer: (customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  uploadImageToStorage: (file: File) => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('mama_products');
    return local ? JSON.parse(local) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const local = localStorage.getItem('mama_categories');
    return local ? JSON.parse(local) : INITIAL_CATEGORIES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const local = localStorage.getItem('mama_customers');
    return local ? JSON.parse(local) : INITIAL_CUSTOMERS;
  });

  const [expenses, setExpenses] = useState<DailyExpense[]>(() => {
    const local = localStorage.getItem('mama_expenses');
    return local ? JSON.parse(local) : INITIAL_EXPENSES;
  });

  const [simulatedDate, setSimulatedDate] = useState<string>('2026-07-31'); // Por defecto Viernes 31/07 (Día 28)

  const [heroContent, setHeroContent] = useState<HeroSectionContent>(() => {
    const local = localStorage.getItem('mama_hero');
    return local ? JSON.parse(local) : INITIAL_HERO_CONTENT;
  });

  const [storeInfo, setStoreInfo] = useState<StoreInfoContent>(() => {
    const local = localStorage.getItem('mama_store');
    return local ? JSON.parse(local) : INITIAL_STORE_INFO;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mama_auth') === 'true';
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('mama_user_email') || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mama_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mama_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('mama_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('mama_hero', JSON.stringify(heroContent));
  }, [heroContent]);

  useEffect(() => {
    localStorage.setItem('mama_store', JSON.stringify(storeInfo));
  }, [storeInfo]);

  // Fetch from Supabase on mount
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        setIsLoading(true);
        const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
        if (catData && catData.length > 0) setCategories(catData);

        const { data: prodData } = await supabase.from('products').select('*').order('sort_order');
        if (prodData && prodData.length > 0) setProducts(prodData);

        const { data: custData } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (custData && custData.length > 0) setCustomers(custData);

        const { data: pageData } = await supabase.from('page_content').select('*');
        if (pageData) {
          pageData.forEach((row) => {
            if (row.key === 'hero_section') setHeroContent(row.content);
            if (row.key === 'store_info') setStoreInfo(row.content);
          });
        }
      } catch (err) {
        console.log('Supabase offline or mock fallback', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSupabaseData();
  }, []);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#F43F5E', '#10B981', '#F59E0B']
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const loginAdmin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.signInWithPassword({ email, password: pass });

      if (data?.session || (email === 'admin@demo.com' && pass === 'password123')) {
        setIsAuthenticated(true);
        setUserEmail(email);
        localStorage.setItem('mama_auth', 'true');
        localStorage.setItem('mama_user_email', email);
        return true;
      }
      return false;
    } catch {
      if (email === 'admin@demo.com' && pass === 'password123') {
        setIsAuthenticated(true);
        setUserEmail(email);
        localStorage.setItem('mama_auth', 'true');
        localStorage.setItem('mama_user_email', email);
        return true;
      }
      return false;
    }
  };

  const logoutAdmin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Signout error', e);
    }
    setIsAuthenticated(false);
    setUserEmail(null);
    localStorage.removeItem('mama_auth');
    localStorage.removeItem('mama_user_email');
  };

  const updateHeroContent = async (newContent: HeroSectionContent) => {
    setHeroContent(newContent);
    try {
      await supabase.from('page_content').upsert({
        key: 'hero_section',
        content: newContent,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.log('Saved hero to local state', e);
    }
  };

  const updateStoreInfo = async (newInfo: StoreInfoContent) => {
    setStoreInfo(newInfo);
    try {
      await supabase.from('page_content').upsert({
        key: 'store_info',
        content: newInfo,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.log('Saved store info to local state', e);
    }
  };

  const saveProduct = async (prodData: Partial<Product>) => {
    if (prodData.id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === prodData.id ? ({ ...p, ...prodData } as Product) : p))
      );
      try {
        await supabase.from('products').update(prodData).eq('id', prodData.id);
      } catch (e) {
        console.log('Updated product locally', e);
      }
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        name: prodData.name || 'Nuevo Producto',
        description: prodData.description || '',
        price: prodData.price || 0,
        unit: prodData.unit || '100g',
        image_url: prodData.image_url || 'https://images.unsplash.com/photo-1524182576066-1d96117a7616?w=600&q=80',
        category_id: prodData.category_id || categories[0]?.id || 'cat-1',
        is_featured: prodData.is_featured ?? false,
        is_available: prodData.is_available ?? true,
        badge_text: prodData.badge_text || '',
        sort_order: products.length + 1,
      };
      setProducts((prev) => [newProd, ...prev]);
      try {
        await supabase.from('products').insert([newProd]);
      } catch (e) {
        console.log('Inserted product locally', e);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.log('Deleted product locally', e);
    }
  };

  const saveCustomer = async (custData: Partial<Customer>) => {
    if (custData.id) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === custData.id ? ({ ...c, ...custData } as Customer) : c))
      );
      try {
        await supabase.from('customers').update(custData).eq('id', custData.id);
      } catch (e) {
        console.log('Updated customer locally', e);
      }
    } else {
      const newCust: Customer = {
        id: 'cust-' + Date.now(),
        name: custData.name || 'Cliente Nuevo',
        phone: custData.phone || '',
        address: custData.address || '',
        notes: custData.notes || '',
        latitude: custData.latitude,
        longitude: custData.longitude,
        google_maps_url: custData.google_maps_url || (custData.latitude ? `https://www.google.com/maps?q=${custData.latitude},${custData.longitude}` : ''),
        last_order_details: custData.last_order_details || '',
        last_order_amount: custData.last_order_amount || 0,
        last_order_date: custData.last_order_date || simulatedDate,
        debt_amount: custData.debt_amount ?? (custData.last_order_amount || 0),
        cobro_date: custData.cobro_date || simulatedDate,
        cobro_notes: custData.cobro_notes || '',
        payment_method: custData.payment_method || 'EFECTIVO',
        payment_status: custData.payment_status || 'PENDIENTE',
        created_at: new Date().toISOString()
      };
      setCustomers((prev) => [newCust, ...prev]);
      try {
        await supabase.from('customers').insert([newCust]);
      } catch (e) {
        console.log('Inserted customer locally', e);
      }
    }
  };

  const deleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (e) {
      console.log('Deleted customer locally', e);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        return URL.createObjectURL(file);
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch {
      return URL.createObjectURL(file);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        customers,
        expenses,
        simulatedDate,
        heroContent,
        storeInfo,
        selectedCategory,
        searchQuery,
        cart,
        isAuthenticated,
        userEmail,
        isLoading,
        setSimulatedDate,
        setSelectedCategory,
        setSearchQuery,
        addToCart,
        removeFromCart,
        clearCart,
        loginAdmin,
        logoutAdmin,
        updateHeroContent,
        updateStoreInfo,
        saveProduct,
        deleteProduct,
        saveCustomer,
        deleteCustomer,
        uploadImageToStorage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
