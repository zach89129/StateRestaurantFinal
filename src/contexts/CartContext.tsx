"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSalesTeamVenue } from "@/contexts/SalesTeamVenueContext";

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
  const { salesVenue } = useSalesTeamVenue();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from API on mount and session change
  useEffect(() => {
    const fetchCart = async () => {
      if (status === "loading") return;

      setIsLoading(true);

      if (session?.user) {
        try {
          const response = await fetch("/api/cart");
          if (response.ok) {
            const data = await response.json();
            if (data.items) {
              setItems(data.items);
              // Update localStorage with DB data
              localStorage.setItem(
                `cart_${session.user.email}`,
                JSON.stringify(data.items)
              );
            } else {
              setItems([]);
              localStorage.setItem(
                `cart_${session.user.email}`,
                JSON.stringify([])
              );
            }
          } else {
            // If DB fetch fails, try localStorage as fallback
            const savedCart = localStorage.getItem(
              `cart_${session.user.email}`
            );
            if (savedCart) {
              setItems(JSON.parse(savedCart));
            } else {
              setItems([]);
            }
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          // Fallback to localStorage only if DB fetch fails
          const savedCart = localStorage.getItem(`cart_${session.user.email}`);
          if (savedCart) {
            setItems(JSON.parse(savedCart));
          } else {
            setItems([]);
          }
        }
      } else if (status === "unauthenticated") {
        setItems([]);
      }

      setIsLoading(false);
    };

    fetchCart();
  }, [session, status]);

  // Helper function to update both DB and localStorage
  const updateCart = async (newItems: CartItem[]) => {
    if (!session?.user) return false;

    try {
      const simplifiedItems = newItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        venueId: item.venueId || "0",
      }));

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: simplifiedItems }),
      });

      if (response.ok) {
        // Only update localStorage after successful DB update
        localStorage.setItem(
          `cart_${session.user.email}`,
          JSON.stringify(newItems)
        );
        setItems(newItems);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating cart:", error);
      return false;
    }
  };

  const addItem = async (
    item: Omit<CartItem, "quantity">,
    quantity: number
  ) => {
    const newItems = [...items];

    // If user is sales team and has a venue selected, add venueId to the item
    const shouldAddVenue =
      session?.user?.isSalesTeam && salesVenue > 0 && !item.venueId;
    const itemWithVenue = shouldAddVenue
      ? { ...item, venueId: salesVenue.toString() }
      : item;

    const existingItem = newItems.find((i) => {
      // Match both id and venueId (if exists) to prevent mixing items from different venues
      if (itemWithVenue.venueId) {
        return i.id === itemWithVenue.id && i.venueId === itemWithVenue.venueId;
      }
      return i.id === itemWithVenue.id && !i.venueId;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      newItems.push({ ...itemWithVenue, quantity });
    }

    await updateCart(newItems);
  };

  const removeItem = async (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    await updateCart(newItems);
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }

    const newItems = items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );

    await updateCart(newItems);
  };

  const clearCart = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (response.ok) {
        setItems([]);
        localStorage.setItem(`cart_${session.user.email}`, JSON.stringify([]));
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const clearCartFromDatabase = async (): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (response.ok) {
        setItems([]);
        localStorage.setItem(`cart_${session.user.email}`, JSON.stringify([]));
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
