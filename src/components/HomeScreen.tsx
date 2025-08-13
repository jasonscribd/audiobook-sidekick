import React, { useState } from "react";
import { 
  RotateCcw,
  RotateCw,
  Play,
  SkipBack,
  SkipForward,
  AlignJustify,
  Bookmark,
  Timer,
  Gauge
} from "lucide-react";
import SidekickPopup from "./SidekickPopup";

const HomeScreen: React.FC = () => {
  const [showSidekick, setShowSidekick] = useState(false);

  return (
    <>
      {/* Phone Viewport Container - Grid Layout */}
      <div 
        className="grid grid-rows-[auto_1fr_auto] max-w-[430px] mx-auto font-inter relative overflow-hidden"
        style={{
          minHeight: '100vh',
          height: '100dvh',
          background: 'var(--phone-bg)'
        } as React.CSSProperties & { WebkitHeight?: string }}
      >
        
        {/* Row 1: TopContent (Album Art + Title) - Scrollable */}
        <div 
          className="overflow-y-auto"
          style={{ 
            paddingLeft: '24px', 
            paddingRight: '24px', 
            paddingTop: '40px', 
            paddingBottom: '120px' // Space for BottomDock
          }}
        >
          {/* Album Artwork */}
          <div className="flex justify-center mb-4" style={{ marginTop: '20px' }}>
            <img
              src={`${(import.meta as any).env.BASE_URL}covers/treasure_island_1.jpg`}
              alt="Treasure Island by Robert Louis Stevenson"
              className="w-[84vw] max-w-[340px] aspect-square object-cover rounded-[22px] shadow-img-soft"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='340' viewBox='0 0 340 340'%3E%3Crect width='340' height='340' fill='%233B3934'/%3E%3Ctext x='50%25' y='45%25' font-family='Inter' font-size='16' fill='%23EDEDED' text-anchor='middle'%3ETreasure Island%3C/text%3E%3Ctext x='50%25' y='65%25' font-family='Inter' font-size='12' fill='%23B9B9B9' text-anchor='middle'%3ERobert Louis Stevenson%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* Title */}
          <h1 className="text-center text-text font-inter font-semibold text-[23px] leading-tight">
            Treasure Island
          </h1>
        </div>



        {/* Row 2: Spacer/Scroll Area (grows as needed) */}
        <div className="min-h-0"></div>

        {/* Row 3: BottomDock - Fixed to Bottom */}
        <div 
          className="w-full z-10"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '16px',
            paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)`
          }}
        >
          {/* 1. CTA Button */}
          <button
            onClick={() => setShowSidekick(true)}
            aria-label="Ask me anything or make a note"
            className="w-full bg-accent text-black font-semibold text-base rounded-[18px] shadow-accent-glow flex items-center justify-center space-x-2 transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.99] motion-reduce:active:scale-100"
            style={{ height: '56px', marginBottom: '14px' }}
          >
            <span className="text-lg text-black">✨</span>
            <span>Ask me anything or make a note</span>
          </button>

          {/* 2. Progress Bar + Timestamps */}
          <div className="w-full" style={{ marginBottom: '18px' }}>
            <div className="relative w-full bg-track bg-opacity-60 rounded-full mb-2" style={{ height: '4px' }}>
              <div className="h-full bg-accent rounded-full" style={{ width: '25%' }}></div>
              {/* Progress Knob */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 bg-accent rounded-full"
                style={{ left: 'calc(25% - 8px)', width: '16px', height: '16px' }}
              ></div>
            </div>
            
            {/* Timestamps */}
            <div className="flex justify-between items-center text-[#B9B9B9] text-[13px] font-normal" style={{ marginTop: '8px' }}>
              <span>03:57</span>
              <span>5 min 48 sec left</span>
              <span>-09:45</span>
            </div>
          </div>

          {/* 3. Playback Controls */}
          <div className="flex items-center justify-center space-x-8" style={{ marginBottom: '18px' }}>
            {/* Skip Back */}
            <button 
              className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
              tabIndex={-1}
              aria-label="Skip back"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            >
              <SkipBack 
                size={30} 
                strokeWidth={1.75}
              />
            </button>

            {/* Rewind 30 */}
            <button 
              className="w-11 h-11 flex items-center justify-center relative opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
              tabIndex={-1}
              aria-label="Rewind 30 seconds"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            >
              <RotateCcw 
                size={30} 
                strokeWidth={1.75}
              />
              {/* Circled 30 badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-current flex items-center justify-center">
                <span className="text-[12px] font-medium leading-none">30</span>
              </div>
            </button>

            {/* Play Button */}
            <button 
              className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
              tabIndex={-1}
              aria-label="Play"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            >
              <Play 
                size={30} 
                strokeWidth={1.75}
              />
            </button>

            {/* Forward 30 */}
            <button 
              className="w-11 h-11 flex items-center justify-center relative opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
              tabIndex={-1}
              aria-label="Forward 30 seconds"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            >
              <RotateCw 
                size={30} 
                strokeWidth={1.75}
              />
              {/* Circled 30 badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-current flex items-center justify-center">
                <span className="text-[12px] font-medium leading-none">30</span>
              </div>
            </button>

            {/* Skip Forward */}
            <button 
              className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
              tabIndex={-1}
              aria-label="Skip forward"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            >
              <SkipForward 
                size={30} 
                strokeWidth={1.75}
              />
            </button>
          </div>

          {/* 4. Bottom Navigation */}
          <div className="w-full flex justify-between items-center" style={{ marginBottom: '10px' }}>
            <button 
              onClick={() => {/* Menu/Settings functionality */}}
              className="flex flex-col items-center justify-center space-y-1 opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              style={{ width: '44px', height: '44px' }}
              aria-label="Menu"
            >
              <AlignJustify 
                size={22} 
                strokeWidth={1.75}
                style={{ color: 'rgba(237, 237, 237, 0.8)' }}
              />
              <span className="text-[12px] text-[#B9B9B9] font-inter leading-none">Menu</span>
            </button>
            
            <button 
              onClick={() => {/* Bookmark functionality */}}
              className="flex flex-col items-center justify-center space-y-1 opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              style={{ width: '44px', height: '44px' }}
              aria-label="Bookmark"
            >
              <Bookmark 
                size={22} 
                strokeWidth={1.75}
                style={{ color: 'rgba(237, 237, 237, 0.8)' }}
              />
              <span className="text-[12px] text-[#B9B9B9] font-inter leading-none">Bookmark</span>
            </button>
            
            <button 
              onClick={() => {/* Timer functionality */}}
              className="flex flex-col items-center justify-center space-y-1 opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              style={{ width: '44px', height: '44px' }}
              aria-label="Timer"
            >
              <Timer 
                size={22} 
                strokeWidth={1.75}
                style={{ color: 'rgba(237, 237, 237, 0.8)' }}
              />
              <span className="text-[12px] text-[#B9B9B9] font-inter leading-none">Timer</span>
            </button>
            
            <button 
              onClick={() => {/* Speed functionality */}}
              className="flex flex-col items-center justify-center space-y-1 opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              style={{ width: '44px', height: '44px' }}
              aria-label="Speed"
            >
              <Gauge 
                size={22} 
                strokeWidth={1.75}
                style={{ color: 'rgba(237, 237, 237, 0.8)' }}
              />
              <span className="text-[12px] text-[#B9B9B9] font-inter leading-none">Speed</span>
            </button>
          </div>
          
          {/* 5. Home Indicator Pill */}
          <div 
            className="rounded-full mx-auto"
            style={{
              width: '64px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.4)'
            }}
          ></div>
        </div>
      </div>

      {/* Sidekick Popup */}
      {showSidekick && (
        <SidekickPopup onClose={() => setShowSidekick(false)} />
      )}
    </>
  );
};

export default HomeScreen;