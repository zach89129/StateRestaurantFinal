"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CartItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  imageSrc: string | null;
  price?: number | null;
  venueId?: string;
  venueName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartFromDatabase: () => Promise<boolean>;
  itemCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncTimeout, setSyncTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load cart from API on mount and session change
  useEffect(() => {
    const fetchCart = async () => {
      if (status === "loading") return;

      setIsLoading(true);

      if (session?.user) {
        try {
          // Try to fetch from server first
          const response = await fetch("/api/cart");
          if (response.ok) {
            const data = await response.json();

            if (data.items && data.items.length > 0) {
              // API now returns fully populated cart items
              setItems(data.items);
            } else {
              // Try fallback to localStorage
              const savedCart = localStorage.getItem(
                `cart_${session.user.email}`
              );
              if (savedCart) {
                setItems(JSON.parse(savedCart));
                // Sync local cart to server
                syncCartToServer(JSON.parse(savedCart));
              } else {
                setItems([]);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          // Fallback to localStorage
          const savedCart = localStorage.getItem(`cart_${session.user.email}`);
          if (savedCart) {
            setItems(JSON.parse(savedCart));
          }
        }
      } else if (status === "unauthenticated") {
        // Just use localStorage for unauthenticated users
        setItems([]);
      }

      setIsLoading(false);
    };

    fetchCart();
  }, [session, status]);

  // Sync cart to server with debounce
  const syncCartToServer = (cartItems: CartItem[]) => {
    // Clear any existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    // Set a new timeout to sync cart
    const timeout = setTimeout(async () => {
      if (session?.user) {
        try {
          const simplifiedItems = cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            venueId: item.venueId || "0",
          }));

          await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items: simplifiedItems }),
          });
        } catch (error) {
          console.error("Error syncing cart to server:", error);
        }
      }
    }, 1000); // 1 second debounce

    setSyncTimeout(timeout);
  };

  // Save cart to localStorage and sync to server whenever it changes
  useEffect(() => {
    if (session?.user && !isLoading) {
      localStorage.setItem(`cart_${session.user.email}`, JSON.stringify(items));
      syncCartToServer(items);
    }
  }, [items, session, isLoading]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity: number) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.id === item.id);
      if (existingItem) {
        return currentItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...currentItems, { ...item, quantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // New method to directly clear cart from database
  const clearCartFromDatabase = async (): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (response.ok) {
        // Clear local cart too
        clearCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error clearing cart from database:", error);
      return false;
    }
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        clearCartFromDatabase,
        itemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
