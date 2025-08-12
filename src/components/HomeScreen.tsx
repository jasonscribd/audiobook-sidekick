import React, { useState } from "react";
import SidekickPopup from "./SidekickPopup";

const HomeScreen: React.FC = () => {
  const [showSidekick, setShowSidekick] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gradient-to-b from-gray-900 via-gray-800 to-red-900">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2 text-white text-sm font-medium">
        <div className="text-lg font-semibold">9:41</div>
        <div className="flex items-center space-x-1">
          {/* Signal bars */}
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-4 bg-white rounded-full"></div>
            <div className="w-1 h-5 bg-white rounded-full"></div>
            <div className="w-1 h-6 bg-white rounded-full"></div>
          </div>
          {/* WiFi */}
          <svg className="w-5 h-5 ml-2" fill="white" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.414 5 5 0 017.07 0 1 1 0 01-1.415 1.414zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {/* Battery */}
          <div className="w-6 h-3 border border-white rounded-sm ml-1">
            <div className="w-4 h-1.5 bg-white rounded-sm m-0.5"></div>
          </div>
          <div className="w-0.5 h-1 bg-white rounded-full ml-0.5"></div>
        </div>
      </div>

      {/* Top Navigation */}
      <div className="flex justify-between items-center px-6 py-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-6">
        {/* Book Cover */}
        <div className="w-80 h-80 mb-8 rounded-2xl overflow-hidden shadow-2xl">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-700 tracking-wider mb-2">THE RIVER</h2>
              <div className="flex items-center justify-center mb-4">
                {/* Stylized numbers with flowers */}
                <div className="relative">
                  <span className="text-6xl font-bold text-gray-600">2023</span>
                  {/* Flower decorations */}
                  <div className="absolute -top-4 -left-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-500 opacity-80"></div>
                    <div className="absolute top-1 left-1 w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-red-400"></div>
                  </div>
                  <div className="absolute -top-2 right-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-80"></div>
                    <div className="absolute top-1 left-1 w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-pink-400"></div>
                  </div>
                  <div className="absolute -bottom-2 left-8">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 opacity-80"></div>
                    <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-500"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 tracking-wider">HAS ROOTS</h3>
              <p className="text-xs text-gray-500 mt-2 tracking-wide">NEW YORK TIMES BESTSELLING AUTHOR</p>
              <p className="text-lg font-semibold text-red-600 mt-1 tracking-wider">AMAL EL-MOHTAR</p>
            </div>
          </div>
        </div>

        {/* Book Title */}
        <h1 className="text-white text-2xl font-medium mb-8 text-center">
          The River Has Roots
        </h1>

        {/* Ask Me Anything Button */}
        <button
          onClick={() => setShowSidekick(true)}
          className="bg-yellow-400 text-black px-8 py-4 rounded-full text-lg font-semibold flex items-center space-x-2 shadow-lg hover:bg-yellow-300 transition-colors mb-12"
        >
          <span>✨</span>
          <span>Ask me anything or make a note</span>
        </button>

        {/* Audio Progress Bar */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
          <div className="flex justify-between text-white text-sm">
            <span>03:57</span>
            <span>5 min 48 sec left</span>
            <span>-09:45</span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          {/* Previous */}
          <button className="text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Rewind 30 */}
          <button className="text-white relative">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">30</span>
          </button>

          {/* Play Button */}
          <button className="bg-white text-black rounded-full p-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Forward 30 */}
          <button className="text-white relative">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">30</span>
          </button>

          {/* Next */}
          <button className="text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center w-full max-w-sm text-white">
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs">Menu</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-xs">Bookmark</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Timer</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-sm font-bold">1.00x</span>
            <span className="text-xs">Speed</span>
          </div>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 bg-white rounded-full opacity-50"></div>
      </div>

      {/* Sidekick Popup */}
      {showSidekick && (
        <SidekickPopup onClose={() => setShowSidekick(false)} />
      )}
    </div>
  );
};

export default HomeScreen;
