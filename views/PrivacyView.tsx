import { Link } from 'react-router-dom';

export default function PrivacyView() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-[#9ab] text-sm leading-relaxed">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#567] hover:text-[#00e054] transition-colors"
      >
        <i className="fas fa-arrow-left" /> Back to profile
      </Link>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight">Privacy</h1>
      <p className="text-[#567] text-xs font-bold uppercase tracking-widest">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <section className="space-y-3">
        <h2 className="text-white text-xs font-black uppercase tracking-widest">What we store</h2>
        <p>
          Travel Muse stores your travel logs, profile, saved recommendations, and squad trip data. When you sign in with
          Google, we sync this data to Firebase (Firestore) under your account. A copy may also be kept in your browser
          (local storage) for faster loading and offline resilience.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-white text-xs font-black uppercase tracking-widest">Third parties</h2>
        <p>
          We use Google Firebase for authentication and database, and server-side Google AI (Gemini) for optional features
          like recommendations and search. Those services process requests according to their own terms and privacy policies.
          Maps and related tools may be invoked by the AI backend when you use those features.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-white text-xs font-black uppercase tracking-widest">Your choices</h2>
        <p>
          You can delete your cloud data and sign out from your Profile. That removes your Firestore user document,
          location documents, and clears the local app cache key in this browser. To revoke Google access entirely, use
          your Google Account security settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-white text-xs font-black uppercase tracking-widest">Contact</h2>
        <p>For privacy questions, contact the operator of this deployment (site owner).</p>
      </section>
    </div>
  );
}
