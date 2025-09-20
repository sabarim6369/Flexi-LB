// src/store/useLBStore.js
import { create } from "zustand";

const useLBStore = create((set) => ({
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
}));

export default useLBStore;
