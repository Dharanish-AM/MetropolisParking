export const theme = {
  colors: {
    brand: {
      primary: '#000000',
      purple: '#5A3AFB',
    },
    neutral: {
      primary: '#0F172A',
      secondary: '#64748B',
      border: '#ECEFF3',
      bg: '#FFFFFF',
    },
    status: {
      AVAILABLE: {
        color: '#10B981',
        bg: 'bg-status-available/10',
        text: 'text-status-available',
        border: 'border-status-available/20',
        badge: 'bg-status-available/10 text-status-available border border-status-available/20',
      },
      OCCUPIED: {
        color: '#EF4444',
        bg: 'bg-status-occupied/10',
        text: 'text-status-occupied',
        border: 'border-status-occupied/20',
        badge: 'bg-status-occupied/10 text-status-occupied border border-status-occupied/20',
      },
      RESERVED: {
        color: '#F59E0B',
        bg: 'bg-status-reserved/10',
        text: 'text-status-reserved',
        border: 'border-status-reserved/20',
        badge: 'bg-status-reserved/10 text-status-reserved border border-status-reserved/20',
      },
      OUT_OF_SERVICE: {
        color: '#6B7280',
        bg: 'bg-status-out-of-service/10',
        text: 'text-status-out-of-service',
        border: 'border-status-out-of-service/20',
        badge: 'bg-status-out-of-service/10 text-status-out-of-service border border-status-out-of-service/20',
      },
    },
  },
  components: {
    card: 'bg-white border border-neutral-border rounded-2xl p-6',
    input: 'block w-full px-4 py-3 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple focus:border-brand-purple transition-all font-sans',
    inputMono: 'block w-full px-4 py-3 bg-white border border-neutral-border rounded-xl text-neutral-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple focus:border-brand-purple transition-all font-mono',
    buttonPrimary: 'w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-black hover:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm',
    buttonSecondary: 'w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-neutral-border/40 text-neutral-primary hover:bg-neutral-border/60 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer',
  },
  transitions: 'transition-all duration-150',
};
export type Theme = typeof theme;
export type StatusType = keyof typeof theme.colors.status;
