'use client';
import { useState, Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { login } from '@/lib/auth';
import { checkAuthDataFromServer } from '@/lib/authUtils';

// Add global styles - same as dashboard
const globalStyles = `
  ::-webkit-scrollbar {
    display: none;
  }
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // 检查用户是否已登录
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                // 检查服务端HttpOnly Cookie（包括会话级别和长期Cookie）
                const { isLoggedIn } = await checkAuthDataFromServer();
                if (isLoggedIn) {
                    router.push('/dashboard');
                    return;
                }
            } catch (error) {
                console.error('检查登录状态失败:', error);
            }
            
            setIsChecking(false);
        };

        checkLoginStatus();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const result = await login(formData.email, formData.password, rememberMe);
            
            if (result.data?.auth_data) {
                // 认证数据已保存在HttpOnly Cookie中
                // 勾选"记住我"：30天过期，不勾选：会话级别
                router.push('/dashboard');
                router.refresh();
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        // Implementation for password reset functionality
        alert(`Password reset email sent to ${resetEmail}`);
        setForgotPasswordOpen(false);
    };

    // 如果正在检查登录状态，显示加载页面
    if (isChecking) {
        return (
            <>
                <style jsx global>{globalStyles}</style>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">检查登录状态...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
      <>
        <style jsx global>{globalStyles}</style>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          {/* Grid Background - same as dashboard */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
            backgroundImage: `
              linear-gradient(rgb(0, 0, 0) 1px, transparent 1px),
              linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="relative z-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <a href="/">
                <img
                  alt="Linkeless"
                  src="/Linkeless.png"
                  className="mx-auto h-10 w-auto cursor-pointer"
                />
              </a>
              <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-gray-100">
                登录您的账户
              </h2>
            </div>
    
            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>
                  )}
                  <div>
                    <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-200">
                      邮箱地址
                    </label>
                    <div className="mt-2">
                                           <input
                       id="email"
                       name="email"
                       type="email"
                       required
                       autoComplete="email"
                       value={formData.email}
                       onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                       className="block w-full rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-base text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all duration-200"
                     />
                    </div>
                  </div>
        
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-200">
                        密码
                      </label>
                      <div className="text-sm">
                        <button 
                          type="button"
                          onClick={() => setForgotPasswordOpen(true)}
                          className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                        >
                          忘记密码？
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                                             <input
                         id="password"
                         name="password"
                         type="password"
                         required
                         autoComplete="current-password"
                         value={formData.password}
                         onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                         className="block w-full rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-base text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all duration-200"
                       />
                    </div>
                  </div>

                                     {/* Remember me checkbox */}
                   <div className="flex items-center">
                     <input
                       id="remember-me"
                       name="remember-me"
                       type="checkbox"
                       checked={rememberMe}
                       onChange={(e) => setRememberMe(e.target.checked)}
                       className="h-4 w-4 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:ring-offset-0 transition-all duration-200"
                     />
                     <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                       记住我
                     </label>
                   </div>
        
                  <div>
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 px-3 py-3 text-sm/6 font-semibold text-white shadow-lg hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      登录
                                         </button>
                   </div>
                 </form>
    
              <p className="mt-8 text-center text-sm/6 text-gray-500 dark:text-gray-400">
                还没有账户？{' '}
                <a href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200">
                  立即注册
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Forgot Password Dialog using Headless UI */}
        <Transition appear show={forgotPasswordOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setForgotPasswordOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      重置密码
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        输入您的邮箱地址，我们将发送重置密码的链接给您。
                      </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="mt-4">
                      <div className="mb-4">
                        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          邮箱地址
                        </label>
                        <input
                          type="email"
                          id="reset-email"
                          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 text-gray-900 dark:text-gray-100 transition-all duration-200"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/20 dark:focus:ring-gray-400/20 transition-all duration-200"
                          onClick={() => setForgotPasswordOpen(false)}
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 dark:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all duration-200"
                        >
                          发送重置链接
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </>
    )
}
