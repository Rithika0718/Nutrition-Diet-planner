import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { User, Ruler, Weight, AlertCircle, Heart, Target } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
  onUpdate: (profile: UserProfile) => void;
}

export default function HealthForm({ profile, onUpdate }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    profile || {
      age: 25,
      height: 170,
      weight: 70,
      allergies: '',
      healthIssues: '',
      goal: 'weight_loss',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const updatedProfile: UserProfile = {
        ...formData as UserProfile,
        uid: auth.currentUser.uid,
        createdAt: profile?.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', auth.currentUser.uid), updatedProfile);
      onUpdate(updatedProfile);
      toast.success('Profile updated successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-emerald-800 mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-emerald-600" />
          Health Profile
        </h2>
        <p className="text-stone-500">Tell us about yourself to generate your personalized diet plan.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <User className="w-4 h-4" /> Age
            </label>
            <input
              type="number"
              required
              min="1"
              max="120"
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={isNaN(formData.age as number) ? '' : formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value === '' ? NaN : parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Height (cm)
            </label>
            <input
              type="number"
              required
              min="50"
              max="250"
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={isNaN(formData.height as number) ? '' : formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value === '' ? NaN : parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <Weight className="w-4 h-4" /> Weight (kg)
            </label>
            <input
              type="number"
              required
              min="20"
              max="300"
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={isNaN(formData.weight as number) ? '' : formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value === '' ? NaN : parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Target className="w-4 h-4" /> Your Goal
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, goal: 'weight_loss' })}
              className={`py-3 rounded-lg border-2 font-semibold transition-all ${
                formData.goal === 'weight_loss'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-stone-100 text-stone-500 hover:border-stone-200'
              }`}
            >
              Weight Loss
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, goal: 'weight_gain' })}
              className={`py-3 rounded-lg border-2 font-semibold transition-all ${
                formData.goal === 'weight_gain'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-stone-100 text-stone-500 hover:border-stone-200'
              }`}
            >
              Weight Gain
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Allergies
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="e.g. Peanuts, Dairy, Shellfish..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Heart className="w-4 h-4" /> Health Issues
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24"
            value={formData.healthIssues}
            onChange={(e) => setFormData({ ...formData, healthIssues: e.target.value })}
            placeholder="e.g. Diabetes, Hypertension, PCOS..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white mx-auto"></div>
          ) : (
            'Save Profile & Continue'
          )}
        </button>
      </form>
    </div>
  );
}
