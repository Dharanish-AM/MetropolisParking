export const theme = {
  colors: {
    brand: {
      primary: '#6F3FF5',
    },
    neutral: {
      primary: '#111111',
      secondary: '#666666',
      border: '#EAEAEA',
      bg: '#FFFFFF',
    },
    status: {
      AVAILABLE: {
        color: '#22c55e',
        bg: 'bg-status-available/10',
        text: 'text-status-available',
        border: 'border-status-available/20',
        badge: 'bg-status-available/10 text-status-available border border-status-available/20',
      },
      OCCUPIED: {
        color: '#ef4444',
        bg: 'bg-status-occupied/10',
        text: 'text-status-occupied',
        border: 'border-status-occupied/20',
        badge: 'bg-status-occupied/10 text-status-occupied border border-status-occupied/20',
      },
      RESERVED: {
        color: '#f59e0b',
        bg: 'bg-status-reserved/10',
        text: 'text-status-reserved',
        border: 'border-status-reserved/20',
        badge: 'bg-status-reserved/10 text-status-reserved border border-status-reserved/20',
      },
      OUT_OF_SERVICE: {
        color: '#6b7280',
        bg: 'bg-status-out-of-service/10',
        text: 'text-status-out-of-service',
        border: 'border-status-out-of-service/20',
        badge: 'bg-status-out-of-service/10 text-status-out-of-service border border-status-out-of-service/20',
      },
    },
  },
  components: {
    card: 'bg-white border border-neutral-border rounded-2xl shadow-xs p-6',
    input: 'block w-full px-3 py-2.5 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-sans',
    inputMono: 'block w-full px-3 py-2.5 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono',
    buttonPrimary: 'w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm',
    buttonSecondary: 'w-full flex items-center justify-center gap-1.5 py-2.5 border border-neutral-border bg-white text-neutral-primary hover:bg-neutral-border/30 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs',
  },
  transitions: 'transition-all duration-150',
};
export type Theme = typeof theme;
export type StatusType = keyof typeof theme.colors.status;
