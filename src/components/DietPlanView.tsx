import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { generateDietPlan } from '../services/gemini';
import { UserProfile, DietPlan, DayPlan, Meal } from '../types';
import { toast } from 'sonner';
import { Calendar, ChevronRight, ChevronLeft, Utensils, Info, X, Clock, Flame, Beef, Wheat, Droplets, ClipboardList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  profile: UserProfile;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DietPlanView({ profile }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<DietPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  useEffect(() => {
    fetchLatestPlan();
  }, [profile]);

  async function fetchLatestPlan() {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'dietPlans'),
        where('uid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setCurrentPlan({ id: doc.id, ...doc.data() } as DietPlan);
      }
    } catch (error: any) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const planData = await generateDietPlan(profile);
      if (!auth.currentUser) return;

      const newPlan: DietPlan = {
        uid: auth.currentUser.uid,
        plan: planData,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'dietPlans'), newPlan);
      setCurrentPlan({ ...newPlan, id: docRef.id });
      toast.success('New 7-day diet plan generated!');
    } catch (error: any) {
      toast.error('Failed to generate plan: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="text-stone-500 font-medium">Loading your nutrition plan...</p>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-3xl shadow-xl border border-stone-100 p-12">
        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-stone-800 mb-4">No Diet Plan Yet</h2>
        <p className="text-stone-500 mb-8 text-lg">
          Ready to start your journey? Our AI will analyze your profile and create a personalized 7-day meal plan for you.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              Generating Your Plan...
            </>
          ) : (
            'Generate My 7-Day Plan'
          )}
        </button>
      </div>
    );
  }

  const dayPlan = currentPlan.plan[selectedDay];

  if (!dayPlan) {
    return (
      <div className="space-y-8">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800">
          <p className="font-bold mb-2">Plan Data Missing for {selectedDay}</p>
          <p className="text-sm">There was an issue retrieving the plan for this day. Please try regenerating the plan.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition-all"
          >
            {generating ? 'Generating...' : 'Regenerate Plan'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Your Weekly Nutrition</h2>
          <p className="text-stone-500">Personalized for {profile.goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'}</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-all disabled:opacity-50"
        >
          {generating ? 'Regenerating...' : 'Regenerate Plan'}
        </button>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
          const meal = dayPlan[mealType as keyof DayPlan] as Meal;
          if (!meal) return null;
          return (
            <motion.div
              key={mealType}
              layoutId={mealType}
              onClick={() => setSelectedMeal(meal)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  {mealType}
                </span>
                <Utensils className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2 line-clamp-2">{meal.name}</h3>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {meal.calories} kcal</span>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                <span className="flex flex-col items-center"><Beef className="w-3 h-3 mb-1" /> P: {meal.protein}g</span>
                <span className="flex flex-col items-center"><Wheat className="w-3 h-3 mb-1" /> C: {meal.carbs}g</span>
                <span className="flex flex-col items-center"><Droplets className="w-3 h-3 mb-1" /> F: {meal.fats}g</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedMeal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="text-2xl font-bold text-stone-800">{selectedMeal.name}</h3>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-stone-500" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-8">
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Calories</p>
                    <p className="text-xl font-bold text-emerald-800">{selectedMeal.calories}</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Protein</p>
                    <p className="text-xl font-bold text-stone-800">{selectedMeal.protein}g</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Carbs</p>
                    <p className="text-xl font-bold text-stone-800">{selectedMeal.carbs}g</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Fats</p>
                    <p className="text-xl font-bold text-stone-800">{selectedMeal.fats}g</p>
                  </div>
                </div>

                <div className="prose prose-emerald max-w-none">
                  <h4 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-emerald-600" />
                    Recipe Instructions
                  </h4>
                  <div className="text-stone-600 leading-relaxed">
                    <ReactMarkdown>{selectedMeal.recipe}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50 text-center">
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="bg-stone-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-900 transition-colors"
                >
                  Close Recipe
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
