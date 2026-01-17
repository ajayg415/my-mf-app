import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    // 'mb-20' ensures it floats above the BottomNav
    <div className="toast toast-bottom toast-center z-[100] mb-20"> 
      <div className="alert alert-info shadow-lg p-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-white">
            {offlineReady
              ? 'App is ready to work offline!'
              : 'New version available!'}
          </span>
        </div>
        <div className="flex-none gap-2">
          {needRefresh && (
            <button
              className="btn btn-xs btn-white text-info"
              onClick={() => updateServiceWorker(true)}
            >
              Update
            </button>
          )}
          <button className="btn btn-xs btn-ghost text-white" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReloadPrompt;