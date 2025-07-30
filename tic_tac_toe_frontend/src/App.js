import React, { useState, useEffect } from 'react';
import './App.css';

// Color palette from requirements
const COLORS = {
  primary: '#1565c0',
  accent:  '#ff7043',
  secondary: '#e3f2fd',
  lightText: '#222',
  winHighlight: '#ff7043',
};

/**
 * Winning lines (for 3x3 Tic Tac Toe)
 */
const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6] // diags
];

/**
 * Returns the winner symbol ('X' | 'O' | null)
 * Also returns the winning line if applicable.
 */
function calculateWinner(squares) {
  for (let line of WIN_LINES) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line };
    }
  }
  return { winner: null, line: [] };
}

/**
 * Simple AI: Computer picks first empty square.
 */
function computerMove(squares) {
  // Try to win
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      let copy = [...squares];
      copy[i] = 'O';
      if (calculateWinner(copy).winner === 'O') return i;
    }
  }
  // Block human win
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      let copy = [...squares];
      copy[i] = 'X';
      if (calculateWinner(copy).winner === 'X') return i;
    }
  }
  // Pick center, corners, then sides
  const order = [4,0,2,6,8,1,3,5,7];
  for (let idx of order) {
    if (!squares[idx]) return idx;
  }
  return -1;
}

/**
 * Square component.
 */
function Square({value, onClick, highlight, isActive}) {
  return (
    <button
      className="ttt-square"
      style={{
        color: value === 'X' ? COLORS.primary : COLORS.accent,
        background: highlight ? COLORS.secondary : '#fff',
        borderColor: isActive ? COLORS.accent : COLORS.primary,
        fontWeight: highlight ? 700 : 500,
        outline: isActive ? `2px solid ${COLORS.accent}` : 'none',
        boxShadow: isActive ? `0 0 8px ${COLORS.accent}33` : 'none'
      }}
      onClick={onClick}
      disabled={!isActive}
      aria-label={value ? value : "Empty square"}
      tabIndex={isActive ? 0 : -1}
    >
      {value}
    </button>
  );
}

/**
 * Board component. Renders the 3x3 grid.
 */
