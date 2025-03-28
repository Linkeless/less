'use client';
import { useState } from 'react';
import { register, sendVerificationEmail } from '@/lib/actions';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EnvelopeIcon, KeyIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        invite_code: '',
        verify_code: ''
    });
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [isErrorOpen, setIsErrorOpen] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const handleSendVerification = async () => {
        if (!formData.email) {
            setError('请输入邮箱地址');
            setIsErrorOpen(true);
            return;
        }
        try {
            await sendVerificationEmail(formData.email);
            setVerificationSent(true);
            setError('验证码已发送到您的邮箱');
            setIsErrorOpen(true);
        } catch (err: any) {
            setError(err.message || '发送验证码失败');
            setIsErrorOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (passwordStrength < 3) {
            setError('密码强度不足，请包含大写字母、数字和特殊字符');
            setIsErrorOpen(true);
            return;
        }
        
        try {
            const response = await register({
                ...formData,
                email_code: formData.verify_code,
            });
            
            if (response.data && response.data.auth_data) {
                localStorage.setItem('auth_data', response.data.auth_data);
                window.location.href = '/dashboard';
            } else {
                setError('注册失败');
                setIsErrorOpen(true);
            }
        } catch (err: any) {
            // 检查是否为未登录错误
            if (err.message?.includes('未登录') || err.message?.includes('unauthorized') || err.status === 401) {
                setError('请先登录后再访问此功能');
                setIsErrorOpen(true);
                // 可以在几秒后自动跳转到登录页面
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                setError(err.message || '注册失败');
                setIsErrorOpen(true);
            }
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setFormData(prev => ({...prev, password: newPassword}));
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <img
                    alt="Linkeless"
                    src="/Linkeless.png"
                    className="mx-auto h-10 w-auto"
                />
                <h2 className="mt-10 text-center text-2xl font-bold text-gray-900">
                    创建您的账户
                </h2>
            </div>

            {/* 错误提示对话框 */}
            <Transition appear show={isErrorOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setIsErrorOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        {verificationSent ? '通知' : '错误'}
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">{error}</p>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            onClick={() => setIsErrorOpen(false)}
                                        >
                                            确定
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                            邮箱地址
                        </label>
                        <div className="mt-2 flex gap-2">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="请输入您的邮箱地址"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                                    className="block w-full rounded-md pl-10 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleSendVerification}
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors"
                                disabled={verificationSent}
                            >
                                {verificationSent ? '已发送' : '发送验证码'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="verify_code" className="block text-sm font-medium text-gray-900">
                            验证码
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="verify_code"
                                name="verify_code"
                                type="text"
                                autoComplete="one-time-code"
                                required
                                placeholder="请输入验证码"
                                value={formData.verify_code}
                                onChange={(e) => setFormData(prev => ({...prev, verify_code: e.target.value}))}
                                className="block w-full rounded-md pl-10 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="invite_code" className="block text-sm font-medium text-gray-900">
                            邀请码（可选）
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="invite_code"
                                name="invite_code"
                                type="text"
                                placeholder="如有邀请码请在此输入"
                                value={formData.invite_code}
                                onChange={(e) => setFormData(prev => ({...prev, invite_code: e.target.value}))}
                                className="block w-full rounded-md pl-10 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                            密码
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="请设置您的密码"
                                value={formData.password}
                                onChange={handlePasswordChange}
                                className="block w-full rounded-md pl-10 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            />
                        </div>
                        <div className="mt-1">
                            <div className="flex h-2 gap-1">
                                <div className={`h-full w-1/4 rounded-sm transition-colors ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                <div className={`h-full w-1/4 rounded-sm transition-colors ${passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                <div className={`h-full w-1/4 rounded-sm transition-colors ${passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                <div className={`h-full w-1/4 rounded-sm transition-colors ${passwordStrength >= 4 ? 'bg-green-700' : 'bg-gray-200'}`}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">密码应包含大小写字母、数字和特殊字符</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors"
                    >
                        注册
                    </button>
                </form>

                <p className="mt-10 text-center text-sm text-gray-500">
                    已有账户？{' '}
                    <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        登录
                    </a>
                </p>
            </div>
        </div>
    );
}
