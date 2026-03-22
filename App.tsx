import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { TravelDataProvider, useTravelData } from './contexts/TravelDataContext';
import { AppLayout } from './components/AppLayout';
import { Login } from './components/Login';

// Lazy-loaded heavy components
const HistoryView = lazy(() => import('./views/HistoryView'));
const SavedTripsView = lazy(() => import('./views/SavedTripsView'));
const LazyLocationForm = lazy(() => import('./components/LocationForm').then(m => ({ default: m.LocationForm })));
const LazyProfile = lazy(() => import('./components/Profile').then(m => ({ default: m.Profile })));
const LazySquadHub = lazy(() => import('./components/SquadHub').then(m => ({ default: m.SquadHub })));
const LazyBucketList = lazy(() => import('./components/BucketList').then(m => ({ default: m.BucketList })));
const LazyTripComparison = lazy(() => import('./components/TripComparison').then(m => ({ default: m.TripComparison })));
const LazyStatsCard = lazy(() => import('./components/StatsCard').then(m => ({ default: m.StatsCard })));
const LazyPrivacy = lazy(() => import('./views/PrivacyView'));

const RouteFallback = () => (
  <div className="flex items-center justify-center py-20">
    <i className="fas fa-circle-notch fa-spin text-[#00e054] text-2xl"></i>
  </div>
);

// --- Thin route wrappers that connect lazy components to context ---

function AddRoute() {
  const navigate = useNavigate();
  const { addLocation } = useTravelData();
  return (
    <LazyLocationForm onAdd={(loc) => { addLocation(loc); navigate('/history'); }} />
  );
}

function ProfileRoute() {
  const { profile, updateProfile, deleteAccount } = useTravelData();
  if (!profile) return null;
  return <LazyProfile profile={profile} onUpdate={updateProfile} onDeleteAccount={deleteAccount} />;
}

function SquadRoute() {
  const { squadTrips, createSquad, joinSquad, updateSquad, deleteSquad } = useTravelData();
  return (
    <LazySquadHub
      trips={squadTrips}
      onCreate={createSquad}
      onJoin={joinSquad}
      onUpdate={updateSquad}
      onDelete={deleteSquad}
    />
  );
}

function BucketListRoute() {
  const { profile, addToBucketList, removeFromBucketList } = useTravelData();
  if (!profile) return null;
  return (
    <LazyBucketList
      items={profile.bucketList}
      onAdd={addToBucketList}
      onRemove={removeFromBucketList}
    />
  );
}

function CompareRoute() {
  const { locations } = useTravelData();
  return <LazyTripComparison locations={locations} />;
}

function StatsCardRoute() {
  const { locations, profile } = useTravelData();
  if (!profile) return null;
  return <LazyStatsCard locations={locations} profile={profile} />;
}

// --- Loading gate: shows sync screen until initial data loads ---

function LoadingGate({ children }: { children: React.ReactNode }) {
  const { loadingData } = useTravelData();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#14181c] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-cloud-arrow-down fa-bounce text-3xl text-[#00e054] mb-4"></i>
          <p className="text-[#567] text-xs font-bold uppercase tracking-widest">Syncing with Jules...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// --- Main App ---

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#14181c] flex items-center justify-center text-[#00e054]">
        Loading...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <TravelDataProvider userId={user.uid}>
      <LoadingGate>
        <Routes>
          <Route element={<AppLayout user={user} />}>
            <Route index element={<Navigate to="/history" replace />} />
            <Route path="/history" element={<Suspense fallback={<RouteFallback />}><HistoryView /></Suspense>} />
            <Route path="/saved" element={<Suspense fallback={<RouteFallback />}><SavedTripsView /></Suspense>} />
            <Route path="/add" element={<Suspense fallback={<RouteFallback />}><AddRoute /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<RouteFallback />}><ProfileRoute /></Suspense>} />
            <Route path="/squad" element={<Suspense fallback={<RouteFallback />}><SquadRoute /></Suspense>} />
            <Route path="/bucketlist" element={<Suspense fallback={<RouteFallback />}><BucketListRoute /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<RouteFallback />}><CompareRoute /></Suspense>} />
            <Route path="/statscard" element={<Suspense fallback={<RouteFallback />}><StatsCardRoute /></Suspense>} />
            <Route path="/privacy" element={<Suspense fallback={<RouteFallback />}><LazyPrivacy /></Suspense>} />
            <Route path="*" element={<Navigate to="/history" replace />} />
          </Route>
        </Routes>
      </LoadingGate>
    </TravelDataProvider>
  );
};

export default App;