function Board({ squares, onSquareClick, winningLine, nextPlayer, isBoardActive }) {
  return (
    <div className="ttt-board"
         role="grid"
         aria-label="Tic Tac Toe board">
      {[0,1,2].map(row =>
        <div className="ttt-row" key={row}>
          {[0,1,2].map(col => {
            const idx = row*3 + col;
            const isWinning = winningLine && winningLine.includes(idx);
            const isActive = isBoardActive && !squares[idx];
            return (
              <Square
                key={idx}
                value={squares[idx]}
                onClick={() => onSquareClick(idx)}
                highlight={isWinning}
                isActive={isActive}
              />
            )
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Scoreboard and game status display.
 */
function StatusBar({ mode, scores, turn, gameOver, winner, draw }) {
  let statusMsg = "";
  if (gameOver) {
    if (draw) statusMsg = "It's a draw!";
    else statusMsg = winner ? `${winner} wins!` : '';
  } else {
    if ((mode === "vsHuman" || (mode === "vsComputer" && turn === "X")))
      statusMsg = `Turn: ${turn === "X" ? "Player X" : "Player O"}`;
    else if (mode === "vsComputer" && turn === "O") statusMsg = "Turn: Computer (O)";
  }
  return (
    <div className="ttt-status-container">
      <div className="ttt-status-title">Tic Tac Toe</div>
      <div className="ttt-scores">
        <div className="ttt-score-x">X: {scores.X}</div>
        <div className="ttt-score-o">O: {scores.O}</div>
        <div className="ttt-score-draw">Draw: {scores.D}</div>
      </div>
      <div className="ttt-status-message" aria-live="polite">{statusMsg}</div>
    </div>
  );
}

/**
 * Main App
 */
// PUBLIC_INTERFACE
function App() {
  // Game state
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X"); // "X" always starts
  const [mode, setMode] = useState("vsComputer"); // "vsComputer" | "vsHuman"
  const [gameOver, setGameOver] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState({ winner: null, line: [] });
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 });
  const [awaitingComputer, setAwaitingComputer] = useState(false);

  // Start a new game (keep scores)
  // PUBLIC_INTERFACE
  function newGame() {
    setSquares(Array(9).fill(null));
    setTurn("X");
    setGameOver(false);
    setWinnerInfo({ winner: null, line: [] });
    setAwaitingComputer(false);
  }

  // Reset whole match (reset scores)
  // PUBLIC_INTERFACE
  function resetMatch() {
    newGame();
    setScores({ X: 0, O: 0, D: 0 });
  }

  // Handle mode change (resets match, scores)
  // PUBLIC_INTERFACE
  function handleModeChange(newMode) {
    setMode(newMode);
    resetMatch();
  }

  // Square click
  // PUBLIC_INTERFACE
  function handleSquareClick(idx) {
    if (awaitingComputer) return;
    if (gameOver || squares[idx]) return;
    const nextSquares = squares.slice();
    nextSquares[idx] = turn;
    setSquares(nextSquares);

    // Compute winner immediately after click
    const { winner, line } = calculateWinner(nextSquares);
    if (winner || !nextSquares.includes(null)) {
      setGameOver(true);
      setWinnerInfo({ winner, line });
      if (winner) setScores(prev => ({...prev, [winner]: prev[winner]+1}));
      else setScores(prev => ({...prev, D: prev.D+1}));
      return;
    }
    setTurn(prev => prev === "X" ? "O" : "X");
  }

  // Computer move effect
  useEffect(() => {
    if (
      mode === "vsComputer" &&
      turn === "O" &&
      !gameOver &&
      !awaitingComputer
    ) {
      setAwaitingComputer(true);
      // Minimal artificial delay for UX
      const moveTimeout = setTimeout(() => {
        const idx = computerMove(squares);
        if (idx >= 0) handleSquareClick(idx);
        setAwaitingComputer(false);
      }, 400);
      return () => clearTimeout(moveTimeout);
    }
    // eslint-disable-next-line
  }, [turn, mode, squares, gameOver, awaitingComputer]);

  // If winner or draw set game over immediately
  useEffect(() => {
    const { winner, line } = calculateWinner(squares);
    if (winner || (!squares.includes(null) && !gameOver)) {
      setGameOver(true);
      setWinnerInfo({ winner, line });
      if (winner) setScores(prev => ({...prev, [winner]: prev[winner]+1}));
      else setScores(prev => ({...prev, D: prev.D+1}));
    }
    // eslint-disable-next-line
  }, [squares]);

  // Theme (always light as per requirements)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Keyboard accessibility (arrow navigation)
  // Optionally implement in further enhancement.

  return (
    <div className="ttt-app-root">
      <div className="ttt-main-container">
        <StatusBar
          mode={mode}
          scores={scores}
          turn={turn}
          gameOver={gameOver}
          winner={winnerInfo.winner}
          draw={!winnerInfo.winner && gameOver}
        />
        <div className="ttt-mode-selector">
          <button
            className={mode === "vsComputer" ? "ttt-mode-active" : "ttt-mode"}
            style={{
              background: mode === 'vsComputer' ? COLORS.primary : COLORS.secondary,
              color: mode === 'vsComputer' ? '#fff' : COLORS.primary
            }}
            onClick={() => handleModeChange('vsComputer')}
            disabled={mode === 'vsComputer'}
          >
            Play vs Computer
          </button>
          <button
            className={mode === "vsHuman" ? "ttt-mode-active" : "ttt-mode"}
            style={{
              background: mode === 'vsHuman' ? COLORS.primary : COLORS.secondary,
              color: mode === 'vsHuman' ? '#fff' : COLORS.primary
            }}
            onClick={() => handleModeChange('vsHuman')}
            disabled={mode === 'vsHuman'}
          >
            Play vs Player
          </button>
        </div>
        <Board
          squares={squares}
          onSquareClick={handleSquareClick}
          winningLine={winnerInfo.line}
          nextPlayer={turn}
          isBoardActive={!gameOver && !(awaitingComputer && mode === "vsComputer" && turn === "O")}
        />
        <div className="ttt-controls">
          <button
            className="ttt-btn"
            style={{ background: COLORS.primary, color: '#fff'}}
            onClick={newGame}
            disabled={!gameOver && squares.every(sq => !sq)}
          >New Game</button>
          <button
            className="ttt-btn"
            style={{ background: COLORS.accent, color: '#fff'}}
            onClick={resetMatch}
          >Reset Match</button>
        </div>
        <div className="ttt-footer" style={{marginTop:"16px", color: "#999", fontSize:"0.9rem"}}>
          Minimalistic React Tic Tac Toe &middot; <span style={{color: COLORS.primary}}>Kavia</span>
        </div>
      </div>
    </div>
  );
}

export default App;
