import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './Button';

export const PwaPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW Registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-[#1b2228] border border-[#00e054]/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,224,84,0.15)] animate-in slide-in-from-bottom-8 duration-700 max-w-sm w-full">
      <div className="flex gap-5 items-start">
        <div className="w-12 h-12 rounded-full bg-[#00e054]/10 border border-[#00e054]/30 flex items-center justify-center flex-shrink-0 shadow-inner">
          <i className={`fas ${needRefresh ? 'fa-cloud-download-alt animate-bounce' : 'fa-check text-shadow-glow'} text-[#00e054] text-xl`}></i>
        </div>
        <div className="flex-grow">
          <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1.5">
            {needRefresh ? 'Update Ready' : 'Offline Ready'}
          </h4>
          <p className="text-[#9ab] text-xs font-bold leading-relaxed mb-5">
            {needRefresh 
              ? 'A new version of Wanderlog has been downloaded. Reload to experience the latest features.' 
              : 'Wanderlog is successfully installed and completely ready to log memories without an internet connection.'}
          </p>
          <div className="flex gap-3">
            {needRefresh && (
              <Button size="sm" variant="primary" onClick={() => updateServiceWorker(true)} className="flex-1 py-2 text-xs shadow-lg shadow-[#00e054]/20">
                RELOAD APP
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={close} className="flex-1 py-2 text-xs border border-[#2c3440] text-[#9ab] hover:text-white hover:bg-[#2c3440] transition-colors">
              DISMISS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
