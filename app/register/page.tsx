'use client';
import { useState } from 'react';
import { register, sendVerificationEmail } from '@/lib/actions';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        invite_code: '',
        email_code: '',
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
            setError(err.message || '注册失败');
            setIsErrorOpen(true);
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
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                                className="block w-full rounded-md px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                            />
                            <button
                                type="button"
                                onClick={handleSendVerification}
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
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
                        <div className="mt-2">
                            <input
                                id="verify_code"
                                name="verify_code"
                                type="text"
                                required
                                value={formData.verify_code}
                                onChange={(e) => setFormData(prev => ({...prev, verify_code: e.target.value}))}
                                className="block w-full rounded-md px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="invite_code" className="block text-sm font-medium text-gray-900">
                            邀请码（可选）
                        </label>
                        <div className="mt-2">
                            <input
                                id="invite_code"
                                name="invite_code"
                                type="text"
                                value={formData.invite_code}
                                onChange={(e) => setFormData(prev => ({...prev, invite_code: e.target.value}))}
                                className="block w-full rounded-md px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                            密码
                        </label>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handlePasswordChange}
                                className="block w-full rounded-md px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                            />
                        </div>
                        <div className="mt-1">
                            <div className="flex h-2 gap-1">
                                <div className={`h-full w-1/4 rounded-sm ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                <div className={`h-full w-1/4 rounded-sm ${passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                <div className={`h-full w-1/4 rounded-sm ${passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                <div className={`h-full w-1/4 rounded-sm ${passwordStrength >= 4 ? 'bg-green-700' : 'bg-gray-200'}`}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">密码应包含大小写字母、数字和特殊字符</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
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
