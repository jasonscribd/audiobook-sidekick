import React, { useState } from "react";
import { 
  ChevronDown, 
  History, 
  MessageCircleQuestion,
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
    <div 
      className="min-h-screen w-screen overflow-hidden relative bg-warm-gradient font-inter"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)'
      }}
    >
      {/* Main Container - Mobile First Layout */}
      <div className="max-w-[430px] mx-auto px-6 pt-3 pb-8">
        
        {/* Native AppBar - Clean header below status bar */}
        <div className="h-12 flex items-center justify-between mb-6 -mx-6 px-6 relative">
          {/* Left: Collapse button */}
          <button
            aria-label="Collapse"
            className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity motion-reduce:transition-none"
          >
            <ChevronDown 
              size={21} 
              strokeWidth={1.75}
            />
          </button>
          
          {/* Center: App label with proper visual centering */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-text-muted text-[13px] font-normal tracking-wide">
              Audiobook sidekick
            </span>
          </div>
          
          {/* Right: History and Settings buttons */}
          <div className="flex items-center space-x-3">
            <button
              aria-label="Open history"
              className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity motion-reduce:transition-none"
            >
              <History 
                size={21} 
                strokeWidth={1.75}
              />
            </button>
            
            <button
              aria-label="Open settings"
              className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity motion-reduce:transition-none"
            >
              <MessageCircleQuestion 
                size={21} 
                strokeWidth={1.75}
              />
            </button>
          </div>
        </div>

        {/* Album Artwork */}
        <div className="flex justify-center mb-4">
          <img
            src={`${(import.meta as any).env.BASE_URL}covers/Femalequixote.jpg`}
            alt="The Female Quixote Vol. I by Charlotte Lennox"
            className="w-[84vw] max-w-[340px] aspect-square object-cover rounded-[21px] shadow-img-soft"
            onError={(e) => {
              // Debug: Log the error
              console.error('Image failed to load:', e);
              console.error('Attempted src:', (e.target as HTMLImageElement).src);
              // Fallback to a placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='340' viewBox='0 0 340 340'%3E%3Crect width='340' height='340' fill='%233B3934'/%3E%3Ctext x='50%25' y='45%25' font-family='Inter' font-size='16' fill='%23EDEDED' text-anchor='middle'%3EThe Female Quixote%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Inter' font-size='14' fill='%23B9B9B9' text-anchor='middle'%3EVol. I%3C/text%3E%3Ctext x='50%25' y='65%25' font-family='Inter' font-size='12' fill='%23B9B9B9' text-anchor='middle'%3ECharlotte Lennox%3C/text%3E%3C/svg%3E";
            }}
            onLoad={() => {
              console.log('Image loaded successfully!');
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-text font-inter font-semibold text-[22px] leading-tight mb-4">
          The Female Quixote
        </h1>

        {/* Primary CTA Button */}
        <button
          onClick={() => setShowSidekick(true)}
          aria-label="Ask me anything or make a note"
          className="w-full max-w-[560px] h-14 bg-accent text-black font-semibold text-base rounded-[17px] shadow-accent-glow flex items-center justify-center space-x-2 transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.99] motion-reduce:active:scale-100 mb-4"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span>Ask me anything or make a note</span>
        </button>

        {/* Progress Bar */}
        <div className="w-full mb-3">
          <div className="relative w-full h-1 bg-track bg-opacity-60 rounded-full mb-2">
            <div className="h-full bg-accent rounded-full" style={{ width: '25%' }}></div>
            {/* Progress Knob */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-sm"
              style={{ left: 'calc(25% - 8px)' }}
            ></div>
          </div>
          
          {/* Timestamps */}
          <div className="flex justify-between items-center text-text-muted text-[13px] font-normal">
            <span>03:57</span>
            <span>5 min 48 sec left</span>
            <span>-09:45</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center space-x-8 opacity-80 mb-4">
          {/* Skip Back */}
          <button 
            className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
            tabIndex={-1}
            aria-label="Skip back"
          >
            <SkipBack 
              size={29} 
              strokeWidth={1.75}
            />
          </button>

          {/* Rewind 30 */}
          <button 
            className="w-11 h-11 flex flex-col items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
            tabIndex={-1}
            aria-label="Rewind 30 seconds"
          >
            <RotateCcw 
              size={29} 
              strokeWidth={1.75}
            />
            <span className="text-xs font-bold mt-0.5">30</span>
          </button>

          {/* Play Button */}
          <button 
            className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
            tabIndex={-1}
            aria-label="Play"
          >
            <Play 
              size={32} 
              strokeWidth={1.75}
            />
          </button>

          {/* Forward 30 */}
          <button 
            className="w-11 h-11 flex flex-col items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
            tabIndex={-1}
            aria-label="Forward 30 seconds"
          >
            <RotateCw 
              size={29} 
              strokeWidth={1.75}
            />
            <span className="text-xs font-bold mt-0.5">30</span>
          </button>

          {/* Skip Forward */}
          <button 
            className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none" 
            tabIndex={-1}
            aria-label="Skip forward"
          >
            <SkipForward 
              size={29} 
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center text-text opacity-70">
          <button 
            className="w-11 h-11 flex flex-col items-center justify-center space-y-0.5 opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none"
            tabIndex={-1}
            aria-label="Menu"
          >
            <AlignJustify 
              size={23} 
              strokeWidth={1.75}
            />
            <span className="text-xs text-text-muted">Menu</span>
          </button>
          
          <button 
            className="w-11 h-11 flex flex-col items-center justify-center space-y-0.5 opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none"
            tabIndex={-1}
            aria-label="Bookmark"
          >
            <Bookmark 
              size={23} 
              strokeWidth={1.75}
            />
            <span className="text-xs text-text-muted">Bookmark</span>
          </button>
          
          <button 
            className="w-11 h-11 flex flex-col items-center justify-center space-y-0.5 opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none"
            tabIndex={-1}
            aria-label="Timer"
          >
            <Timer 
              size={23} 
              strokeWidth={1.75}
            />
            <span className="text-xs text-text-muted">Timer</span>
          </button>
          
          <button 
            className="w-11 h-11 flex flex-col items-center justify-center space-y-0.5 opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity pointer-events-none"
            tabIndex={-1}
            aria-label="Speed"
          >
            <Gauge 
              size={23} 
              strokeWidth={1.75}
            />
            <span className="text-xs text-text-muted">Speed</span>
          </button>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-text rounded-full opacity-30"></div>
      </div>

      {/* Sidekick Popup */}
      {showSidekick && (
        <SidekickPopup onClose={() => setShowSidekick(false)} />
      )}
    </div>
  );
};

export default HomeScreen;