'use client';
import { useState } from 'react';
import api, { sendEmailVerify } from '@/lib/api';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        invite_code: '',
        email_code: '',
        recaptcha_data: '',
        verify_code: ''
    });
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);

    const handleSendVerification = async () => {
        if (!formData.email) {
            setError('Please enter an email address');
            return;
        }
        try {
            await sendEmailVerify(formData.email);
            setVerificationSent(true);
            setError('Verification code sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send verification code');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await api.post('/api/v1/passport/auth/register', {
                ...formData,
                email_code: formData.verify_code // map verify_code to email_code for API
            });
            if (response.data && response.data.auth_data) {
                localStorage.setItem('auth_data', response.data.auth_data);
                window.location.href = '/dashboard';
            } else {
                setError('Registration failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
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
                    Create your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                            Email address
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
                            >
                                Send Code
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="verify_code" className="block text-sm font-medium text-gray-900">
                            Verification Code
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
                            Invite Code (Optional)
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
                            Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                                className="block w-full rounded-md px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Register
                    </button>
                </form>

                <p className="mt-10 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
