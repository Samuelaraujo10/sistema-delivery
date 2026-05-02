import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      establishment: null,

      addItem: (product, establishment, quantity = 1) => {
        const { items, establishment: currentEst } = get();
        
        // Se mudar de estabelecimento, limpa o carrinho
        if (currentEst && currentEst.id !== establishment.id) {
          set({
            items: [{ ...product, quantity, cartId: Date.now() }],
            establishment,
          });
          return;
        }

        // Para produtos com modificadores, comparamos a seleção
        const existing = items.find(i => 
          i.id === product.id && 
          JSON.stringify(i.selectedModifiers) === JSON.stringify(product.selectedModifiers)
        );

        if (existing) {
          set({
            items: items.map(i =>
              i.cartId === existing.cartId ? { ...i, quantity: i.quantity + quantity } : i
            ),
            establishment,
          });
        } else {
          set({
            items: [...items, { ...product, quantity, cartId: Date.now() }],
            establishment,
          });
        }
      },

      removeItem: (cartId) => {
        const { items } = get();
        const newItems = items.filter(i => i.cartId !== cartId);
        set({ items: newItems, establishment: newItems.length === 0 ? null : get().establishment });
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId);
          return;
        }
        set({ items: get().items.map(i => i.cartId === cartId ? { ...i, quantity } : i) });
      },

      clearCart: () => set({ items: [], establishment: null }),

      getTotal: () => {
        const { items, establishment } = get();
        const subtotal = items.reduce((sum, i) => {
          const price = i.totalPrice || i.price;
          return sum + parseFloat(price) * i.quantity;
        }, 0);
        const deliveryFee = parseFloat(establishment?.deliveryFee || 0);
        return { subtotal, deliveryFee, total: subtotal + deliveryFee };
      },

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'delivery-cart' }
  )
);
