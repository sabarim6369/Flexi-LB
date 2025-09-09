// src/store/useLBStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLBStore = create(
  persist(
    (set) => ({
      loadBalancers: [],
      setLoadBalancers: (lbs) => set({ loadBalancers: lbs }),
      addLoadBalancer: (lb) =>
        set((state) => ({ loadBalancers: [...state.loadBalancers, lb] })),
      updateLoadBalancer: (id, updatedLB) =>
        set((state) => ({
          loadBalancers: state.loadBalancers.map((lb) =>
            lb.id === id ? { ...lb, ...updatedLB } : lb
          ),
        })),
      removeLoadBalancer: (id) =>
        set((state) => ({
          loadBalancers: state.loadBalancers.filter((lb) => lb.id !== id),
        })),
    }),
    {
      name: "loadbalancers-storage", 
    }
  )
);

export default useLBStore;
