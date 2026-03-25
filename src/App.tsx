import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Toaster } from 'sonner';
import { Apple, LogOut, User as UserIcon, Calendar, ClipboardList, MessageSquare } from 'lucide-react';
import Auth from './components/Auth';
import HealthForm from './components/HealthForm';
import DietPlanView from './components/DietPlanView';
import FeedbackView from './components/FeedbackView';
import { UserProfile } from './types';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      }
      setProfileLoading(false);
    }
    fetchProfile();
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <Toaster position="top-center" richColors />
        
        {user && (
          <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <Link to="/" className="flex items-center gap-2 text-emerald-700 font-bold text-xl">
                  <Apple className="w-6 h-6" />
                  <span>NutriPlan AI</span>
                </Link>
                
                <div className="hidden md:flex items-center gap-8">
                  <Link to="/" className="flex items-center gap-2 text-stone-600 hover:text-emerald-600 transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span>My Plan</span>
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 text-stone-600 hover:text-emerald-600 transition-colors">
                    <UserIcon className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link to="/feedback" className="flex items-center gap-2 text-stone-600 hover:text-emerald-600 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>Feedback</span>
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-stone-500 hidden sm:inline">{user.email}</span>
                  <button
                    onClick={() => auth.signOut()}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route 
              path="/" 
              element={
                user ? (
                  profile ? <DietPlanView profile={profile} /> : <Navigate to="/profile" />
                ) : (
                  <Navigate to="/auth" />
                )
              } 
            />
            <Route 
              path="/profile" 
              element={user ? <HealthForm profile={profile} onUpdate={setProfile} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/feedback" 
              element={user ? <FeedbackView /> : <Navigate to="/auth" />} 
            />
          </Routes>
        </main>

        <footer className="bg-white border-t border-stone-200 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-stone-400 text-sm">
            <p>© 2026 NutriPlan AI. Powered by Gemini.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
