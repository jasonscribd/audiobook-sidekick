import React, { useState, useEffect, useContext } from "react";
import { 
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  AlignJustify,
  Bookmark,
  Timer,
  Gauge
} from "lucide-react";
import SidekickPopup from "./SidekickPopup";
import { useAudio } from "../context/AudioContext";
import { audioService } from "../services/audioService";
import { SidekickContext } from "../context/SidekickContext";

interface HomeScreenProps {
  onNavigateToConversation: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToConversation }) => {
  const [showSidekick, setShowSidekick] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const audioState = useAudio();
  const { addNote, getNotesForBook } = useContext(SidekickContext);

  // Current book ID - in a real app this would come from props or state
  const currentBookId = "treasure-island";
  
  // Get notes for current book
  const bookNotes = getNotesForBook(currentBookId);

  // Handle note dot click - navigate to conversation view
  const handleNoteDotClick = (noteId: string) => {
    // Navigate with noteId parameter
    window.location.hash = `#conversation?noteId=${noteId}`;
  };

  // Helper function to format time in MM:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to format remaining time
  const formatRemainingTime = (current: number, duration: number): string => {
    if (!duration || !isFinite(duration)) return "0 min left";
    const remaining = duration - current;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    
    if (mins > 0) {
      return `${mins} min ${secs} sec left`;
    } else {
      return `${secs} sec left`;
    }
  };

  // Handle CTA click - create note marker and pause audio to preserve position
  const handleCTAClick = () => {
    // Create note marker at current audio time
    const noteId = crypto.randomUUID?.() || Date.now().toString();
    const noteMarker = {
      id: noteId,
      bookId: currentBookId,
      timeSec: audioState.currentTime,
      createdAt: new Date().toISOString(),
      // historyId and preview will be set later when/if a conversation completes
    };
    
    addNote(noteMarker);
    
    // Pause audio and show sidekick
    audioService.pause();
    setShowSidekick(true);
  };

  // Handle play/pause toggle
  const handlePlayToggle = () => {
    audioService.toggle();
  };

  // Handle seek controls
  const handleRewind30 = () => {
    audioService.seek(audioState.currentTime - 30);
  };

  const handleForward30 = () => {
    audioService.seek(audioState.currentTime + 30);
  };

  // Get current position for progress bar (during drag or normal playback)
  const getCurrentPosition = () => {
    if (isDragging && dragPosition !== null) {
      return dragPosition;
    }
    return audioState.duration ? (audioState.currentTime / audioState.duration) * 100 : 0;
  };

  // Calculate position from mouse/touch event
  const getPositionFromEvent = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    return percentage;
  };

  // Handle progress bar click
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioState.duration || isDragging) return;
    
    const percentage = getPositionFromEvent(event.clientX, event.currentTarget);
    const newTime = (percentage / 100) * audioState.duration;
    audioService.seek(newTime);
  };

  // Handle drag start
  const handleDragStart = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!audioState.duration) return;
    
    event.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const percentage = getPositionFromEvent(clientX, event.currentTarget);
    setDragPosition(percentage);
    
    // Pause during drag for better UX
    if (audioState.status === 'playing') {
      audioService.pause();
    }
  };

  // Handle drag move
  const handleDragMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging || !audioState.duration) return;
    
    const progressBar = document.querySelector('[data-progress-bar]') as HTMLElement;
    if (!progressBar) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const percentage = getPositionFromEvent(clientX, progressBar);
    setDragPosition(percentage);
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!isDragging || !audioState.duration || dragPosition === null) return;
    
    const newTime = (dragPosition / 100) * audioState.duration;
    audioService.seek(newTime);
    
    setIsDragging(false);
    setDragPosition(null);
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling during drag
      handleDragMove(e);
    };
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragPosition, audioState.duration]);

  // Calculate progress percentage
  const progressPercentage = getCurrentPosition();

  // Initialize audio and cleanup on unmount
  useEffect(() => {
    // Load the audio file when component mounts
    audioService.load();
    
    return () => {
      audioService.stop();
    };
  }, []);



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
        
        {/* Row 1: TopHero (Album Art + Title) - Anchored to Top */}
        <div 
          style={{ 
            paddingLeft: '24px', 
            paddingRight: '24px', 
            paddingTop: `calc(env(safe-area-inset-top) + 12px)`,
            paddingBottom: '16px'
          }}
        >
          {/* Album Artwork */}
          <div className="flex justify-center mb-4">
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
          <h1 className="text-center text-text font-inter font-semibold text-[24px] leading-tight">
            Treasure Island
          </h1>
        </div>



        {/* Row 2: Middle Spacer/Scroll Area (grows/shrinks as needed) */}
        <div className="min-h-0 overflow-y-auto"></div>

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
            onClick={handleCTAClick}
            aria-label="Ask me anything or make a note"
            className="w-full bg-accent text-black font-semibold text-base rounded-[18px] shadow-accent-glow flex items-center justify-center space-x-2 transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.99] motion-reduce:active:scale-100"
            style={{ height: '56px', marginBottom: '14px' }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="#000000"
              style={{ flexShrink: 0 }}
            >
              {/* Main sparkle - matches ✨ emoji shape */}
              <path d="M12 1.5L13.5 7.5L19.5 9L13.5 10.5L12 16.5L10.5 10.5L4.5 9L10.5 7.5L12 1.5Z"/>
              {/* Top right accent sparkle */}
              <path d="M18.5 3L19 5L21 5.5L19 6L18.5 8L18 6L16 5.5L18 5L18.5 3Z"/>
              {/* Bottom left accent sparkle */}
              <path d="M5.5 15L6 17L8 17.5L6 18L5.5 20L5 18L3 17.5L5 17L5.5 15Z"/>
            </svg>
            <span>Ask me anything or make a note</span>
          </button>

          {/* 2. Progress Bar + Timestamps */}
          <div className="w-full" style={{ marginBottom: '18px' }}>
            <div 
              data-progress-bar
              className={`relative w-full bg-track bg-opacity-60 rounded-full mb-2 cursor-pointer select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-pointer'
              }`}
              style={{ height: '4px' }}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={Math.floor(audioState.duration || 0)}
              aria-valuenow={isDragging && dragPosition !== null 
                ? Math.floor((dragPosition / 100) * (audioState.duration || 0)) 
                : Math.floor(audioState.currentTime || 0)
              }
              aria-label="Seek"
              tabIndex={0}
              onKeyDown={(e) => {
                if (!audioState.duration) return;
                const step = 5; // seconds per arrow
                if (e.key === 'ArrowRight') audioService.seek(audioState.currentTime + step);
                if (e.key === 'ArrowLeft') audioService.seek(audioState.currentTime - step);
                if (e.key === 'Home') audioService.seek(0);
                if (e.key === 'End') audioService.seek(audioState.duration);
              }}
              onClick={handleProgressClick}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div className="h-full bg-accent rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              
              {/* Note Dots */}
              {bookNotes.map((note) => {
                const leftPercentage = audioState.duration 
                  ? (note.timeSec / audioState.duration) * 100 
                  : 0;
                
                return (
                  <button
                    key={note.id}
                    onClick={() => handleNoteDotClick(note.id)}
                    aria-label={`Open note at ${formatTime(note.timeSec)}`}
                    className="absolute transform -translate-x-1/2 hover:scale-110 focus:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded-full"
                    style={{
                      left: `${leftPercentage}%`,
                      top: '-10px', // Position above the rail
                      width: '24px', // Larger tap target
                      height: '24px',
                      zIndex: 10,
                    }}
                    title={`Note • ${formatTime(note.timeSec)}${note.preview ? ` - ${note.preview.slice(0, 50)}...` : ''}`}
                  >
                    {/* Visual dot */}
                    <div 
                      className="w-3 h-3 rounded-full mx-auto"
                      style={{
                        backgroundColor: '#F2FD53', // Yellow dot color
                        border: '2px solid #000',
                        marginTop: '5px', // Center within the tap target
                      }}
                    />
                  </button>
                );
              })}
              
              {/* Progress Knob */}
              <div 
                className={`absolute top-1/2 transform -translate-y-1/2 bg-accent rounded-full transition-all duration-75 ${
                  isDragging ? 'scale-125 shadow-lg' : 'hover:scale-110'
                }`}
                style={{ 
                  left: `calc(${progressPercentage}% - 8px)`, 
                  width: '16px', 
                  height: '16px',
                  boxShadow: isDragging ? '0 0 0 3px rgba(243, 164, 107, 0.3)' : undefined
                }}
              ></div>
            </div>
            
            {/* Timestamps */}
            <div className="flex justify-between items-center text-[#B9B9B9] text-[13px] font-normal" style={{ marginTop: '8px' }}>
              <span className={isDragging ? 'text-accent' : ''}>
                {formatTime(isDragging && dragPosition !== null 
                  ? (dragPosition / 100) * (audioState.duration || 0)
                  : audioState.currentTime
                )}
              </span>
              <span>
                {isDragging && dragPosition !== null
                  ? formatRemainingTime((dragPosition / 100) * (audioState.duration || 0), audioState.duration)
                  : formatRemainingTime(audioState.currentTime, audioState.duration)
                }
              </span>
              <span>
                -{formatTime(isDragging && dragPosition !== null
                  ? audioState.duration - ((dragPosition / 100) * (audioState.duration || 0))
                  : audioState.duration - audioState.currentTime
                )}
              </span>
            </div>
          </div>

          {/* 3. Playback Controls */}
          <div className="flex items-center justify-center space-x-8" style={{ marginBottom: '18px' }}>
            {/* Skip Back */}
            <button 
              className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity" 
              aria-label="Skip back"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
              disabled
            >
              <SkipBack 
                size={30} 
                strokeWidth={1.75}
              />
            </button>

            {/* Rewind 30 */}
            <button 
              className="w-11 h-11 flex items-center justify-center relative opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity" 
              onClick={handleRewind30}
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

            {/* Play/Pause Button */}
            <button 
              className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity" 
              onClick={handlePlayToggle}
              aria-label={audioState.status === "playing" ? "Pause audiobook" : "Play audiobook"}
              aria-pressed={audioState.status === "playing"}
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}

            >
              {audioState.status === "playing" ? (
                <Pause 
                  size={30} 
                  strokeWidth={1.75}
                />
              ) : (
                <Play 
                  size={30} 
                  strokeWidth={1.75}
                />
              )}
            </button>

            {/* Forward 30 */}
            <button 
              className="w-11 h-11 flex items-center justify-center relative opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity" 
              onClick={handleForward30}
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
              className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity" 
              aria-label="Skip forward"
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
              disabled
            >
              <SkipForward 
                size={30} 
                strokeWidth={1.75}
              />
            </button>
          </div>

          {/* Error Message */}
          {audioState.error && (
            <div className="text-center text-red-400 text-sm mb-3 px-4">
              {audioState.error}
            </div>
          )}

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

        {/* Sidekick Popup - positioned within phone viewport */}
        {showSidekick && (
          <SidekickPopup 
            onClose={() => setShowSidekick(false)} 
            onNavigateToConversation={onNavigateToConversation}
          />
        )}
      </div>
    </>
  );
};

export default HomeScreen;