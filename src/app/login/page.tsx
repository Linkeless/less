'use client';
import { useState, Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { login, hasValidToken } from '@/lib/auth-client';
import OAuthButtons from '@/components/oauth/OAuthButtons';

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
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });

    // 检查用户是否已登录和URL参数中的错误信息
    useEffect(() => {
        const checkLoginStatus = () => {
            try {
                // 检查URL参数中是否有错误信息
                const urlParams = new URLSearchParams(window.location.search);
                const urlError = urlParams.get('error');
                if (urlError) {
                    setError(decodeURIComponent(urlError));
                    // 清除URL中的错误参数，但不刷新页面
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('error');
                    window.history.replaceState({}, '', newUrl.toString());
                }

                // 本地检查是否有有效token（不发起HTTP请求，避免循环）
                if (hasValidToken()) {
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

    // 表单验证
    const validateForm = () => {
        const errors = { email: '', password: '' };
        let isValid = true;

        // 邮箱验证
        if (!formData.email.trim()) {
            errors.email = '请输入邮箱地址';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = '请输入有效的邮箱地址';
            isValid = false;
        }

        // 密码验证
        if (!formData.password.trim()) {
            errors.password = '请输入密码';
            isValid = false;
        } else if (formData.password.length < 6) {
            errors.password = '密码至少需要6个字符';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors({ email: '', password: '' });

        // 表单验证
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            const result = await login(formData.email, formData.password, rememberMe);
            
            // 检查登录是否成功 - Bearer Token已存储到cookies中
            if (result.code === 0 || result.data) {
                console.log('登录成功，Bearer Token已存储到cookies中');
                // 跳转到dashboard，认证状态由cookies中的Bearer token维护
                router.push('/dashboard');
                return;
            } else {
                setError(result.message || '登录失败，请检查您的邮箱和密码');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || '网络错误，请稍后重试');
        } finally {
            setIsLoading(false);
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
                       className={`block w-full rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-base text-gray-900 dark:text-gray-100 border placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                         validationErrors.email 
                           ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                           : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20'
                       }`}
                     />
                     {validationErrors.email && (
                       <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
                     )}
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
                         className={`block w-full rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-base text-gray-900 dark:text-gray-100 border placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                           validationErrors.password 
                             ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                             : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20'
                         }`}
                       />
                       {validationErrors.password && (
                         <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
                       )}
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
                      disabled={isLoading}
                      className={`flex w-full justify-center rounded-lg px-3 py-3 text-sm/6 font-semibold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200 ${
                        isLoading 
                          ? 'bg-indigo-400 dark:bg-indigo-400 cursor-not-allowed' 
                          : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 transform hover:scale-[1.02] focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          登录中...
                        </div>
                      ) : (
                        '登录'
                      )}
                                         </button>
                   </div>
                 </form>

              {/* OAuth 第三方登录 */}
              <div className="mt-6">
                <OAuthButtons onError={(error) => setError(error)} />
              </div>
    
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
