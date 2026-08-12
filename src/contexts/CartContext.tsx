"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  nome: string;
  tamanho: string;
  preco: number;
  quantidade: number;
  imagem: string;
}

interface CartContextData {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, tamanho: string) => void;
  updateQuantity: (id: string, tamanho: string, quantidade: number) => void;
  cartTotal: number;
  cartCount: number;
  // --- NOVAS FUNÇÕES AQUI ---
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // NOVA TRAVA: Avisa quando o carrinho terminou de carregar da memória
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Carrega os dados salvos quando a página abre
  useEffect(() => {
    const savedCart = localStorage.getItem("@FloresEFe:cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    // Avisa que o carregamento inicial terminou
    setIsInitialized(true);
  }, []);

  // 2. Salva os dados, MAS SÓ DEPOIS de ter carregado a memória inicial
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("@FloresEFe:cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (newItem: CartItem) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find(
        (item) => item.id === newItem.id && item.tamanho === newItem.tamanho,
      );

      if (itemExists) {
        return prevItems.map((item) =>
          item.id === newItem.id && item.tamanho === newItem.tamanho
            ? { ...item, quantidade: item.quantidade + newItem.quantidade }
            : item,
        );
      }
      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (id: string, tamanho: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.id === id && item.tamanho === tamanho)),
    );
  };

  const updateQuantity = (id: string, tamanho: string, quantidade: number) => {
    if (quantidade < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.tamanho === tamanho
          ? { ...item, quantidade }
          : item,
      ),
    );
  };

  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0,
  );
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantidade, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        cartCount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
