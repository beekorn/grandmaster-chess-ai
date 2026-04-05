import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { Menu, X, RotateCcw, HelpCircle, Settings, Trophy, AlertTriangle } from 'lucide-react';
import { getBestMove } from './ai';

// --- Types ---
type Theme = 'green' | 'blue' | 'brown' | 'gray';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

// --- Constants ---
const THEMES: Record<Theme, { light: string; dark: string; active: string }> = {
  green: { light: 'bg-[#ebecd0]', dark: 'bg-[#779556]', active: 'bg-yellow-200/50' },
  blue: { light: 'bg-[#dee3e6]', dark: 'bg-[#8ca2ad]', active: 'bg-yellow-200/50' },
  brown: { light: 'bg-[#f0d9b5]', dark: 'bg-[#b58863]', active: 'bg-yellow-200/50' },
  gray: { light: 'bg-[#e0e0e0]', dark: 'bg-[#757575]', active: 'bg-yellow-200/50' },
};

const PIECE_UNICODE: Record<string, string> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚',
};

export default function App() {
  // --- State ---
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[], black: string[] }>({ white: [], black: [] });
  
  // Settings
  const [theme, setTheme] = useState<Theme>('green');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // --- Derived State ---
  const board = useMemo(() => {
    const b = [];
    // Chess.js board is 8x8 array. Row 0 is Rank 8 (Black), Row 7 is Rank 1 (White)
    const rawBoard = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareName = String.fromCharCode(97 + c) + (8 - r);
        b.push({
          square: squareName,
          piece: rawBoard[r][c],
          isLight: (r + c) % 2 === 0,
        });
      }
    }
    return b;
  }, [fen]);

  // Calculate captured pieces
  useEffect(() => {
    const startingPieces = {
      p: 8, r: 2, n: 2, b: 2, q: 1, k: 1,
      P: 8, R: 2, N: 2, B: 2, Q: 1, K: 1,
    };
    
    const currentPieces: Record<string, number> = {
      p: 0, r: 0, n: 0, b: 0, q: 0, k: 0,
      P: 0, R: 0, N: 0, B: 0, Q: 0, K: 0,
    };
    
    // Count current pieces on board
    board.forEach(sq => {
      if (sq.piece) {
        const key = sq.piece.color === 'w' ? sq.piece.type.toUpperCase() : sq.piece.type;
        currentPieces[key]++;
      }
    });
    
    // Calculate captured
    const whiteCaptured: string[] = [];
    const blackCaptured: string[] = [];
    
    (['p', 'r', 'n', 'b', 'q'] as const).forEach(piece => {
      const blackMissing = startingPieces[piece] - currentPieces[piece];
      const whiteMissing = startingPieces[piece.toUpperCase()] - currentPieces[piece.toUpperCase()];
      
      for (let i = 0; i < blackMissing; i++) {
        whiteCaptured.push(piece); // White captured black pieces
      }
      for (let i = 0; i < whiteMissing; i++) {
        blackCaptured.push(piece.toUpperCase()); // Black captured white pieces
      }
    });
    
    setCapturedPieces({ white: whiteCaptured, black: blackCaptured });
  }, [board]);

  // --- Game Logic ---

  // AI Turn
  useEffect(() => {
    if (game.turn() === 'b' && !game.isGameOver()) {
      setIsAiThinking(true);
      
      // Artificial delay for UX
      const timer = setTimeout(() => {
        const depth = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
        const bestMove = getBestMove(game, depth);
        
        if (bestMove) {
          game.move(bestMove);
          const history = game.history({ verbose: true });
          const last = history[history.length - 1];
          setLastMove({ from: last.from, to: last.to });
          setFen(game.fen());
          checkGameOver();
        }
        setIsAiThinking(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [fen, difficulty]);

  const checkGameOver = () => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) setGameOverResult(game.turn() === 'w' ? 'You Lost!' : 'You Won!');
      else if (game.isDraw()) setGameOverResult('Draw');
      else setGameOverResult('Game Over');
    }
  };

  const handleSquareClick = (square: string) => {
    // Prevent interaction if AI is thinking or game over
    if (isAiThinking || game.isGameOver() || game.turn() === 'b') return;

    // If clicking a valid move target
    if (possibleMoves.includes(square) && selectedSquare) {
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // Always promote to Queen for simplicity
        });

        if (move) {
          setLastMove({ from: move.from, to: move.to });
          setFen(game.fen());
          setSelectedSquare(null);
          setPossibleMoves([]);
          checkGameOver();
          return;
        }
      } catch (e) {
        console.error("Move failed", e);
      }
    }

    // Select new piece
    const piece = game.get(square as any);
    if (piece && piece.color === 'w') {
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else {
        // Select
        setSelectedSquare(square);
        const moves = game.moves({ square: square as any, verbose: true });
        setPossibleMoves(moves.map(m => m.to));
      }
    } else {
      // Clicked empty or enemy piece without a valid move
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setLastMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameOverResult(null);
    setCapturedPieces({ white: [], black: [] });
    setIsMenuOpen(false);
  };

  // --- Render Helpers ---
  const getSquareColor = (isLight: boolean, square: string) => {
    // Highlight last move
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      return 'bg-yellow-200/80';
    }
    // Highlight selected
    if (selectedSquare === square) {
      return 'bg-yellow-400';
    }
    return isLight ? THEMES[theme].light : THEMES[theme].dark;
  };

  return (
    <div className="h-screen bg-white text-gray-900 font-sans overflow-hidden flex flex-col items-center">
      
      {/* --- Header --- */}
      <header className="w-full p-3 flex items-center justify-between z-40 bg-gray-100 shadow-md flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Grandmaster AI</h1>
        </div>
        <div className="flex items-center gap-2">
           {/* Turn Indicator */}
           <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 border ${game.turn() === 'w' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-200 border-transparent text-gray-500'}`}>
              YOU
           </div>
           <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 border ${game.turn() === 'b' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-200 border-transparent text-gray-500'}`}>
              {isAiThinking ? 'THINKING...' : 'AI'}
           </div>
        </div>
      </header>

      {/* --- Main Game Area --- */}
      <main className="flex-1 flex items-center justify-center w-full px-4 py-2 overflow-hidden gap-4">
        
        {/* Captured Pieces - Black (captured by White) */}
        <div className="flex flex-col gap-1 items-center min-w-[60px]">
          <div className="text-xs text-gray-600 font-bold mb-1">Captured</div>
          <div className="flex flex-wrap gap-1 justify-center max-w-[60px]">
            {capturedPieces.white.map((piece, idx) => (
              <span key={idx} className="text-2xl text-black">
                {PIECE_UNICODE[piece]}
              </span>
            ))}
          </div>
        </div>

        {/* Board Container */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative shadow-2xl rounded-sm overflow-hidden border-4 border-gray-300 max-w-full max-h-full" style={{ width: 'min(95vw, 95vh, 500px)', height: 'min(95vw, 95vh, 500px)' }}>
            <div className="grid grid-cols-8 w-full h-full">
            {board.map((sq) => {
              const isMoveTarget = possibleMoves.includes(sq.square);
              const isCapture = isMoveTarget && sq.piece !== null;

              return (
                <div
                  key={sq.square}
                  onClick={() => handleSquareClick(sq.square)}
                  className={`
                    ${getSquareColor(sq.isLight, sq.square)}
                    relative flex items-center justify-center select-none cursor-pointer aspect-square
                  `}
                >
                  {/* Rank/File Labels (Optional polish) */}
                  {sq.square.endsWith('1') && <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${sq.isLight ? 'text-gray-600' : 'text-gray-300'}`}>{sq.square[0]}</span>}
                  {sq.square.startsWith('a') && <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${sq.isLight ? 'text-gray-600' : 'text-gray-300'}`}>{sq.square[1]}</span>}

                  {/* Piece */}
                  {sq.piece && (
                    <span 
                      className={`
                        text-[8vmin] md:text-[min(8vmin,55px)] leading-none
                        ${sq.piece.color === 'w' 
                          ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]' 
                          : 'text-black'}
                        transition-transform duration-200
                        ${selectedSquare === sq.square ? 'scale-110 -translate-y-1' : ''}
                      `}
                    >
                      {PIECE_UNICODE[sq.piece.type]}
                    </span>
                  )}

                  {/* Move Indicators */}
                  {isMoveTarget && !isCapture && (
                    <div className="absolute w-1/3 h-1/3 bg-black/20 rounded-full pointer-events-none" />
                  )}
                  {isCapture && (
                    <div className="absolute w-full h-full border-[6px] border-black/20 rounded-full pointer-events-none" />
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Status Message */}
          {game.inCheck() && !game.isGameOver() && (
            <div className="px-4 py-2 bg-red-100 border border-red-500 text-red-700 rounded-lg flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">Check!</span>
            </div>
          )}
        </div>

        {/* Captured Pieces - White (captured by Black) */}
        <div className="flex flex-col gap-1 items-center min-w-[60px]">
          <div className="text-xs text-gray-600 font-bold mb-1">Captured</div>
          <div className="flex flex-wrap gap-1 justify-center max-w-[60px]">
            {capturedPieces.black.map((piece, idx) => (
              <span key={idx} className="text-2xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                {PIECE_UNICODE[piece]}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* --- Sidebar Menu --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col border-r border-gray-300">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Settings
              </h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wider">Board Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(THEMES) as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border transition-all
                        ${theme === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      <div className={`w-4 h-4 rounded-sm ${THEMES[t].dark}`} />
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wider">AI Difficulty</label>
                <div className="flex flex-col gap-2">
                  {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`
                        w-full p-3 rounded-lg text-left border transition-all
                        ${difficulty === d ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      <span className="font-bold">{d}</span>
                      <span className="block text-xs opacity-60">
                        {d === 'Easy' ? 'Depth 1 (Fast)' : d === 'Medium' ? 'Depth 2 (Balanced)' : 'Depth 3 (Thoughtful)'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  How to Play
                </button>
                <button 
                  onClick={resetGame}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
                >
                  <RotateCcw className="w-5 h-5" />
                  New Game
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
              v1.0.0 • React 18 • Chess.js
            </div>
          </div>
        </div>
      )}

      {/* --- Help Modal --- */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHelpOpen(false)} />
          <div className="relative bg-white border border-gray-300 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" /> How to Play
              </h3>
              <button onClick={() => setIsHelpOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-gray-700 space-y-4 leading-relaxed">
              <p>Welcome to Grandmaster AI! Here are the rules:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You play as <strong>White</strong> (bottom). The AI plays as <strong>Black</strong> (top).</li>
                <li><strong>Tap a piece</strong> to select it. Valid moves will appear as dots or rings.</li>
                <li><strong>Tap a highlighted square</strong> to move.</li>
                <li>The goal is to Checkmate the opponent's King.</li>
                <li>Use the <strong>Menu</strong> (top-left) to change difficulty or board theme.</li>
              </ul>
              <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-200">
                <strong>Tip:</strong> The "Hard" difficulty uses a depth-3 search with positional evaluation. It might take a second to think!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Game Over Modal --- */}
      {gameOverResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <div className="relative bg-white border-2 border-yellow-500 w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <button 
              onClick={() => setGameOverResult(null)} 
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-2">{gameOverResult}</h2>
            <p className="text-gray-600 mb-8">The game has ended.</p>
            
            <button 
              onClick={resetGame}
              className="w-full py-3 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-transform active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}