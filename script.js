// ---------- Board setup ----------
let board, turn, selected, legalTargets, gameOver;

const UNICODE = {
  wK:"♔", wQ:"♕", wR:"♖", wB:"♗", wN:"♘", wP:"♙",
  bK:"♚", bQ:"♛", bR:"♜", bB:"♝", bN:"♞", bP:"♟"
};

const VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

function newGame() {
  board = [
    ["bR","bN","bB","bQ","bK","bB","bN","bR"],
    ["bP","bP","bP","bP","bP","bP","bP","bP"],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ["wP","wP","wP","wP","wP","wP","wP","wP"],
    ["wR","wN","wB","wQ","wK","wB","wN","wR"]
  ];
  turn = "w";
  selected = null;
  legalTargets = [];
  gameOver = false;
  setStatus("Your move (White)");
  render();
}

// ---------- Move generation ----------
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function getPseudoMoves(bd, r, c) {
  const piece = bd[r][c];
  if (!piece) return [];
  const color = piece[0], type = piece[1];
  const enemy = color === "w" ? "b" : "w";
  const moves = [];

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    if (inBounds(r + dir, c) && !bd[r + dir][c]) {
      moves.push({ r: r + dir, c: c });
      if (r === startRow && !bd[r + 2 * dir][c]) {
        moves.push({ r: r + 2 * dir, c: c });
      }
    }
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (inBounds(nr, nc) && bd[nr][nc] && bd[nr][nc][0] === enemy) {
        moves.push({ r: nr, c: nc });
      }
    }
  } else if (type === "N") {
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of deltas) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && (!bd[nr][nc] || bd[nr][nc][0] === enemy)) {
        moves.push({ r: nr, c: nc });
      }
    }
  } else if (type === "B" || type === "R" || type === "Q") {
    const dirs = [];
    if (type === "B" || type === "Q") dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (type === "R" || type === "Q") dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        if (!bd[nr][nc]) {
          moves.push({ r: nr, c: nc });
        } else {
          if (bd[nr][nc][0] === enemy) moves.push({ r: nr, c: nc });
          break;
        }
        nr += dr; nc += dc;
      }
    }
  } else if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && (!bd[nr][nc] || bd[nr][nc][0] === enemy)) {
          moves.push({ r: nr, c: nc });
        }
      }
    }
  }
  return moves;
}

function isSquareAttacked(bd, r, c, byColor) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const p = bd[i][j];
      if (p && p[0] === byColor) {
        const moves = getPseudoMoves(bd, i, j);
        if (moves.some(m => m.r === r && m.c === c)) return true;
      }
    }
  }
  return false;
}

function findKing(bd, color) {
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++)
      if (bd[i][j] === color + "K") return { r: i, c: j };
  return null;
}

function makeMoveCopy(bd, from, to) {
  const nb = bd.map(row => row.slice());
  const piece = nb[from.r][from.c];
  nb[to.r][to.c] = piece;
  nb[from.r][from.c] = null;
  if (piece[1] === "P" && (to.r === 0 || to.r === 7)) {
    nb[to.r][to.c] = piece[0] + "Q";
  }
  return nb;
}

function getLegalMoves(bd, color) {
  const legal = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = bd[r][c];
      if (p && p[0] === color) {
        const pseudo = getPseudoMoves(bd, r, c);
        for (const m of pseudo) {
          const nb = makeMoveCopy(bd, { r, c }, m);
          const kingPos = findKing(nb, color);
          if (!isSquareAttacked(nb, kingPos.r, kingPos.c, color === "w" ? "b" : "w")) {
            legal.push({ from: { r, c }, to: m });
          }
        }
      }
    }
  }
  return legal;
}

// ---------- Evaluation & AI ----------
function evaluate(bd) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = bd[r][c];
      if (p) {
        const val = VALUES[p[1]];
        score += p[0] === "w" ? val : -val;
      }
    }
  }
  return score;
}

function minimax(bd, depth, alpha, beta, maximizing) {
  const color = maximizing ? "w" : "b";
  const moves = getLegalMoves(bd, color);

  if (moves.length === 0) {
    const kingPos = findKing(bd, color);
    const inCheck = isSquareAttacked(bd, kingPos.r, kingPos.c, color === "w" ? "b" : "w");
    if (inCheck) return { score: maximizing ? -99000 - depth : 99000 + depth };
    return { score: 0 };
  }

  if (depth === 0) return { score: evaluate(bd) };

  let bestMove = null;
  if (maximizing) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const nb = makeMoveCopy(bd, m.from, m.to);
      const { score } = minimax(nb, depth - 1, alpha, beta, false);
      if (score > maxEval) { maxEval = score; bestMove = m; }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const nb = makeMoveCopy(bd, m.from, m.to);
      const { score } = minimax(nb, depth - 1, alpha, beta, true);
      if (score < minEval) { minEval = score; bestMove = m; }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

function aiMove() {
  const { move } = minimax(board, 3, -Infinity, Infinity, false);
  if (move) {
    board = makeMoveCopy(board, move.from, move.to);
  }
  turn = "w";
  checkGameState();
  render();
}

// ---------- Game state / status ----------
function checkGameState() {
  const legal = getLegalMoves(board, turn);
  const kingPos = findKing(board, turn);
  const inCheck = isSquareAttacked(board, kingPos.r, kingPos.c, turn === "w" ? "b" : "w");

  if (legal.length === 0) {
    gameOver = true;
    if (inCheck) {
      setStatus((turn === "w" ? "Black" : "White") + " wins by checkmate!");
    } else {
      setStatus("Stalemate — draw.");
    }
    return;
  }
  if (inCheck) {
    setStatus((turn === "w" ? "White" : "Black") + " is in check.");
  } else {
    setStatus(turn === "w" ? "Your move (White)" : "AI thinking...");
  }
}

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

// ---------- Rendering & interaction ----------
function render() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      sq.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
      const piece = board[r][c];
      if (piece) {
        sq.textContent = UNICODE[piece];
        sq.classList.add(piece[0] === "w" ? "white-piece" : "black-piece");
      }
      if (selected && selected.r === r && selected.c === c) {
        sq.classList.add("selected");
      }
      if (legalTargets.some(t => t.r === r && t.c === c)) {
        sq.classList.add("legal");
      }
      sq.addEventListener("click", () => onSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

function onSquareClick(r, c) {
  if (gameOver || turn !== "w") return;

  const piece = board[r][c];

  if (selected) {
    const isTarget = legalTargets.some(t => t.r === r && t.c === c);
    if (isTarget) {
      board = makeMoveCopy(board, selected, { r, c });
      selected = null;
      legalTargets = [];
      turn = "b";
      checkGameState();
      render();
      if (!gameOver) {
        setTimeout(aiMove, 300);
      }
      return;
    }
    // clicking another own piece re-selects
    if (piece && piece[0] === "w") {
      selectSquare(r, c);
    } else {
      selected = null;
      legalTargets = [];
      render();
    }
    return;
  }

  if (piece && piece[0] === "w") {
    selectSquare(r, c);
  }
}

function selectSquare(r, c) {
  selected = { r, c };
  const allLegal = getLegalMoves(board, "w");
  legalTargets = allLegal
    .filter(m => m.from.r === r && m.from.c === c)
    .map(m => m.to);
  render();
}

document.getElementById("newGameBtn").addEventListener("click", newGame);

newGame();
