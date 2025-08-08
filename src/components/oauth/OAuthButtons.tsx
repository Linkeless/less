'use client';

import React, { useState } from 'react';
import { initiateOAuthLogin } from '@/lib/client';

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onError }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: string) => {
    try {
      setLoading(provider);
      await initiateOAuthLogin(provider);
    } catch (error: any) {
      setLoading(null);
      onError?.(error.message || `${provider} 登录失败`);
    }
  };

  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      bgColor: 'bg-white hover:bg-gray-50 border border-gray-300',
      textColor: 'text-gray-700',
      darkBgColor: 'dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600',
      darkTextColor: 'dark:text-gray-200'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
        </svg>
      ),
      bgColor: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white',
      darkBgColor: 'dark:bg-gray-800 dark:hover:bg-gray-700',
      darkTextColor: 'dark:text-white'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      bgColor: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white',
      darkBgColor: 'dark:bg-blue-600 dark:hover:bg-blue-700',
      darkTextColor: 'dark:text-white'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
            或使用第三方账户登录
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleOAuthLogin(provider.id)}
            disabled={loading === provider.id}
            className={`
              w-full flex items-center justify-center px-4 py-2.5 border text-sm font-medium rounded-lg
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              transition-all duration-200 transform hover:scale-[1.02]
              ${provider.bgColor} ${provider.textColor}
              ${provider.darkBgColor} ${provider.darkTextColor}
              ${loading === provider.id ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading === provider.id ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>登录中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {provider.icon}
                <span>使用 {provider.name} 登录</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OAuthButtons;