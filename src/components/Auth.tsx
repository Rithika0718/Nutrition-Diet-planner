import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { LogIn, UserPlus, Mail, Lock, Chrome } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-emerald-800 mb-2">
          {isLogin ? 'Welcome Back' : 'Join NutriPlan AI'}
        </h2>
        <p className="text-stone-500">
          {isLogin ? 'Sign in to access your diet plan' : 'Start your health journey today'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email Address
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
          ) : (
            <>
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-stone-500 uppercase tracking-wider">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="mt-6 w-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Chrome className="w-5 h-5 text-emerald-600" />
        Sign in with Google
      </button>

      <p className="mt-8 text-center text-stone-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-emerald-600 font-semibold hover:underline"
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  );
}
