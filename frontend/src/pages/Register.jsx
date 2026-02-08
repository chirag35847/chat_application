import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { motion } from 'framer-motion';
import { register } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Register attempt:', formData);
        setLoading(true);
        setError('');

        try {
            const response = await register(formData);
            console.log(response)
            if (response.success) {
                localStorage.setItem('accessToken', response?.data?.accessToken)
                localStorage.setItem('refreshToken', response?.data?.refreshToken);
                localStorage.setItem('userId', response.data.userId);
                navigate('/chat');
            } else {
                setError(response.error || 'Register Failed')
            }
        } catch (err) {
            console.log(err)
            setError(err.response?.data?.error || "Something went wrong. Please try again.")
        } finally {
            setLoading(false);
        }

    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join the conversation today"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Full Name
                    </label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                </div>

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
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Password
                    </label>
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

                {
                    error && (
                        <div className='bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-xl'>
                            {error}
                        </div>
                    )
                }

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group transition-all mt-4"
                >
                    { loading ? "Creating Account ..." : "Sign Up"}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> }
                </motion.button>
            </form>

            <p className="mt-8 text-center text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                    Log In
                </Link>
            </p>
        </AuthLayout>
    );
};

export default Register;
