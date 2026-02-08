import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { motion } from 'framer-motion';
import { login } from '../api/auth';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Login attempt:', formData);
        // Simulate successful login
        setLoading(true)


        try {
            const response = await login(formData);
            if(response.success) {
                localStorage.setItem('accessToken', response?.data?.accessToken)
                localStorage.setItem('refreshToken', response?.data?.refreshToken);
                localStorage.setItem('userId', response.data.userId);
                navigate('/chat');
            } else {
                setError(response.error || 'Login Failed')
            }
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong. Please try again.")
        } finally {
            setLoading(false);
        }

    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue your conversations"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Email Address
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Password
                        </label>
                        <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            Forgot?
                        </a>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group transition-all"
                >
                    { loading ? 'Singing In...' : 'Sign In'}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> }
                </motion.button>
            </form>

            <p className="mt-8 text-center text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                    Create Account
                </Link>
            </p>
        </AuthLayout>
    );
};

export default Login;
