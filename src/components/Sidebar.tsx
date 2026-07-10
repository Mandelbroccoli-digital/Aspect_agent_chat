import { useState } from 'react';
import { Menu, X, Moon, Sun, Palette, MessageSquare, Sparkles, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { themes, type ThemeType } from '../types/theme';

interface SidebarProps {
  onClearChat: () => void;
}

export function Sidebar({ onClearChat }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const currentTheme = themes[theme];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg border transition-colors ${
          currentTheme.colors.border.primary
        } ${currentTheme.colors.background.tertiary}`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar Background Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 z-40 flex flex-col transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${currentTheme.colors.background.secondary} border-r ${currentTheme.colors.border.primary}`}
      >
        {/* Logo Section */}
        <div className={`p-6 border-b ${currentTheme.colors.border.primary}`}>
          <h1 className={`text-2xl font-bold ${currentTheme.colors.text.primary}`}>
            Aspect AI
          </h1>
          <p className={`text-sm ${currentTheme.colors.text.tertiary}`}>
            Multi-perspective conversations
          </p>
        </div>

        {/* Navigation Section */}
        <div className={`flex-1 p-6 space-y-8 overflow-y-auto`}>
          {/* Aspects Info */}
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${currentTheme.colors.text.tertiary}`}>
              Aspects
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5" />
                <div>
                  <p className={`text-sm font-semibold ${currentTheme.colors.text.primary}`}>
                    Logic
                  </p>
                  <p className={`text-xs ${currentTheme.colors.text.tertiary}`}>
                    Structured reasoning
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5" />
                <div>
                  <p className={`text-sm font-semibold ${currentTheme.colors.text.primary}`}>
                    Creative
                  </p>
                  <p className={`text-xs ${currentTheme.colors.text.tertiary}`}>
                    Imaginative ideas
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5" />
                <div>
                  <p className={`text-sm font-semibold ${currentTheme.colors.text.primary}`}>
                    Analytical
                  </p>
                  <p className={`text-xs ${currentTheme.colors.text.tertiary}`}>
                    Data insights
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${currentTheme.colors.text.tertiary}`}>
              Theme
            </h2>
            <div className="space-y-2">
              {(Object.keys(themes) as ThemeType[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all text-left text-sm ${
                    theme === themeKey
                      ? `${currentTheme.colors.background.tertiary} border-white/40`
                      : `${currentTheme.colors.background.primary} border-transparent hover:border-white/20`
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {themeKey === 'dark' && <Moon className="w-4 h-4" />}
                    {themeKey === 'light' && <Sun className="w-4 h-4" />}
                    {themeKey === 'brutalist' && <Palette className="w-4 h-4" />}
                    <span>{themes[themeKey].label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className={`p-6 border-t ${currentTheme.colors.border.primary} space-y-2`}>
          <button
            onClick={() => {
              onClearChat();
              setIsOpen(false);
            }}
            className={`w-full px-4 py-3 rounded-lg border transition-colors text-sm font-medium ${
              currentTheme.colors.border.primary
            } ${currentTheme.colors.background.tertiary} hover:opacity-80`}
          >
            Clear Chat
          </button>
        </div>
      </aside>

      {/* Main content spacing */}
      <div className="md:ml-64" />
    </>
  );
}
