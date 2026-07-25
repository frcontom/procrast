import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  modalOpen: string | null
  theme: 'dark' | 'light'
  toggleSidebar: () => void
  openModal: (id: string) => void
  closeModal: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  modalOpen: null,
  theme: 'dark',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (modalOpen) => set({ modalOpen }),
  closeModal: () => set({ modalOpen: null }),
  setTheme: (theme) => set({ theme }),
}))
