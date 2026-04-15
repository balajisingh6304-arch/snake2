/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Music, Trophy, RefreshCw,
  Gamepad2, Layers
} from 'lucide-react';

// --- Types ---
interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Nights",
    artist: "SynthWave AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/synth1/400/400"
  },
  {
    id: 2,
    title: "Cyber Pulse",
    artist: "Digital Dreamer",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/synth2/400/400"
  },
  {
    id: 3,
    title: "Retro Future",
    artist: "Glitch Master",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/synth3/400/400"
  }
];

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setIsGameOver(false);
    setScore(0);
    setIsPaused(false);
    generateFood(INITIAL_SNAKE);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generateFood, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': 
          if (isGameOver) resetGame();
          else setIsPaused(p => !p);
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue rounded-full blur-[120px]" />
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Column: Music Player */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-3xl p-6 flex flex-col items-center text-center"
          >
            <div className="relative w-full aspect-square mb-6 group">
              <motion.img 
                key={currentTrack.cover}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={currentTrack.cover} 
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                <Music className="w-12 h-12 text-neon-pink animate-pulse" />
              </div>
            </div>

            <div className="mb-6 w-full">
              <div className="relative group">
                <h2 className="text-4xl font-display font-bold neon-text-pink mb-1 animate-glitch opacity-50 absolute inset-0 pointer-events-none">
                  {currentTrack.title}
                </h2>
                <h2 className="text-4xl font-display font-bold neon-text-pink mb-1 relative z-10">
                  {currentTrack.title}
                </h2>
              </div>
              <p className="text-white/60 font-mono text-sm">{currentTrack.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
              <motion.div 
                className="h-full bg-neon-pink shadow-[0_0_10px_#ff00ff]"
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8">
              <button onClick={prevTrack} className="hover:text-neon-blue transition-colors">
                <SkipBack className="w-8 h-8" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-neon-pink flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,0,255,0.5)]"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-black" /> : <Play className="w-8 h-8 text-black ml-1" />}
              </button>
              <button onClick={nextTrack} className="hover:text-neon-blue transition-colors">
                <SkipForward className="w-8 h-8" />
              </button>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 flex justify-around items-center"
          >
            <div className="text-center relative group">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Score</p>
              <div className="relative">
                <p className="text-5xl font-display font-bold neon-text-blue animate-glitch opacity-50 absolute inset-0 pointer-events-none">
                  {score}
                </p>
                <p className="text-5xl font-display font-bold neon-text-blue relative z-10">
                  {score}
                </p>
              </div>
            </div>
            <div className="w-px h-16 bg-white/10" />
            <div className="text-center relative group">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">High Score</p>
              <div className="relative">
                <p className="text-5xl font-display font-bold neon-text-pink animate-glitch opacity-50 absolute inset-0 pointer-events-none" style={{ animationDelay: '0.5s' }}>
                  {highScore}
                </p>
                <p className="text-5xl font-display font-bold neon-text-pink relative z-10">
                  {highScore}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center Column: Snake Game */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-4 relative overflow-hidden aspect-square lg:aspect-auto lg:h-[600px] flex items-center justify-center"
          >
            {/* Game Grid */}
            <div 
              className="relative bg-black/40 rounded-xl border border-white/5"
              style={{
                width: 'min(100%, 560px)',
                height: 'min(100%, 560px)',
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {/* Snake Rendering */}
              {snake.map((segment, i) => (
                <motion.div
                  key={`${i}-${segment.x}-${segment.y}`}
                  initial={i === 0 ? { scale: 0.8 } : false}
                  animate={{ scale: 1 }}
                  className={`rounded-sm ${i === 0 ? 'bg-neon-blue shadow-[0_0_10px_#00ffff] z-10' : 'bg-neon-blue/40'}`}
                  style={{
                    gridColumnStart: segment.x + 1,
                    gridRowStart: segment.y + 1,
                  }}
                />
              ))}

              {/* Food Rendering */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  filter: ['drop-shadow(0 0 5px #ff00ff)', 'drop-shadow(0 0 15px #ff00ff)', 'drop-shadow(0 0 5px #ff00ff)']
                }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="bg-neon-pink rounded-full"
                style={{
                  gridColumnStart: food.x + 1,
                  gridRowStart: food.y + 1,
                }}
              />

              {/* Overlays */}
              <AnimatePresence>
                {(isGameOver || isPaused) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center z-20 rounded-xl"
                  >
                    <div className="text-center p-8">
                      {isGameOver ? (
                        <>
                          <Trophy className="w-16 h-16 text-neon-pink mx-auto mb-4" />
                          <h3 className="text-4xl font-display font-bold mb-2">GAME OVER</h3>
                          <p className="text-white/60 mb-8">Final Score: {score}</p>
                          <button 
                            onClick={resetGame}
                            className="flex items-center gap-2 mx-auto px-8 py-3 bg-neon-pink text-black font-bold rounded-full hover:scale-105 transition-transform"
                          >
                            <RefreshCw className="w-5 h-5" /> TRY AGAIN
                          </button>
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="w-16 h-16 text-neon-blue mx-auto mb-4" />
                          <h3 className="text-4xl font-display font-bold mb-2">PAUSED</h3>
                          <p className="text-white/60 mb-8">Press SPACE to resume</p>
                          <button 
                            onClick={() => setIsPaused(false)}
                            className="flex items-center gap-2 mx-auto px-8 py-3 bg-neon-blue text-black font-bold rounded-full hover:scale-105 transition-transform"
                          >
                            <Play className="w-5 h-5" /> RESUME
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Game Instructions */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono">
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> ARROWS TO MOVE</span>
              <span className="flex items-center gap-1"><Play className="w-3 h-3" /> SPACE TO PAUSE</span>
            </div>
          </motion.div>

          {/* Bottom Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-neon-blue" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/40">Audio Output</p>
                <p className="text-sm font-mono">System Default (Stereo)</p>
              </div>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-neon-pink" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/40">Game Engine</p>
                <p className="text-sm font-mono">Neon Core v1.0.4</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-12 text-white/20 text-[10px] uppercase tracking-[0.4em] font-display">
        Neon Rhythm Snake // Experimental Build 2024
      </footer>
    </div>
  );
}
