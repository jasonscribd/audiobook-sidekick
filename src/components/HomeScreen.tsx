import React, { useState } from "react";
import SidekickPopup from "./SidekickPopup";

const HomeScreen: React.FC = () => {
  const [showSidekick, setShowSidekick] = useState(false);

  return (
    <div className="min-h-screen w-screen overflow-hidden relative bg-warm-gradient font-inter">
      {/* Main Container - Mobile First Layout */}
      <div className="max-w-[430px] mx-auto px-6 pt-10 pb-8">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-semibold text-text">9:41</div>
          <div className="flex items-center space-x-1 text-text">
            {/* Signal bars */}
            <div className="flex space-x-1">
              <div className="w-1 h-3 bg-current rounded-full"></div>
              <div className="w-1 h-4 bg-current rounded-full"></div>
              <div className="w-1 h-5 bg-current rounded-full"></div>
              <div className="w-1 h-6 bg-current rounded-full"></div>
            </div>
            {/* WiFi */}
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.414 5 5 0 017.07 0 1 1 0 01-1.415 1.414zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            {/* Battery */}
            <div className="w-6 h-3 border border-current rounded-sm ml-1">
              <div className="w-4 h-1.5 bg-current rounded-sm m-0.5"></div>
            </div>
            <div className="w-0.5 h-1 bg-current rounded-full ml-0.5"></div>
          </div>
        </div>

        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-6">
          <svg className="w-6 h-6 text-text opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <svg className="w-6 h-6 text-text opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Album Artwork */}
        <div className="flex justify-center mb-6">
          <img
            src="/covers/the-female-quixote.jpg"
            alt="The Female Quixote Vol. I by Charlotte Lennox"
            className="w-[84vw] max-w-[340px] aspect-square object-cover rounded-3xl shadow-img-soft"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='340' viewBox='0 0 340 340'%3E%3Crect width='340' height='340' fill='%233B3934'/%3E%3Ctext x='50%25' y='45%25' font-family='Inter' font-size='16' fill='%23EDEDED' text-anchor='middle'%3EThe Female Quixote%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Inter' font-size='14' fill='%23B9B9B9' text-anchor='middle'%3EVol. I%3C/text%3E%3Ctext x='50%25' y='65%25' font-family='Inter' font-size='12' fill='%23B9B9B9' text-anchor='middle'%3ECharlotte Lennox%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-text font-inter font-semibold text-[22px] sm:text-2xl leading-tight mb-6">
          The Female Quixote
        </h1>

        {/* Primary CTA Button */}
        <button
          onClick={() => setShowSidekick(true)}
          aria-label="Ask me anything or make a note"
          className="w-full max-w-[560px] h-14 bg-accent text-black font-semibold text-base rounded-2xl shadow-accent-glow flex items-center justify-center space-x-2 transition-all duration-200 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.99] motion-reduce:active:scale-100 mb-6"
        >
          <span>✨</span>
          <span>Ask me anything or make a note</span>
        </button>

        {/* Progress Bar */}
        <div className="w-full mb-4">
          <div className="w-full h-0.5 bg-track bg-opacity-60 rounded-full mb-3">
            <div className="h-full bg-accent rounded-full" style={{ width: '25%' }}></div>
          </div>
          
          {/* Timestamps */}
          <div className="flex justify-between items-center text-text-muted text-[13px]">
            <span>03:57</span>
            <span>5 min 48 sec left</span>
            <span>-09:45</span>
          </div>
        </div>

        {/* Transport Controls (Faded/Cosmetic) */}
        <div className="flex items-center justify-center space-x-8 opacity-50 mb-6">
          {/* Previous */}
          <button className="text-text pointer-events-none" tabIndex={-1}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Rewind 30 */}
          <button className="text-text relative pointer-events-none" tabIndex={-1}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">30</span>
          </button>

          {/* Play Button */}
          <button className="bg-text text-bg rounded-full p-3 pointer-events-none" tabIndex={-1}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Forward 30 */}
          <button className="text-text relative pointer-events-none" tabIndex={-1}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">30</span>
          </button>

          {/* Next */}
          <button className="text-text pointer-events-none" tabIndex={-1}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Bottom Navigation (Faded/Cosmetic) */}
        <div className="flex justify-between items-center text-text opacity-50">
          <div className="flex flex-col items-center space-y-1 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs">Menu</span>
          </div>
          <div className="flex flex-col items-center space-y-1 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-xs">Bookmark</span>
          </div>
          <div className="flex flex-col items-center space-y-1 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Timer</span>
          </div>
          <div className="flex flex-col items-center space-y-1 pointer-events-none">
            <span className="text-sm font-bold">1.00x</span>
            <span className="text-xs">Speed</span>
          </div>
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