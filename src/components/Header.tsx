import { Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../types/theme';

interface HeaderProps {
  isOnline: boolean;
  error: string | null;
}

export function Header({ isOnline, error }: HeaderProps) {
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  return (
    <div
      className={`${currentTheme.colors.background.secondary} border-b ${currentTheme.colors.border.primary} p-4 md:p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${currentTheme.colors.text.primary}`}>
            Chat
          </h2>
          <p className={`text-sm ${currentTheme.colors.text.tertiary}`}>
            Get multi-perspective insights on any topic
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className={`w-4 h-4 ${currentTheme.colors.text.primary}`} />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span
            className={`text-xs ${isOnline ? currentTheme.colors.text.tertiary : 'text-red-400'}`}
          >
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {error && (
        <div className={`mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10`}>
          <p className="text-red-200 text-sm">{error}</p>
          {!isOnline && (
            <p className="text-red-200/70 text-xs mt-1">
              Make sure the backend server is running on http://localhost:8000
            </p>
          )}
        </div>
      )}
    </div>
  );
}
