import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { motion as Motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Switch } from "./components/ui/switch";
import { Crown, RefreshCw, RotateCcw, Swords, Sun, Moon } from "lucide-react";

// Unicode piece map
const PIECE_ICON = {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
};

// Small helper for delayed AI move to show animations nicely
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Simple material evaluation for AI
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evaluateBoard(chess) {
    let score = 0;
    const board = chess.board();
    for (const row of board) {
        for (const piece of row) {
            if (!piece) continue;
            const val = PIECE_VALUES[piece.type] ?? 0;
            score += piece.color === "w" ? val : -val;
        }
    }
    const mobility = chess.moves().length * 0.5;
    score += chess.turn() === "w" ? mobility : -mobility;
    return score;
}

function aiBestMove(chess, depth = 2) {
    const isMaximizing = chess.turn() === "w";
    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    function minimax(ch, d, alpha, beta, maximizing) {
        if (d === 0 || ch.isGameOver()) return evaluateBoard(ch);

        const moves = ch.moves({ verbose: true });
        moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

        if (maximizing) {
            let maxEval = -Infinity;
            for (const m of moves) {
                ch.move(m);
                const evalScore = minimax(ch, d - 1, alpha, beta, false);
                ch.undo();
                if (evalScore > maxEval) maxEval = evalScore;
                if (evalScore > alpha) alpha = evalScore;
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const m of moves) {
                ch.move(m);
                const evalScore = minimax(ch, d - 1, alpha, beta, true);
                ch.undo();
                if (evalScore < minEval) minEval = evalScore;
                if (evalScore < beta) beta = evalScore;
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    const moves = chess.moves({ verbose: true });
    moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

    for (const m of moves) {
        chess.move(m);
        const score = minimax(chess, depth - 1, -Infinity, Infinity, chess.turn() === "w");
        chess.undo();
        if (isMaximizing ? score > bestScore : score < bestScore) {
            bestScore = score;
            bestMove = m;
        }
    }
    return bestMove;
}

// Coordinates helpers
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

function indexToAlgebraic(file, rank) {
    return `${FILES[file]}${RANKS[rank]}`;
}

// Main App
export default function BeautifulChess() {
    const [chess] = useState(() => new Chess());
    const [boardKey, setBoardKey] = useState(0);
    const [selected, setSelected] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [flip, setFlip] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [mode, setMode] = useState("hvh");
    const [aiPlays, setAiPlays] = useState("black");
    const [aiDepth, setAiDepth] = useState(2);
    const containerRef = useRef(null);

    const gameOverInfo = useMemo(() => {
        if (!chess.isGameOver()) return null;
        if (chess.isCheckmate()) {
            return `${chess.turn() === "w" ? "Black" : "White"} wins by checkmate`;
        }
        if (chess.isDraw()) return "Draw";
        if (chess.isStalemate()) return "Stalemate";
        if (chess.isThreefoldRepetition()) return "Draw by repetition";
        if (chess.isInsufficientMaterial()) return "Draw by insufficient material";
        return "Game over";
    }, [chess]);

    useEffect(() => {
        const sideToMove = chess.turn() === "w" ? "white" : "black";
        if (mode === "hva" && sideToMove === aiPlays && !chess.isGameOver()) {
            (async () => {
                await sleep(300);
                const best = aiBestMove(chess, aiDepth) || chess.moves({ verbose: true })[0];
                if (best) {
                    chess.move(best);
                    setLastMove({ from: best.from, to: best.to });
                    setSelected(null);
                    setLegalMoves([]);
                    setBoardKey((k) => k + 1);
                }
            })();
        }
    }, [boardKey, mode, aiPlays, aiDepth, chess]);

    const turnColor = chess.turn() === "w" ? "White" : "Black";

    const squares = useMemo(() => {
        const grid = [];
        for (let r = 7; r >= 0; r--) {
            const row = [];
            for (let f = 0; f < 8; f++) {
                const sq = indexToAlgebraic(f, r);
                const piece = chess.get(sq);
                row.push({ square: sq, piece });
            }
            grid.push(row);
        }
        if (!flip) return grid;
        return grid.map((row) => [...row].reverse()).reverse();
    }, [chess, flip, boardKey]);

    function onSquareClick(sq) {
        if (gameOverInfo) return;

        if (mode === "hva") {
            if ((aiPlays === "white" && chess.turn() === "w") || (aiPlays === "black" && chess.turn() === "b")) {
                return;
            }
        }

        if (!selected) {
            const piece = chess.get(sq);
            if (!piece) return;
            const humanColor = mode === "hva" ? (aiPlays === "white" ? "b" : "w") : chess.turn();
            if (piece.color !== humanColor) return;

            const legal = chess.moves({ square: sq, verbose: true }).map((m) => m.to);
            setSelected(sq);
            setLegalMoves(legal);
        } else {
            let move = null;
            const movingPiece = chess.get(selected);

            try {
                if (movingPiece && movingPiece.type === "p") {
                    const targetRank = sq[1];
                    const needsPromotion =
                        (movingPiece.color === "w" && targetRank === "8") ||
                        (movingPiece.color === "b" && targetRank === "1");
                    if (needsPromotion) {
                        move = chess.move({ from: selected, to: sq, promotion: "q" });
                    } else {
                        move = chess.move({ from: selected, to: sq });
                    }
                } else {
                    move = chess.move({ from: selected, to: sq });
                }
            } catch (err) {
                console.error(err);
            }

            if (move) {
                setLastMove({ from: move.from, to: move.to });
                setSelected(null);
                setLegalMoves([]);
                setBoardKey((k) => k + 1);
            } else {
                const piece = chess.get(sq);
                if (piece && chess.get(selected) && piece.color === chess.get(selected).color) {
                    const legal = chess.moves({ square: sq, verbose: true }).map((m) => m.to);
                    setSelected(sq);
                    setLegalMoves(legal);
                } else {
                    setSelected(null);
                    setLegalMoves([]);
                }
            }
        }
    }

    function reset() {
        chess.reset();
        setSelected(null);
        setLegalMoves([]);
        setLastMove(null);
        setBoardKey((k) => k + 1);
    }

    function undo() {
        chess.undo();
        setSelected(null);
        setLegalMoves([]);
        setBoardKey((k) => k + 1);
    }

    function renderSquare(cell, i, j) {
        const realSq = cell.square;
        const isDark = (i + j) % 2 === 1;

        const isSelected = selected === realSq;
        const isLegal = legalMoves.includes(realSq);
        const isLastMove = lastMove && (lastMove.from === realSq || lastMove.to === realSq);

        let baseClasses = isDark
            ? "bg-gradient-to-br from-slate-600 to-slate-700"
            : "bg-gradient-to-br from-slate-300 to-slate-200";
        if (isLastMove) baseClasses += " ring-2 ring-amber-400";
        if (isSelected) baseClasses += " outline outline-4 outline-sky-400";

        return (
            <button
                key={realSq}
                onClick={() => onSquareClick(realSq)}
                className={`relative aspect-square w-full ${baseClasses} flex items-center justify-center transition-colors`}
            >
                {cell.piece && (
                    <Motion.span
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`text-4xl md:text-5xl select-none ${cell.piece.color === "w"
                            ? "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                            : "text-black"
                            }`}
                    >
                        {PIECE_ICON[cell.piece.color === "w" ? cell.piece.type.toUpperCase() : cell.piece.type]}
                    </Motion.span>
                )}
                {isLegal && (
                    <span className="absolute h-4 w-4 rounded-full bg-black/30 dark:bg-white/30" />
                )}
                {i === 7 && (
                    <span className="absolute bottom-1 right-1 text-xs opacity-60">
                        {realSq[0]}
                    </span>
                )}
                {j === 0 && (
                    <span className="absolute top-1 left-1 text-xs opacity-60">
                        {realSq[1]}
                    </span>
                )}
            </button>
        );
    }

    const movesSAN = chess.history({ verbose: true });

    {/* text colour should be inverted according to the theme */}
    return (
        <div
            ref={containerRef}
            className={`min-h-screen w-full ${darkMode
                ? "dark bg-gradient-to-br from-slate-900 via-slate-950 to-black"
                : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
                } text-center text-white px-4 py-6 md:px-12 md:py-6`}
        >
            <div className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Swords className="h-6 w-6 text-amber-600" />
                        <h1 className="text-2xl dark:text-amber-500 md:text-3xl font-bold tracking-tight">
                            Beautiful Chess
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                            <Moon className="h-4 w-4" />
                        </div>
                        <Button variant="outline" onClick={() => setFlip((f) => !f)} className="gap-2 bg-gray-700/20 hover:bg-gray-700/30 text-gray-500">
                            <RotateCcw className="h-4 w-4" /> Flip
                        </Button>
                        <Button onClick={reset} className="gap-2">
                            <RefreshCw className="h-4 w-4 text-gray-800" /> Reset
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Board */}
                    <Card className="lg:col-span-2 border-none bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                                    <Crown
                                        className={`h-5 w-5 ${chess.turn() === "w" ? "text-yellow-500" : "text-zinc-400"
                                            }`}
                                    />
                                    Turn: <b>{turnColor}</b>
                                </span>
                                {gameOverInfo && (
                                    <span className="text-rose-500 font-semibold">{gameOverInfo}</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-8 gap-1 rounded-2xl p-2 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 shadow-inner">
                                {squares.map((row, i) => (
                                    <React.Fragment key={i}>
                                        {row.map((cell, j) => renderSquare(cell, i, j))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-none dark:bg-white/5 backdrop-blur-xl shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-gray-300 dark:text-gray-400">Game Mode</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Select value={mode} onValueChange={(v) => setMode(v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hvh">Human vs Human</SelectItem>
                                            <SelectItem value="hva">Human vs AI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {mode === "hva" && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span>AI plays</span>
                                            <Select value={aiPlays} onValueChange={(v) => setAiPlays(v)}>
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="white">White</SelectItem>
                                                    <SelectItem value="black">Black</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>AI depth</span>
                                            <Select value={String(aiDepth)} onValueChange={(v) => setAiDepth(Number(v))}>
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 (fast)</SelectItem>
                                                    <SelectItem value="2">2</SelectItem>
                                                    <SelectItem value="3">3 (stronger)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="secondary" onClick={undo} className="w-full">
                                        Undo
                                    </Button>
                                    <Button variant="outline" onClick={() => setFlip((f) => !f)} className="w-full text-gray-500 dark:text-gray-500 gap-2">
                                        Flip
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl">
                            <CardHeader>
                                <CardTitle>Moves</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[320px] overflow-auto rounded-xl p-3 bg-gradient-to-b from-slate-100 to-white dark:from-slate-900 dark:to-slate-950">
                                    {movesSAN.length === 0 ? (
                                        <p className="text-sm opacity-70">No moves yet. Make the first move!</p>
                                    ) : (
                                        <ol className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                            {movesSAN.map((m, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <span className="opacity-50 w-6 text-right">
                                                        {Math.floor(idx / 2) + 1}.
                                                    </span>
                                                    <span className="font-medium">{m.san}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="text-stone-800 dark:text-stone-500 border-none bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl">
                            <CardHeader>
                                <CardTitle>Tips</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-2 text-sm opacity-80 text-shadow-indigo-400 dark:text-shadow-indigo-900">
                                    <li>Click a piece to see its legal moves.</li>
                                    <li>Last move is highlighted; flip the board anytime.</li>
                                    <li>Play against a simple built-in AI (depth selectable).</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
