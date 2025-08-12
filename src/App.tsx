import React, { useEffect, useState } from "react";
import { SidekickProvider } from "./context/SidekickContext";
import HomeScreen from "./components/HomeScreen";

// Phone shell components for desktop/mobile simulation
const PhoneViewport: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div 
      className="phone-viewport bg-warm-gradient overflow-hidden relative"
      style={{
        width: 'var(--phone-w)',
        height: 'var(--phone-h)',
        borderRadius: 'var(--phone-radius)',
        paddingTop: 'var(--phone-safe-top)',
        paddingBottom: 'var(--phone-safe-bottom)',
      }}
    >
      {children}
    </div>
  );
};

const PhoneStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Better mobile detection
    const checkIfMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      
      return isTouchDevice && (isSmallScreen || isMobileUA);
    };

    const updateScale = () => {
      const mobile = checkIfMobile();
      setIsMobile(mobile);

      if (!mobile) {
        // Desktop: calculate responsive scale
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const phoneWidth = 390;
        const phoneHeight = 844;
        
        // Calculate scale with padding
        const scaleX = (viewportWidth - 48) / phoneWidth;
        const scaleY = (viewportHeight - 48) / phoneHeight;
        const newScale = Math.min(scaleX, scaleY, 1);
        
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  if (isMobile) {
    // Mobile: full screen with safe areas
    return (
      <div className="phone-stage-mobile h-full">
        <div 
          className="phone-viewport bg-warm-gradient overflow-y-auto overflow-x-hidden relative h-full"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 0px)',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // Desktop: centered and scaled phone
  return (
    <div className="phone-stage-desktop h-full bg-warm-gradient flex items-center justify-center p-6">
      <div
        className="phone-container relative"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.35))',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div 
      className="app-shell"
      style={{
        '--phone-w': '390px',
        '--phone-h': '844px',
        '--phone-radius': '36px',
        '--phone-safe-top': 'env(safe-area-inset-top, 0px)',
        '--phone-safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      } as React.CSSProperties}
    >
      <PhoneStage>
        <PhoneViewport>
          {children}
        </PhoneViewport>
      </PhoneStage>
    </div>
  );
};

function AppContent() {
  return <HomeScreen />;
}

export default function App() {
  return (
    <SidekickProvider>
      <AppShell>
        <AppContent />
      </AppShell>
    </SidekickProvider>
  );
} 