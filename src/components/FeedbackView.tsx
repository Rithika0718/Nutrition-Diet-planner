import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { Star, MessageSquare, Send, ClipboardList } from 'lucide-react';
import { Feedback, DietPlan } from '../types';

export default function FeedbackView() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestPlan, setLatestPlan] = useState<DietPlan | null>(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Fetch latest plan
      const planQ = query(
        collection(db, 'dietPlans'),
        where('uid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const planSnap = await getDocs(planQ);
      if (!planSnap.empty) {
        setLatestPlan({ id: planSnap.docs[0].id, ...planSnap.docs[0].data() } as DietPlan);
      }

      // Fetch previous feedbacks
      const feedbackQ = query(
        collection(db, 'feedback'),
        where('uid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const feedbackSnap = await getDocs(feedbackQ);
      setFeedbacks(feedbackSnap.docs.map(doc => doc.data() as Feedback));
    } catch (error: any) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.currentUser || !latestPlan) return;

    setSubmitting(true);
    try {
      const newFeedback: Feedback = {
        uid: auth.currentUser.uid,
        planId: latestPlan.id!,
        rating,
        comments,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'feedback'), newFeedback);
      setFeedbacks([newFeedback, ...feedbacks]);
      setComments('');
      setRating(5);
      toast.success('Feedback submitted! We will use this to improve your next plan.');
    } catch (error: any) {
      toast.error('Failed to submit feedback: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="text-stone-500 font-medium">Loading feedback history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100 h-fit">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-emerald-800 mb-2 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            Weekly Feedback
          </h2>
          <p className="text-stone-500 text-sm">How was your diet plan this week? Your feedback helps AI adjust your future meals.</p>
        </div>

        {!latestPlan ? (
          <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Generate a diet plan first to provide feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-lg transition-all ${
                      rating >= star ? 'text-amber-400 scale-110' : 'text-stone-200 hover:text-stone-300'
                    }`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Comments</label>
              <textarea
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-32"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What did you like? What was difficult? Any changes in energy or weight?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          Feedback History
        </h3>
        
        {feedbacks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-stone-100 text-center text-stone-400 italic">
            No feedback history yet.
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${f.rating >= s ? 'text-amber-400 fill-current' : 'text-stone-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-stone-400">{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-stone-600 text-sm italic leading-relaxed">"{f.comments}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
