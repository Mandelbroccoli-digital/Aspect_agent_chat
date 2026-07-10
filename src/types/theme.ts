export type ThemeType = 'dark' | 'light' | 'brutalist';

export interface Theme {
  name: ThemeType;
  label: string;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: {
      primary: string;
      secondary: string;
    };
    accent: {
      logic: string;
      creative: string;
      analytical: string;
    };
  };
}

export const themes: Record<ThemeType, Theme> = {
  dark: {
    name: 'dark',
    label: 'Dark',
    colors: {
      background: {
        primary: 'bg-slate-950',
        secondary: 'bg-slate-900',
        tertiary: 'bg-slate-800',
      },
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-500',
      },
      border: {
        primary: 'border-slate-700',
        secondary: 'border-slate-600',
      },
      accent: {
        logic: 'from-blue-500 to-blue-600',
        creative: 'from-purple-500 to-purple-600',
        analytical: 'from-emerald-500 to-emerald-600',
      },
    },
  },
  light: {
    name: 'light',
    label: 'Light',
    colors: {
      background: {
        primary: 'bg-white',
        secondary: 'bg-slate-50',
        tertiary: 'bg-slate-100',
      },
      text: {
        primary: 'text-slate-950',
        secondary: 'text-slate-700',
        tertiary: 'text-slate-500',
      },
      border: {
        primary: 'border-slate-200',
        secondary: 'border-slate-300',
      },
      accent: {
        logic: 'from-blue-600 to-blue-700',
        creative: 'from-purple-600 to-purple-700',
        analytical: 'from-emerald-600 to-emerald-700',
      },
    },
  },
  brutalist: {
    name: 'brutalist',
    label: 'Brutalist',
    colors: {
      background: {
        primary: 'bg-black',
        secondary: 'bg-neutral-950',
        tertiary: 'bg-neutral-900',
      },
      text: {
        primary: 'text-white',
        secondary: 'text-gray-400',
        tertiary: 'text-gray-600',
      },
      border: {
        primary: 'border-white',
        secondary: 'border-gray-700',
      },
      accent: {
        logic: 'from-white to-gray-400',
        creative: 'from-white to-gray-400',
        analytical: 'from-white to-gray-400',
      },
    },
  },
};
