window.HamiltonMod = window.HamiltonMod || {};

////////////////////////////////////////////////////////////////////
// RUN CODE BEFORE
////////////////////////////////////////////////////////////////////

window.HamiltonMod.runCodeBefore = function () {
  console.log(
    "Hamilton Mod loaded — wall-mode tour overlay (DarkSnakeGang/GoogleSnakeWallSolver)"
  );

  if (typeof window.assertReplace !== "function") {
    window.assertReplace = function (baseText, regex, replacement) {
      if (typeof baseText !== "string") {
        throw new Error("String argument expected for assertReplace");
      }
      if (!regex.test(baseText)) {
        throw new Error(
          "assertReplace failed — pattern not found: " + regex.toString()
        );
      }
      regex.lastIndex = 0;
      return baseText.replace(regex, replacement);
    };
    String.prototype.assertReplace = function (regex, replacement) {
      return window.assertReplace(this.toString(), regex, replacement);
    };
  }

  if (typeof window.catchError !== "function") {
    window.catchError = function (culprit_regex, code) {
      try {
        code.match(culprit_regex)[0];
      } catch (e) {
        console.log("HamiltonMod catchError", culprit_regex);
        throw e;
      }
      return false;
    };
  }

  const HM = window.HamiltonMod;
  HM.SOLVER_BASE =
    window.HAMILTON_SOLVER_BASE ||
    "https://darksnakegang.github.io/GoogleSnakeWallSolver/";
  HM.WALL_SOLVER_SIZES = {
    0: { width: 17, height: 15, cells: 255 },
    1: { width: 10, height: 9, cells: 90 },
    2: { width: 24, height: 21, cells: 504 },
  };

  HM.currentTour = null;
  HM.isCycle = false;
  HM.iconState = "idle";
  HM.solveId = 0;
  HM.solvePhase = "idle";
  HM._activeBits = null;
  HM._activeSolveId = 0;
  HM._workerEpoch = 0;
  HM.worker = null;
  HM._boardProps = null;
  HM.WORKER_MAX_RETRIES = 4;
  HM.WORKER_RETRY_MS = 200;

  HM.isWallMode = function isWallMode() {
    try {
      if (
        window.ModeRegistry &&
        typeof window.ModeRegistry.getCurrentModeKey === "function"
      ) {
        return window.ModeRegistry.getCurrentModeKey() === "wall";
      }
    } catch (_) {
      /* ignore */
    }
    if (typeof window.CurrentModeNum === "number") {
      return window.CurrentModeNum === 1;
    }
    // Standalone (no Pudding): wall place(null,5) only runs in wall-capable modes.
    return true;
  };

  if (typeof window.coordinatesToBoardString !== "function") {
    window.coordinatesToBoardString = function coordinatesToBoardString(
      coordinates
    ) {
      const sizeIdx =
        window.timeKeeper &&
        typeof window.timeKeeper.getCurrentSetting === "function"
          ? window.timeKeeper.getCurrentSetting("size")
          : -1;
      const dims =
        (window.WALL_SOLVER_SIZES || HM.WALL_SOLVER_SIZES)[sizeIdx];
      if (!dims) return false;
      const board = Array(dims.cells).fill("0");
      (coordinates || []).forEach(function (coord) {
        const x = coord[0];
        const y = coord[1];
        if (x < 0 || y < 0 || x >= dims.width || y >= dims.height) return;
        board[y * dims.width + x] = "1";
      });
      return board.join("");
    };
  }

  if (!window.WALL_SOLVER_SIZES) {
    window.WALL_SOLVER_SIZES = HM.WALL_SOLVER_SIZES;
  }

  HM.WALL_ICON_SRC =
    "https://www.google.com/logos/fnbx/snake_arcade/v22/trophy_01.png";
  HM._statIconOrigSrc = null;
  HM._iconTimer = null;
  HM._workerPromise = null;

  /* __HAMILTON_INLINE_WORKER_START__ */
  HM._INLINE_CLASSIC_WORKER = "(() => {\n  // js/dfs-wasm-stub.js\n  function dfsWasmReady() {\n    return false;\n  }\n  async function initDfsWasm() {\n    return false;\n  }\n  function dfsWasmConfigure() {\n  }\n  function dfsWasmSetCancelled() {\n  }\n  function dfsWasmRun() {\n    return false;\n  }\n\n  // js/hampath.js\n  var WALL = 2;\n  var WIDTH = 10;\n  var HEIGHT = 9;\n  var N = WIDTH * HEIGHT;\n  var NEIGHBORS = [];\n  var NBR_MASK = [];\n  var DY = [-1, 1, 0, 0];\n  var DX = [0, 0, -1, 1];\n  var OPP = [1, 0, 3, 2];\n  var activeProgress = null;\n  var cancelCheck = null;\n  var cancelCounter = 0;\n  function bit(i) {\n    return 1n << BigInt(i);\n  }\n  function bitCount(value) {\n    let count = 0;\n    for (let bits = value; bits; bits &= bits - 1n) count++;\n    return count;\n  }\n  function lowestBitIndex(value) {\n    if (!value) return -1;\n    let index = 0;\n    for (let bits = value; (bits & 1n) === 0n; bits >>= 1n) index++;\n    return index;\n  }\n  function checkCancelled(force = false) {\n    if (!cancelCheck) return false;\n    if (!force && (++cancelCounter & 4095) !== 0) return false;\n    return Boolean(cancelCheck());\n  }\n  function setCancelCheck(fn) {\n    if (fn != null && typeof fn !== \"function\") {\n      throw new TypeError(\"cancel check must be a function or null\");\n    }\n    cancelCheck = fn || null;\n    cancelCounter = 0;\n    dfsWasmSetCancelled(false);\n  }\n  function syncWasmCancel() {\n    dfsWasmSetCancelled(Boolean(cancelCheck && cancelCheck()));\n  }\n  function configureBoard(width = 10, height = 9) {\n    if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {\n      throw new RangeError(\"board width and height must be positive integers\");\n    }\n    WIDTH = width;\n    HEIGHT = height;\n    N = width * height;\n    NEIGHBORS = Array.from({ length: N }, (_, i) => {\n      const r = Math.floor(i / WIDTH);\n      const c = i % WIDTH;\n      const out = [];\n      if (r > 0) out.push(i - WIDTH);\n      if (r + 1 < HEIGHT) out.push(i + WIDTH);\n      if (c > 0) out.push(i - 1);\n      if (c + 1 < WIDTH) out.push(i + 1);\n      return out;\n    });\n    NBR_MASK = NEIGHBORS.map((neighbors) => {\n      let mask = 0n;\n      for (const neighbor of neighbors) mask |= bit(neighbor);\n      return mask;\n    });\n    dfsWasmConfigure(width, height);\n  }\n  configureBoard();\n  var SearchProgress = class {\n    constructor(emit2, interval = 1e3) {\n      if (typeof emit2 !== \"function\") throw new TypeError(\"emit must be a function\");\n      this.emit = emit2;\n      this.interval = interval < 10 ? interval * 1e3 : interval;\n      this.t0 = performance.now();\n      this.last = 0;\n      this.steps = 0;\n      this.phase = \"start\";\n    }\n    setPhase(phase) {\n      this.phase = phase;\n      this.steps = 0;\n      this.send(\"\", true);\n    }\n    add(n = 1, extra = \"\") {\n      this.steps += n;\n      if ((this.steps & 8191) === 0) this.maybeSend(extra);\n    }\n    tick(extra = \"\") {\n      this.steps++;\n      this.maybeSend(extra);\n    }\n    maybeSend(extra = \"\") {\n      if (performance.now() - this.last >= this.interval) this.send(extra);\n    }\n    send(extra = \"\", force = false) {\n      const now = performance.now();\n      if (!force && now - this.last < this.interval) return;\n      this.last = now;\n      const elapsed = (now - this.t0) / 1e3;\n      const parts = [`${elapsed.toFixed(0)}s`, this.phase];\n      if (this.steps) {\n        parts.push(`${this.steps.toLocaleString()} steps`);\n        if (elapsed >= 1) parts.push(`${Math.round(this.steps / elapsed).toLocaleString()}/s`);\n      }\n      if (extra) parts.push(extra);\n      this.emit(parts.join(\" \\xB7 \"));\n    }\n  };\n  function progressScope(emit2, interval = 1e3, run = null) {\n    if (typeof interval === \"function\") {\n      run = interval;\n      interval = 1e3;\n    }\n    const previous = activeProgress;\n    const progress = new SearchProgress(emit2, interval);\n    activeProgress = progress;\n    progress.close = () => {\n      if (activeProgress === progress) activeProgress = previous;\n    };\n    progress.dispose = progress.close;\n    if (typeof run !== \"function\") return progress;\n    try {\n      const result = run(progress);\n      if (result && typeof result.finally === \"function\") {\n        return result.finally(() => progress.close());\n      }\n      progress.close();\n      return result;\n    } catch (error) {\n      progress.close();\n      throw error;\n    }\n  }\n  function currentProgress() {\n    return activeProgress;\n  }\n  function idx(r, c) {\n    return r * WIDTH + c;\n  }\n  function cellOf(i) {\n    return [Math.floor(i / WIDTH), i % WIDTH];\n  }\n  function colorOf(i) {\n    const [r, c] = cellOf(i);\n    return r + c & 1;\n  }\n  function validateGrid(grid) {\n    if (!Array.isArray(grid) || grid.length !== HEIGHT || grid.some((row) => !Array.isArray(row) || row.length !== WIDTH)) {\n      throw new RangeError(`expected ${HEIGHT}x${WIDTH} grid`);\n    }\n  }\n  function freeMask(grid) {\n    let free = 0n;\n    for (let r = 0; r < HEIGHT; r++) {\n      for (let c = 0; c < WIDTH; c++) {\n        if (grid[r][c] !== WALL) free |= bit(idx(r, c));\n      }\n    }\n    return free;\n  }\n  function degree(i, remaining) {\n    return bitCount(NBR_MASK[i] & remaining);\n  }\n  function reachableMask(start, remaining) {\n    let seen = 0n;\n    const stack = [start];\n    while (stack.length) {\n      if (checkCancelled()) return seen;\n      const i = stack.pop();\n      const cellBit = bit(i);\n      if (seen & cellBit) continue;\n      seen |= cellBit;\n      let rest = NBR_MASK[i] & remaining & ~seen;\n      while (rest) {\n        const nextBit = rest & -rest;\n        stack.push(lowestBitIndex(nextBit));\n        rest ^= nextBit;\n      }\n    }\n    return seen;\n  }\n  function coloringAllowsPath(grid) {\n    let black = 0;\n    let white = 0;\n    for (let r = 0; r < HEIGHT; r++) {\n      for (let c = 0; c < WIDTH; c++) {\n        if (grid[r][c] !== WALL) r + c & 1 ? black++ : white++;\n      }\n    }\n    return Math.abs(black - white) <= 1;\n  }\n  function pathColoringReport(grid) {\n    validateGrid(grid);\n    const free = freeMask(grid);\n    const nfree = bitCount(free);\n    let black = 0;\n    let white = 0;\n    const deg1 = [];\n    const isolated = [];\n    for (let i = 0; i < N; i++) {\n      if (!(free & bit(i))) continue;\n      colorOf(i) ? black++ : white++;\n      const d = degree(i, free);\n      if (d === 0) isolated.push(i);\n      else if (d === 1) deg1.push(i);\n    }\n    const diff = Math.abs(black - white);\n    const reasons = [];\n    const cycleReasons = [];\n    const proofCells = [];\n    const cycleProofCells = [];\n    const add = (bucket, proof, code, text, indices) => {\n      const cells = indices.map(cellOf);\n      bucket.push({ code, text, cells });\n      for (const cell of cells) {\n        if (!proof.some(([r, c]) => r === cell[0] && c === cell[1])) proof.push(cell);\n      }\n    };\n    const addPath = (code, text, cells) => add(reasons, proofCells, code, text, cells);\n    const addCycle = (code, text, cells) => add(cycleReasons, cycleProofCells, code, text, cells);\n    const extra = [];\n    let first = -1;\n    if (nfree > 1) {\n      first = lowestBitIndex(free);\n      const reached = reachableMask(first, free);\n      let rest = free & ~reached;\n      while (rest) {\n        const start = lowestBitIndex(rest);\n        extra.push(start);\n        rest &= ~reachableMask(start, free);\n      }\n    }\n    if (nfree > 0 && nfree < 4) {\n      addCycle(\n        \"too_small\",\n        `${nfree} open cell${nfree === 1 ? \"\" : \"s\"} (a grid cycle needs at least 4)`,\n        [...isolated, ...deg1]\n      );\n    }\n    if (nfree > 1 && isolated.length) {\n      const count = isolated.length;\n      addCycle(\"isolated\", `${count} isolated open cell${count === 1 ? \"\" : \"s\"} (a cycle cannot jump the gap)`, isolated);\n      addPath(\"isolated\", `${count} isolated open cell${count === 1 ? \"\" : \"s\"} (a path cannot jump the gap)`, isolated);\n    }\n    if (extra.length) {\n      const starts = [first, ...extra];\n      addCycle(\"disconnected\", `${starts.length} disconnected open regions (a cycle stays in one piece)`, starts);\n      addPath(\"disconnected\", `${starts.length} disconnected open regions (a path stays in one piece)`, starts);\n    }\n    if (black !== white) {\n      addCycle(\"imbalance\", `|black\\u2212white|=${diff} (a cycle needs equally many black and white cells)`, []);\n    }\n    if (nfree & 1 && diff >= 3) {\n      addPath(\"path_imbalance\", `|black\\u2212white|=${diff} on an odd board (a path needs a difference of exactly 1)`, []);\n    }\n    if (deg1.length) {\n      addCycle(\"dead_end\", `${deg1.length} dead-end${deg1.length === 1 ? \"\" : \"s\"} (a cycle has no endpoints)`, deg1);\n    }\n    if (deg1.length > 2) {\n      addPath(\"too_many_dead_ends\", `${deg1.length} dead-ends (a path has two ends; extras cannot be visited)`, deg1);\n    }\n    if (nfree > 1 && nfree & 1 && deg1.length) {\n      const majority = black > white ? 1 : 0;\n      const bad = deg1.filter((i) => colorOf(i) !== majority);\n      if (bad.length) {\n        addPath(\n          \"minority_dead_end\",\n          \"dead-end on the minority color; both path ends must sit on the majority color\",\n          bad\n        );\n      }\n    } else if (nfree > 1 && !(nfree & 1) && deg1.length === 2 && colorOf(deg1[0]) === colorOf(deg1[1])) {\n      addPath(\n        \"same_color_dead_ends\",\n        \"both dead-ends are the same color; a path's two ends must be opposite colors\",\n        deg1\n      );\n    }\n    if (nfree > 3 && !checkCancelled(true)) {\n      const cuts = [];\n      for (let i = 0; i < N; i++) {\n        if (!(free & bit(i))) continue;\n        const remaining = free ^ bit(i);\n        let components = 0;\n        let left = remaining;\n        while (left) {\n          const start = lowestBitIndex(left);\n          left &= ~reachableMask(start, remaining);\n          if (++components >= 3) {\n            cuts.push(i);\n            break;\n          }\n        }\n        if (checkCancelled()) break;\n      }\n      if (cuts.length) {\n        const text = `${cuts.length} cell${cuts.length === 1 ? \"\" : \"s\"} whose removal splits the board into three rooms`;\n        addCycle(\"three_way_cut\", `${text} (a cycle cannot serve three rooms)`, cuts);\n        addPath(\"three_way_cut\", `${text} (a path has only two ends)`, cuts);\n      }\n    }\n    const pathColoring = reasons.length > 0;\n    const cycleColoring = cycleReasons.length > 0;\n    return {\n      black,\n      white,\n      diff,\n      cycle_possible: !cycleColoring,\n      cycle_coloring: cycleColoring,\n      cycle_coloring_no: black !== white,\n      cycle_reasons: cycleReasons,\n      cycle_proof_cells: cycleProofCells,\n      path_possible: !pathColoring && diff <= 1,\n      path_coloring: pathColoring,\n      blocked: pathColoring,\n      reasons,\n      proof_cells: proofCells\n    };\n  }\n  function bitsToGrid(text) {\n    let bits = String(text).replace(/\\s/g, \"\");\n    if (/^[12]*$/.test(bits)) bits = bits.replace(/1/g, \"0\").replace(/2/g, \"1\");\n    if (bits.length !== N || /[^01]/.test(bits)) {\n      throw new RangeError(`expected ${N} wall bits`);\n    }\n    return Array.from({ length: HEIGHT }, (_, r) => Array.from({ length: WIDTH }, (_2, c) => bits[idx(r, c)] === \"1\" ? WALL : 1));\n  }\n  function colorCount(remaining) {\n    let black = 0;\n    for (let bits = remaining; bits; ) {\n      const next = bits & -bits;\n      if (colorOf(lowestBitIndex(next))) black++;\n      bits ^= next;\n    }\n    return black;\n  }\n  function warnsdorffDfsJs(initialHead, initialRemaining, initialCount, initialBlack, requiredEnd = null, nodes = null, nodeLimit = 0, path = null) {\n    let head = initialHead;\n    let remaining = initialRemaining;\n    let count = initialCount;\n    let black = initialBlack;\n    let added = 0;\n    const progress = currentProgress();\n    const fail = () => {\n      if (path && added) path.splice(path.length - added, added);\n      return false;\n    };\n    while (true) {\n      if (checkCancelled()) return fail();\n      if (nodeLimit) {\n        nodes[0]++;\n        if (nodes[0] > nodeLimit) return fail();\n      }\n      progress?.add(1);\n      if (count <= 1) {\n        if (requiredEnd == null || head === requiredEnd) {\n          path?.push(head);\n          return true;\n        }\n        return fail();\n      }\n      if (requiredEnd != null && head === requiredEnd) return fail();\n      const white = count - black;\n      if (count & 1) {\n        if (colorOf(head) ? black !== white + 1 : white !== black + 1) return fail();\n      } else if (black !== white) return fail();\n      const open = remaining ^ bit(head);\n      const openCount = count - 1;\n      const openBlack = black - (colorOf(head) ? 1 : 0);\n      let neighbors = NEIGHBORS[head].filter((n) => Boolean(open & bit(n)));\n      if (!neighbors.length) return fail();\n      const isolated = neighbors.filter((n) => (NBR_MASK[n] & open) === 0n);\n      if (isolated.length) {\n        if (isolated.length > 1 || openCount !== 1) return fail();\n        neighbors = isolated;\n      }\n      if (neighbors.length === 1) {\n        if (path) {\n          path.push(head);\n          added++;\n        }\n        head = neighbors[0];\n        remaining = open;\n        count = openCount;\n        black = openBlack;\n        continue;\n      }\n      const degreeOne = [];\n      for (let bits = open; bits; ) {\n        const next = bits & -bits;\n        const i = lowestBitIndex(next);\n        const d = bitCount(NBR_MASK[i] & open);\n        if (d === 0) return fail();\n        if (d === 1 && degreeOne.push(i) > 2) return fail();\n        bits ^= next;\n      }\n      if (degreeOne.length === 2) {\n        const forced = new Set(degreeOne);\n        neighbors = neighbors.filter((n) => forced.has(n));\n        if (!neighbors.length) return fail();\n      }\n      const row = Math.floor(head / WIDTH);\n      neighbors.sort((a, b) => {\n        const degreeDiff = bitCount(NBR_MASK[a] & open) - bitCount(NBR_MASK[b] & open);\n        if (degreeDiff) return degreeDiff;\n        const aSnake = (row & 1) === 0 && a === head + 1 || row & 1 && a === head - 1 ? 0 : 1;\n        const bSnake = (row & 1) === 0 && b === head + 1 || row & 1 && b === head - 1 ? 0 : 1;\n        return aSnake - bSnake;\n      });\n      if (path) {\n        path.push(head);\n        added++;\n      }\n      for (const neighbor of neighbors) {\n        if (checkCancelled()) return fail();\n        if (reachableMask(neighbor, open) !== open) continue;\n        if (warnsdorffDfsJs(\n          neighbor,\n          open,\n          openCount,\n          openBlack,\n          requiredEnd,\n          nodes,\n          nodeLimit,\n          path\n        )) return true;\n      }\n      return fail();\n    }\n  }\n  function warnsdorffDfs(initialHead, initialRemaining, initialCount, initialBlack, requiredEnd = null, nodes = null, nodeLimit = 0, path = null) {\n    if (dfsWasmReady()) {\n      dfsWasmConfigure(WIDTH, HEIGHT);\n      dfsWasmSetCancelled(Boolean(cancelCheck && cancelCheck()));\n      const wantPath = path != null;\n      const result = dfsWasmRun(\n        initialHead,\n        initialRemaining,\n        initialCount,\n        initialBlack,\n        requiredEnd,\n        {\n          nodeLimit: nodeLimit || 0,\n          wantPath,\n          useMemo: false,\n          nodes: nodes || [0]\n        }\n      );\n      if (result === null) {\n      } else if (wantPath) {\n        if (Array.isArray(result)) {\n          for (const i of result) path.push(i);\n          return true;\n        }\n        return false;\n      } else {\n        return Boolean(result);\n      }\n    }\n    return warnsdorffDfsJs(\n      initialHead,\n      initialRemaining,\n      initialCount,\n      initialBlack,\n      requiredEnd,\n      nodes,\n      nodeLimit,\n      path\n    );\n  }\n  function pathStarts(free, nfree, degreeOne) {\n    if (degreeOne.length) return degreeOne.slice(0, 1);\n    const black = colorCount(free);\n    const white = nfree - black;\n    const starts = [];\n    for (let i = 0; i < N; i++) {\n      if (!(free & bit(i))) continue;\n      if (nfree & 1) {\n        if (colorOf(i) === (black > white ? 1 : 0)) starts.push(i);\n      } else if (colorOf(i)) starts.push(i);\n    }\n    starts.sort((a, b) => degree(a, free) - degree(b, free));\n    return starts;\n  }\n  function exhaustiveHamPath(grid, {\n    nodeLimit = 0,\n    budgets = null,\n    wantPath = false\n  } = {}) {\n    const free = freeMask(grid);\n    const nfree = bitCount(free);\n    if (nfree <= 1) {\n      const cells = [];\n      for (let i = 0; i < N; i++) if (free & bit(i)) cells.push(cellOf(i));\n      return wantPath ? cells : true;\n    }\n    const black = colorCount(free);\n    const degreeOne = [];\n    for (let i = 0; i < N; i++) {\n      if (free & bit(i) && degree(i, free) === 1) degreeOne.push(i);\n    }\n    const starts = pathStarts(free, nfree, degreeOne);\n    const requiredEnd = degreeOne.length === 2 ? degreeOne[1] : null;\n    const searchBudgets = budgets || (nodeLimit ? [nodeLimit] : [4e3, 16e3, 64e3, 0]);\n    for (const budget of searchBudgets) {\n      currentProgress()?.setPhase(`path DFS (${budget ? `${budget.toLocaleString()} node cap` : \"unlimited\"})`);\n      const nodes = budget ? [0] : null;\n      for (const start of starts) {\n        if (checkCancelled(true)) return wantPath ? null : false;\n        if (nodes) nodes[0] = 0;\n        const found = wantPath ? [] : null;\n        if (warnsdorffDfs(\n          start,\n          free,\n          nfree,\n          black,\n          requiredEnd,\n          nodes,\n          budget,\n          found\n        )) {\n          return wantPath ? found.map(cellOf) : true;\n        }\n      }\n    }\n    return wantPath ? null : false;\n  }\n  function inBounds(x, y) {\n    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;\n  }\n  var PathBoard = class _PathBoard {\n    static lastWin = null;\n    constructor(grid) {\n      this.w = grid.map((row) => row.map((cell) => cell === WALL ? WALL : 1));\n      this.s = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => [0, 0, 0, 0]));\n      this.nfree = grid.reduce((sum, row) => sum + row.reduce((n, cell) => n + (cell !== WALL ? 1 : 0), 0), 0);\n      this.ends = 0;\n      this.dead = false;\n      this.g = 0;\n      this.cancelled = false;\n    }\n    clone() {\n      const board = Object.create(_PathBoard.prototype);\n      board.w = this.w.map((row) => row.slice());\n      board.s = this.s.map((row) => row.map((cell) => cell.slice()));\n      board.nfree = this.nfree;\n      board.ends = this.ends;\n      board.dead = this.dead;\n      board.g = this.g;\n      board.cancelled = this.cancelled;\n      return board;\n    }\n    adj(x, y) {\n      const result = [0, 0, 0, 0];\n      for (let d = 0; d < 4; d++) {\n        const nx = x + DX[d];\n        const ny = y + DY[d];\n        if (!inBounds(nx, ny) || this.w[ny][nx] === WALL) result[d] = 1;\n        else if (this.w[ny][nx] === 3) result[d] = this.s[ny][nx][OPP[d]] ? 2 : 1;\n      }\n      return result;\n    }\n    place(x, y, dirs) {\n      this.w[y][x] = 3;\n      this.s[y][x] = [0, 0, 0, 0];\n      for (const d of dirs) this.s[y][x][d] = 1;\n      if (dirs.length === 1) this.ends++;\n    }\n    otherDir(x, y, came) {\n      let found = null;\n      for (let d = 0; d < 4; d++) {\n        if (this.s[y][x][d] && d !== came) {\n          if (found != null) return found;\n          found = d;\n        }\n      }\n      return found;\n    }\n    joinCycleLength(x, y, d1, d2) {\n      const n1x = x + DX[d1], n1y = y + DY[d1];\n      const n2x = x + DX[d2], n2y = y + DY[d2];\n      if (!inBounds(n1x, n1y) || !inBounds(n2x, n2y) || this.w[n1y][n1x] !== 3 || this.w[n2y][n2x] !== 3 || !this.s[n1y][n1x][OPP[d1]] || !this.s[n2y][n2x][OPP[d2]]) return 0;\n      let cx = n1x, cy = n1y, came = OPP[d1];\n      let length = 1;\n      for (let step = 0; step < this.nfree + 2; step++) {\n        const next = this.otherDir(cx, cy, came);\n        if (next == null) return 0;\n        const nx = cx + DX[next], ny = cy + DY[next];\n        length++;\n        if (nx === n2x && ny === n2y) return length + 1;\n        cx = nx;\n        cy = ny;\n        came = OPP[next];\n      }\n      return 0;\n    }\n    joinOk(x, y, dirs) {\n      if (dirs.length !== 2) return true;\n      const loop = this.joinCycleLength(x, y, dirs[0], dirs[1]);\n      if (!loop) return true;\n      return loop === this.nfree ? \"full\" : false;\n    }\n    force() {\n      while (!this.dead) {\n        if (checkCancelled()) {\n          this.cancelled = true;\n          return false;\n        }\n        let changed = false;\n        for (let y = 0; y < HEIGHT; y++) {\n          for (let x = 0; x < WIDTH; x++) {\n            if (this.w[y][x] !== 1) continue;\n            const adjacent = this.adj(x, y);\n            const blocked = adjacent.filter((v) => v === 1).length;\n            const headCount = adjacent.filter((v) => v === 2).length;\n            if (headCount >= 3 || blocked === 4) {\n              this.dead = true;\n              return false;\n            }\n            if (blocked === 3) {\n              if (this.ends >= 2) {\n                this.dead = true;\n                return false;\n              }\n              this.place(x, y, [adjacent.findIndex((v) => v !== 1)]);\n              changed = true;\n              continue;\n            }\n            const heads = [];\n            const opens = [];\n            for (let d = 0; d < 4; d++) {\n              if (adjacent[d] === 2) heads.push(d);\n              if (adjacent[d] !== 1) opens.push(d);\n            }\n            if (heads.length === 2) {\n              const ok = this.joinOk(x, y, heads);\n              if (ok === \"full\") {\n                this.place(x, y, heads);\n                return this.win();\n              }\n              if (ok) {\n                this.place(x, y, heads);\n                changed = true;\n                continue;\n              }\n              if (blocked === 2) {\n                this.dead = true;\n                return false;\n              }\n            }\n            if (this.ends >= 2 && blocked === 2) {\n              const ok = this.joinOk(x, y, opens);\n              if (ok === \"full\") {\n                this.place(x, y, opens);\n                return this.win();\n              }\n              if (!ok) {\n                this.dead = true;\n                return false;\n              }\n              this.place(x, y, opens);\n              changed = true;\n            }\n          }\n        }\n        if (!changed) break;\n      }\n      return false;\n    }\n    walkFromEnd(x, y) {\n      const d = this.s[y][x].findIndex(Boolean);\n      const seen = /* @__PURE__ */ new Set([`${x},${y}`]);\n      let came = OPP[d], cx = x + DX[d], cy = y + DY[d];\n      for (let step = 0; step < this.nfree + 2; step++) {\n        const key = `${cx},${cy}`;\n        if (!inBounds(cx, cy) || this.w[cy][cx] !== 3 || seen.has(key)) return 0;\n        seen.add(key);\n        const next = this.otherDir(cx, cy, came);\n        if (next == null) return seen.size;\n        cx += DX[next];\n        cy += DY[next];\n        came = OPP[next];\n      }\n      return 0;\n    }\n    isCover() {\n      const ends = [];\n      let snakes = 0;\n      for (let y2 = 0; y2 < HEIGHT; y2++) {\n        for (let x2 = 0; x2 < WIDTH; x2++) {\n          if (this.w[y2][x2] === 1) return false;\n          if (this.w[y2][x2] !== 3) continue;\n          snakes++;\n          const d = this.s[y2][x2].reduce((a, b) => a + b, 0);\n          if (d === 1) ends.push([x2, y2]);\n          else if (d !== 2) return false;\n        }\n      }\n      if (snakes !== this.nfree) return false;\n      if (ends.length === 2) return this.walkFromEnd(...ends[0]) === this.nfree;\n      if (ends.length !== 0 || !snakes) return false;\n      const start = this.firstSnake();\n      if (!start) return false;\n      const [x, y] = start;\n      const dirs = this.s[y][x].map((v, d) => v ? d : -1).filter((d) => d >= 0);\n      const seen = /* @__PURE__ */ new Set([`${x},${y}`]);\n      let cx = x + DX[dirs[0]], cy = y + DY[dirs[0]], came = OPP[dirs[0]];\n      for (let step = 0; step < this.nfree + 2; step++) {\n        if (!inBounds(cx, cy) || this.w[cy][cx] !== 3) return false;\n        const key = `${cx},${cy}`;\n        if (seen.has(key)) return false;\n        seen.add(key);\n        const next = this.otherDir(cx, cy, came);\n        if (next == null) return false;\n        const nx = cx + DX[next], ny = cy + DY[next];\n        if (nx === x && ny === y) return seen.size === this.nfree;\n        cx = nx;\n        cy = ny;\n        came = OPP[next];\n      }\n      return false;\n    }\n    firstSnake() {\n      for (let y = 0; y < HEIGHT; y++) {\n        for (let x = 0; x < WIDTH; x++) if (this.w[y][x] === 3) return [x, y];\n      }\n      return null;\n    }\n    pickEmpty() {\n      let best = null, bestOpen = 5;\n      for (let y = 0; y < HEIGHT; y++) {\n        for (let x = 0; x < WIDTH; x++) {\n          if (this.w[y][x] !== 1) continue;\n          const open = 4 - this.adj(x, y).filter((v) => v === 1).length;\n          if (open < bestOpen) {\n            bestOpen = open;\n            best = [x, y];\n            if (open <= 2) return best;\n          }\n        }\n      }\n      return best;\n    }\n    guesses(x, y, allowNewEnds = false) {\n      const adjacent = this.adj(x, y);\n      const opens = [0, 1, 2, 3].filter((d) => adjacent[d] !== 1);\n      const out = [];\n      for (let i = 0; i < opens.length; i++) {\n        for (let j = i + 1; j < opens.length; j++) out.push([opens[i], opens[j]]);\n      }\n      if (allowNewEnds && this.ends < 2) for (const d of opens) out.push([d]);\n      return out;\n    }\n    pathCells() {\n      if (!this.isCover()) return null;\n      const ends = [];\n      for (let y = 0; y < HEIGHT; y++) {\n        for (let x = 0; x < WIDTH; x++) {\n          if (this.w[y][x] === 3 && this.s[y][x].reduce((a, b) => a + b, 0) === 1) {\n            ends.push([x, y]);\n          }\n        }\n      }\n      let start;\n      let d;\n      let cycle = false;\n      if (ends.length === 2) {\n        start = ends[0];\n        d = this.s[start[1]][start[0]].findIndex(Boolean);\n      } else {\n        start = this.firstSnake();\n        if (!start) return null;\n        d = this.s[start[1]][start[0]].findIndex(Boolean);\n        cycle = true;\n      }\n      const [sx, sy] = start;\n      const cells = [[sy, sx]];\n      let cx = sx + DX[d], cy = sy + DY[d], came = OPP[d];\n      for (let step = 0; step < this.nfree; step++) {\n        if (cycle && cx === sx && cy === sy) return cells.length === this.nfree ? cells : null;\n        if (!inBounds(cx, cy)) return null;\n        cells.push([cy, cx]);\n        const next = this.otherDir(cx, cy, came);\n        if (next == null) return !cycle && cells.length === this.nfree ? cells : null;\n        cx += DX[next];\n        cy += DY[next];\n        came = OPP[next];\n      }\n      return null;\n    }\n    win() {\n      _PathBoard.lastWin = this;\n      return true;\n    }\n    originalDeg2() {\n      const cells = [];\n      for (let y = 0; y < HEIGHT; y++) {\n        for (let x = 0; x < WIDTH; x++) {\n          if (this.w[y][x] === 1 && this.adj(x, y).filter((v) => v === 1).length === 2) {\n            cells.push([x, y]);\n          }\n        }\n      }\n      return cells;\n    }\n    placeThrough(x, y) {\n      if (this.w[y][x] !== 1) return true;\n      const adjacent = this.adj(x, y);\n      const opens = [0, 1, 2, 3].filter((d) => adjacent[d] !== 1);\n      if (opens.length !== 2) return true;\n      const ok = this.joinOk(x, y, opens);\n      if (ok === \"full\") {\n        this.place(x, y, opens);\n        return \"full\";\n      }\n      if (!ok) {\n        this.dead = true;\n        return false;\n      }\n      this.place(x, y, opens);\n      return true;\n    }\n    guessRest(allowNewEnds = false) {\n      this.g++;\n      currentProgress()?.tick();\n      if (checkCancelled()) {\n        this.cancelled = true;\n        return false;\n      }\n      if (this.force()) return true;\n      if (this.dead || this.cancelled) return false;\n      if (this.isCover()) return this.win();\n      const cell = this.pickEmpty();\n      if (!cell) return false;\n      const [x, y] = cell;\n      for (const piece of this.guesses(x, y, allowNewEnds)) {\n        if (checkCancelled()) {\n          this.cancelled = true;\n          return false;\n        }\n        const next = this.clone();\n        if (piece.length === 1 && next.ends >= 2) continue;\n        if (piece.length === 2) {\n          const ok = next.joinOk(x, y, piece);\n          if (ok === \"full\") {\n            next.place(x, y, piece);\n            return next.win();\n          }\n          if (!ok) continue;\n        }\n        next.place(x, y, piece);\n        if (next.guessRest(allowNewEnds)) return true;\n        if (next.cancelled) {\n          this.cancelled = true;\n          return false;\n        }\n      }\n      return false;\n    }\n    dirsOf([x, y]) {\n      const adjacent = this.adj(x, y);\n      return [0, 1, 2, 3].filter((d) => adjacent[d] !== 1);\n    }\n    legalEndCells() {\n      const empties = [];\n      for (let y = 0; y < HEIGHT; y++) {\n        for (let x = 0; x < WIDTH; x++) if (this.w[y][x] === 1) empties.push([x, y]);\n      }\n      empties.sort((a, b) => this.adj(a[0], a[1]).filter((v) => v !== 1).length - this.adj(b[0], b[1]).filter((v) => v !== 1).length);\n      if (this.nfree & 1) {\n        let black = 0;\n        for (let y = 0; y < HEIGHT; y++) {\n          for (let x = 0; x < WIDTH; x++) {\n            if (this.w[y][x] !== WALL && x + y & 1) black++;\n          }\n        }\n        const majority = black > this.nfree - black ? 1 : 0;\n        return [empties.filter(([x, y]) => (x + y & 1) === majority), null];\n      }\n      return [\n        empties.filter(([x, y]) => x + y & 1),\n        empties.filter(([x, y]) => !(x + y & 1))\n      ];\n    }\n    tryEndPair(a, b) {\n      if (a[0] === b[0] && a[1] === b[1]) return false;\n      for (const da of this.dirsOf(a)) {\n        for (const db of this.dirsOf(b)) {\n          if (checkCancelled()) {\n            this.cancelled = true;\n            return false;\n          }\n          const board = this.clone();\n          board.g = 0;\n          if (board.w[a[1]][a[0]] !== 1 || board.w[b[1]][b[0]] !== 1) continue;\n          board.place(a[0], a[1], [da]);\n          board.place(b[0], b[1], [db]);\n          if (board.guessRest(false)) return true;\n          if (board.cancelled) {\n            this.cancelled = true;\n            return false;\n          }\n        }\n      }\n      return false;\n    }\n    solveRemainingEnds() {\n      if (this.force()) return true;\n      if (this.dead || this.cancelled) return false;\n      if (this.isCover()) return this.win();\n      const need = 2 - this.ends;\n      if (need <= 0) return this.guessRest(false);\n      const [groupA, groupB] = this.legalEndCells();\n      if (need === 1) {\n        let already = null;\n        for (let y = 0; y < HEIGHT && !already; y++) {\n          for (let x = 0; x < WIDTH; x++) {\n            if (this.w[y][x] === 3 && this.s[y][x].reduce((a, b) => a + b, 0) === 1) {\n              already = [x, y];\n              break;\n            }\n          }\n        }\n        const placedColor = already ? already[0] + already[1] & 1 : null;\n        const candidates = groupB == null ? groupA : placedColor === 1 ? groupB : groupA;\n        for (const p of candidates) {\n          for (const d of this.dirsOf(p)) {\n            const board = this.clone();\n            if (board.w[p[1]][p[0]] !== 1) continue;\n            board.place(p[0], p[1], [d]);\n            if (board.guessRest(false)) return true;\n            if (board.cancelled) {\n              this.cancelled = true;\n              return false;\n            }\n          }\n        }\n        return false;\n      }\n      if (groupB == null) {\n        for (let i = 0; i < groupA.length; i++) {\n          for (let j = i + 1; j < groupA.length; j++) {\n            if (this.tryEndPair(groupA[i], groupA[j])) return true;\n            if (this.cancelled) return false;\n          }\n        }\n        return false;\n      }\n      for (const a of groupA) {\n        for (const b of groupB) {\n          if (this.tryEndPair(a, b)) return true;\n          if (this.cancelled) return false;\n        }\n      }\n      return false;\n    }\n    tryDeg2Exceptions(deg2, exceptions, endDirs) {\n      const board = this.clone();\n      const exceptionKeys = new Set(exceptions.map(([x, y]) => `${x},${y}`));\n      for (let i = 0; i < exceptions.length; i++) {\n        const [x, y] = exceptions[i];\n        const d = endDirs[i];\n        if (board.w[y][x] !== 1 || board.adj(x, y)[d] === 1) return false;\n        board.place(x, y, [d]);\n      }\n      for (const [x, y] of deg2) {\n        if (exceptionKeys.has(`${x},${y}`)) continue;\n        const result = board.placeThrough(x, y);\n        if (result === \"full\") return board.win();\n        if (!result) return false;\n      }\n      const ok = board.ends >= 2 ? board.guessRest(false) : board.solveRemainingEnds();\n      if (board.cancelled) this.cancelled = true;\n      return ok;\n    }\n    solve() {\n      _PathBoard.lastWin = null;\n      if (this.force()) return true;\n      if (this.dead || this.cancelled) return false;\n      if (this.isCover()) return this.win();\n      const allDeg2 = this.originalDeg2();\n      if (this.ends >= 2) return this.guessRest(false);\n      const cellColor = ([x, y]) => x + y & 1;\n      let majority = null;\n      let candidates = allDeg2;\n      if (this.nfree & 1) {\n        let black = 0;\n        for (let y = 0; y < HEIGHT; y++) {\n          for (let x = 0; x < WIDTH; x++) {\n            if (this.w[y][x] !== WALL && x + y & 1) black++;\n          }\n        }\n        majority = black > this.nfree - black ? 1 : 0;\n        candidates = allDeg2.filter((cell) => cellColor(cell) === majority);\n      }\n      const need = 2 - this.ends;\n      for (let k = 0; k <= need; k++) {\n        if (checkCancelled(true)) {\n          this.cancelled = true;\n          return false;\n        }\n        if (k === 0) {\n          if (this.tryDeg2Exceptions(allDeg2, [], [])) return true;\n        } else if (k === 1) {\n          for (const cell of candidates) {\n            for (const d of this.dirsOf(cell)) {\n              if (this.tryDeg2Exceptions(allDeg2, [cell], [d])) return true;\n              if (this.cancelled) return false;\n            }\n          }\n        } else {\n          for (let i = 0; i < candidates.length; i++) {\n            for (let j = i + 1; j < candidates.length; j++) {\n              const a = candidates[i], b = candidates[j];\n              if (majority == null && cellColor(a) === cellColor(b)) continue;\n              for (const da of this.dirsOf(a)) {\n                for (const db of this.dirsOf(b)) {\n                  if (this.tryDeg2Exceptions(allDeg2, [a, b], [da, db])) return true;\n                  if (this.cancelled) return false;\n                }\n              }\n            }\n          }\n        }\n      }\n      return false;\n    }\n  };\n  function warnsdorffTour(grid, nodeLimit = 12e3) {\n    const free = freeMask(grid);\n    const nfree = bitCount(free);\n    if (nfree <= 1) {\n      for (let i = 0; i < N; i++) if (free & bit(i)) return [cellOf(i)];\n      return [];\n    }\n    const degreeOne = [];\n    for (let i = 0; i < N; i++) {\n      if (free & bit(i) && degree(i, free) === 1) degreeOne.push(i);\n    }\n    if (degreeOne.length > 2) return null;\n    let starts = degreeOne.length ? degreeOne : Array.from({ length: N }, (_, i) => i).filter((i) => free & bit(i) && degree(i, free) === 2);\n    if (!starts.length) starts = Array.from({ length: N }, (_, i) => i).filter((i) => free & bit(i));\n    let nodes = 0;\n    let path = [];\n    const dfs = (head, remaining) => {\n      if (checkCancelled()) return false;\n      if (++nodes > nodeLimit) return false;\n      currentProgress()?.add(1);\n      path.push(head);\n      if (bitCount(remaining) <= 1) return true;\n      const open = remaining & ~bit(head);\n      const neighbors = NEIGHBORS[head].filter((n) => open & bit(n));\n      if (!neighbors.length) {\n        path.pop();\n        return false;\n      }\n      const row = Math.floor(head / WIDTH);\n      neighbors.sort((a, b) => {\n        const d = degree(a, open) - degree(b, open);\n        if (d) return d;\n        const sa = (row & 1) === 0 && a === head + 1 || row & 1 && a === head - 1 ? 0 : 1;\n        const sb = (row & 1) === 0 && b === head + 1 || row & 1 && b === head - 1 ? 0 : 1;\n        return sa - sb;\n      });\n      for (const next of neighbors) if (dfs(next, open)) return true;\n      path.pop();\n      return false;\n    };\n    for (const start of starts.slice(0, 6)) {\n      path = [];\n      nodes = 0;\n      if (dfs(start, free) && path.length === nfree) return path.map(cellOf);\n      if (checkCancelled(true)) return null;\n    }\n    return null;\n  }\n  function findHamiltonianPath(grid) {\n    validateGrid(grid);\n    if (!coloringAllowsPath(grid) || !pathColoringReport(grid).path_possible) return null;\n    if (checkCancelled(true)) return null;\n    const nfree = grid.flat().filter((cell) => cell !== WALL).length;\n    if (nfree <= 1) {\n      for (let r = 0; r < HEIGHT; r++) {\n        for (let c = 0; c < WIDTH; c++) if (grid[r][c] !== WALL) return [[r, c]];\n      }\n      return [];\n    }\n    currentProgress()?.setPhase(\"path Warnsdorff tour\");\n    const tour = warnsdorffTour(grid);\n    if (tour && verifyPath(grid, tour)) return tour;\n    if (checkCancelled(true)) return null;\n    const found = exhaustiveHamPath(grid, {\n      wantPath: true,\n      budgets: [4e3, 16e3, 0]\n    });\n    if (found && verifyPath(grid, found)) return found;\n    if (checkCancelled(true)) return null;\n    currentProgress()?.setPhase(\"path forced-fill search\");\n    const board = new PathBoard(grid);\n    if (board.solve() && PathBoard.lastWin) {\n      const cells = PathBoard.lastWin.pathCells();\n      if (cells && verifyPath(grid, cells)) return cells;\n    }\n    return null;\n  }\n  function pathEndGap(tour, isCycle = false) {\n    if (!tour || !tour.length) return null;\n    if (isCycle) return 1;\n    if (tour.length <= 1) return 0;\n    const a = tour[0], b = tour[tour.length - 1];\n    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);\n  }\n  function minPathEndGap(nfree, cyclePossible = false) {\n    if (nfree <= 1) return 0;\n    if (nfree === 2) return 1;\n    if (nfree & 1) return 2;\n    return cyclePossible ? 1 : 3;\n  }\n  function cellManhattan(a, b) {\n    const [r1, c1] = cellOf(a);\n    const [r2, c2] = cellOf(b);\n    return Math.abs(r1 - r2) + Math.abs(c1 - c2);\n  }\n  function pathBetween(grid, start, end, nodeLimit) {\n    const free = freeMask(grid);\n    const nfree = bitCount(free);\n    if (!(free & bit(start)) || !(free & bit(end))) return null;\n    if (start === end) return nfree === 1 ? [cellOf(start)] : null;\n    const path = [];\n    const nodes = nodeLimit ? [0] : null;\n    if (warnsdorffDfs(\n      start,\n      free,\n      nfree,\n      colorCount(free),\n      end,\n      nodes,\n      nodeLimit,\n      path\n    )) {\n      const tour = path.map(cellOf);\n      return verifyPath(grid, tour) ? tour : null;\n    }\n    return null;\n  }\n  function posaFromTail(path) {\n    const positions = new Map(path.map((value, i) => [value, i]));\n    const tail = path[path.length - 1];\n    const out = [];\n    for (const neighbor of NEIGHBORS[tail]) {\n      const i = positions.get(neighbor);\n      if (i == null || i >= path.length - 2) continue;\n      out.push(path.slice(0, i + 1).concat(path.slice(i + 1).reverse()));\n    }\n    return out;\n  }\n  function rotationImprove(tour, minDistance, onBetter) {\n    if (!tour || tour.length <= 2) {\n      const distance = pathEndGap(tour);\n      return [tour, distance, distance != null && distance <= minDistance];\n    }\n    const start = tour.map(([r, c]) => idx(r, c));\n    let bestPath = start;\n    let bestDistance = cellManhattan(start[0], start[start.length - 1]);\n    if (bestDistance <= minDistance) return [tour, bestDistance, true];\n    const endpointKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;\n    const seen = /* @__PURE__ */ new Set([endpointKey(start[0], start[start.length - 1])]);\n    const queue = [start];\n    let queueIndex = 0;\n    currentProgress()?.setPhase(`rotate endpoints (gap ${bestDistance}, best ${minDistance})`);\n    let steps = 0;\n    while (queueIndex < queue.length) {\n      if (checkCancelled()) break;\n      if (++steps % 256 === 0) currentProgress()?.add(256);\n      const current = queue[queueIndex++];\n      for (const base of [current, current.slice().reverse()]) {\n        for (const next of posaFromTail(base)) {\n          const a = next[0], b = next[next.length - 1];\n          const key = endpointKey(a, b);\n          if (seen.has(key)) continue;\n          seen.add(key);\n          const distance = cellManhattan(a, b);\n          if (distance < bestDistance) {\n            bestDistance = distance;\n            bestPath = next;\n            const cells = next.map(cellOf);\n            onBetter?.(cells, bestDistance, bestDistance <= minDistance);\n            currentProgress()?.setPhase(`rotate endpoints (gap ${bestDistance}, best ${minDistance})`);\n            if (bestDistance <= minDistance) return [cells, bestDistance, true];\n          }\n          queue.push(next);\n        }\n      }\n    }\n    return [bestPath.map(cellOf), bestDistance, bestDistance <= minDistance];\n  }\n  function pathboardBetween(grid, start, end) {\n    const [ra, ca] = cellOf(start);\n    const [rb, cb] = cellOf(end);\n    const board = new PathBoard(grid);\n    if (board.tryEndPair([ca, ra], [cb, rb]) && PathBoard.lastWin) {\n      const cells = PathBoard.lastWin.pathCells();\n      if (cells && verifyPath(grid, cells)) return cells;\n    }\n    return null;\n  }\n  function improvePathEndpoints(grid, initialTour, {\n    onBetter = null,\n    cyclePossible = false\n  } = {}) {\n    validateGrid(grid);\n    if (!initialTour || !initialTour.length) return [null, null, false];\n    let tour = initialTour.map((cell) => cell.slice());\n    const nfree = tour.length;\n    let bestDistance = pathEndGap(tour);\n    const minDistance = minPathEndGap(nfree, cyclePossible);\n    if (bestDistance == null) return [tour, null, false];\n    if (nfree <= 2 || bestDistance <= minDistance) return [tour, bestDistance, true];\n    const free = freeMask(grid);\n    const degreeOne = [];\n    for (let i = 0; i < N; i++) {\n      if (free & bit(i) && degree(i, free) === 1) degreeOne.push(i);\n    }\n    if (degreeOne.length === 2) return [tour, bestDistance, true];\n    [tour, bestDistance] = rotationImprove(tour, minDistance, onBetter);\n    if (bestDistance <= minDistance) return [tour, bestDistance, true];\n    if (checkCancelled(true)) return [tour, bestDistance, false];\n    const cells = [];\n    for (let i = 0; i < N; i++) if (free & bit(i)) cells.push(i);\n    const black = cells.filter((i) => colorOf(i)).length;\n    const white = cells.length - black;\n    const pairOk = (a, b) => {\n      if (a === b) return false;\n      const same = colorOf(a) === colorOf(b);\n      if (nfree & 1) {\n        if (!same || colorOf(a) !== (black > white ? 1 : 0)) return false;\n      } else if (same) return false;\n      return degreeOne.length !== 1 || a === degreeOne[0] || b === degreeOne[0];\n    };\n    const byDistance = /* @__PURE__ */ new Map();\n    for (let i = 0; i < cells.length; i++) {\n      for (let j = i + 1; j < cells.length; j++) {\n        const a = cells[i], b = cells[j];\n        const distance = cellManhattan(a, b);\n        if (distance < minDistance || distance >= bestDistance || !pairOk(a, b)) continue;\n        if (!byDistance.has(distance)) byDistance.set(distance, []);\n        byDistance.get(distance).push([a, b]);\n      }\n    }\n    for (const pairs of byDistance.values()) {\n      pairs.sort((a, b) => degree(a[0], free) + degree(a[1], free) - degree(b[0], free) - degree(b[1], free));\n    }\n    const tryGap = (distance) => {\n      const pairs = byDistance.get(distance) || [];\n      if (!pairs.length) return \"impossible\";\n      let leftover = [];\n      currentProgress()?.setPhase(`closest ends gap ${distance} (forced fill, ${pairs.length} pairs)`);\n      if (minDistance >= 3) {\n        leftover = pairs.slice();\n      } else {\n        for (const [a, b] of pairs) {\n          if (checkCancelled()) return \"cancelled\";\n          const candidate = pathboardBetween(grid, a, b);\n          if (candidate) {\n            tour = candidate;\n            bestDistance = distance;\n            onBetter?.(tour, bestDistance, bestDistance <= minDistance);\n            return \"found\";\n          }\n          leftover.push([a, b]);\n        }\n      }\n      const budgets = minDistance >= 3 ? [0] : leftover.length < 80 ? [4e3, 16e3, 64e3, 25e4, 0] : [16e3, 64e3, 25e4, 0];\n      for (const nodeLimit of budgets) {\n        if (!leftover.length) break;\n        currentProgress()?.setPhase(\n          `closest ends gap ${distance} (${nodeLimit ? `${nodeLimit.toLocaleString()} cap` : \"unlimited\"}, ${leftover.length} pairs)`\n        );\n        const still = [];\n        for (const [a, b] of leftover) {\n          if (checkCancelled()) return \"cancelled\";\n          let attempted = false;\n          for (const [start, end] of [[a, b], [b, a]]) {\n            if (degreeOne.length === 1 && start !== degreeOne[0]) continue;\n            const candidate = pathBetween(grid, start, end, nodeLimit);\n            attempted = true;\n            if (candidate) {\n              tour = candidate;\n              bestDistance = distance;\n              onBetter?.(tour, bestDistance, bestDistance <= minDistance);\n              return \"found\";\n            }\n          }\n          if (nodeLimit || attempted) still.push([a, b]);\n        }\n        leftover = nodeLimit ? still : [];\n      }\n      return leftover.length ? \"inconclusive\" : \"impossible\";\n    };\n    let inconclusive = false;\n    for (let distance = bestDistance - 1; distance >= minDistance; distance--) {\n      if (checkCancelled()) return [tour, bestDistance, false];\n      if (distance >= bestDistance) continue;\n      const status = tryGap(distance);\n      if (status === \"found\") {\n        inconclusive = false;\n        if (bestDistance <= minDistance) return [tour, bestDistance, true];\n        for (const key of [...byDistance.keys()]) if (key >= bestDistance) byDistance.delete(key);\n      } else if (status === \"cancelled\") {\n        return [tour, bestDistance, false];\n      } else if (status === \"inconclusive\" && distance < bestDistance) {\n        inconclusive = true;\n      }\n    }\n    return [tour, bestDistance, bestDistance <= minDistance || !inconclusive];\n  }\n  function tourFromSnakemap(wmap, smap) {\n    const height = wmap.length;\n    const width = height ? wmap[0].length : 0;\n    const nfree = wmap.reduce((sum, row) => sum + row.reduce((n, cell) => n + (cell !== WALL ? 1 : 0), 0), 0);\n    if (nfree <= 0) return [];\n    if (nfree === 1) {\n      for (let y2 = 0; y2 < height; y2++) {\n        for (let x2 = 0; x2 < width; x2++) if (wmap[y2][x2] !== WALL) return [[y2, x2]];\n      }\n    }\n    const otherDir = (x2, y2, came2) => {\n      let found = null;\n      for (let d = 0; d < 4; d++) if (smap[y2][x2][d] && d !== came2) found = d;\n      return found;\n    };\n    const ends = [];\n    let anySnake = null;\n    for (let y2 = 0; y2 < height; y2++) {\n      for (let x2 = 0; x2 < width; x2++) {\n        const d = smap[y2][x2].reduce((a, b) => a + b, 0);\n        if (!d) continue;\n        anySnake ||= [x2, y2];\n        if (d === 1) ends.push([x2, y2]);\n      }\n    }\n    if (ends.length) {\n      const [x2, y2] = ends[0];\n      const d = smap[y2][x2].findIndex(Boolean);\n      const cells2 = [[y2, x2]];\n      let cx2 = x2 + DX[d], cy2 = y2 + DY[d], came2 = OPP[d];\n      for (let step = 0; step < nfree - 1; step++) {\n        if (cx2 < 0 || cx2 >= width || cy2 < 0 || cy2 >= height) return null;\n        cells2.push([cy2, cx2]);\n        const next = otherDir(cx2, cy2, came2);\n        if (next == null) return cells2.length === nfree ? cells2 : null;\n        cx2 += DX[next];\n        cy2 += DY[next];\n        came2 = OPP[next];\n      }\n      return cells2.length === nfree ? cells2 : null;\n    }\n    if (!anySnake) return null;\n    const [x, y] = anySnake;\n    const dirs = smap[y][x].map((v, d) => v ? d : -1).filter((d) => d >= 0);\n    if (dirs.length !== 2) return null;\n    const cells = [[y, x]];\n    let cx = x + DX[dirs[0]], cy = y + DY[dirs[0]], came = OPP[dirs[0]];\n    for (let step = 0; step < nfree; step++) {\n      if (cx === x && cy === y) return cells.length === nfree ? cells : null;\n      if (cx < 0 || cx >= width || cy < 0 || cy >= height) return null;\n      cells.push([cy, cx]);\n      const next = otherDir(cx, cy, came);\n      if (next == null) return null;\n      cx += DX[next];\n      cy += DY[next];\n      came = OPP[next];\n    }\n    return cells.length === nfree ? cells : null;\n  }\n  function verifyPath(grid, cells) {\n    if (!cells || !cells.length) return false;\n    const open = /* @__PURE__ */ new Set();\n    for (let r = 0; r < grid.length; r++) {\n      for (let c = 0; c < grid[r].length; c++) {\n        if (grid[r][c] !== WALL) open.add(`${r},${c}`);\n      }\n    }\n    const visited = new Set(cells.map(([r, c]) => `${r},${c}`));\n    if (cells.length !== open.size || visited.size !== open.size) return false;\n    for (const cell of visited) if (!open.has(cell)) return false;\n    for (let i = 1; i < cells.length; i++) {\n      const [r1, c1] = cells[i - 1];\n      const [r2, c2] = cells[i];\n      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;\n    }\n    return true;\n  }\n\n  // js/wall.js\n  function newBlank(width, height) {\n    const b = Array.from({ length: height }, () => Array(width).fill(0));\n    b[0][1] = 1;\n    b[0][width - 2] = 1;\n    b[1][0] = 1;\n    b[1][width - 1] = 1;\n    b[height - 2][0] = 1;\n    b[height - 2][width - 1] = 1;\n    b[height - 1][1] = 1;\n    b[height - 1][width - 2] = 1;\n    return b;\n  }\n  function generateEligible(b) {\n    const lx = b[0].length;\n    const ly = b.length;\n    const elig = [];\n    for (let i = 0; i < lx; i++) {\n      for (let j = 0; j < ly; j++) {\n        if (b[j][i] === 0) elig.push([i, j]);\n      }\n    }\n    return elig;\n  }\n  function newWall(b) {\n    const lx = b[0].length;\n    const ly = b.length;\n    const elig = generateEligible(b);\n    if (!elig.length) return false;\n    const [x, y] = elig[Math.random() * elig.length | 0];\n    b[y][x] = 2;\n    if (y !== 0) {\n      b[y - 1][x] = 1;\n      if (x !== 0) b[y - 1][x - 1] = 1;\n      if (x !== lx - 1) b[y - 1][x + 1] = 1;\n    }\n    if (y !== ly - 1) {\n      b[y + 1][x] = 1;\n      if (x !== 0) b[y + 1][x - 1] = 1;\n      if (x !== lx - 1) b[y + 1][x + 1] = 1;\n    }\n    if (x !== 0) b[y][x - 1] = 1;\n    if (x !== lx - 1) b[y][x + 1] = 1;\n    if (y === 0 || y === ly - 1) {\n      if (x < lx - 2) b[y][x + 2] = 1;\n      if (x > 1) b[y][x - 2] = 1;\n    }\n    if (x === 0 || x === lx - 1) {\n      if (y < ly - 2) b[y + 2][x] = 1;\n      if (y > 1) b[y - 2][x] = 1;\n    }\n    if (y === 0 && x === 2) b[2][0] = 1;\n    if (y === 0 && x === lx - 3) b[2][lx - 1] = 1;\n    if (y === 2 && x === 0) b[0][2] = 1;\n    if (y === 2 && x === lx - 1) b[0][lx - 3] = 1;\n    if (y === ly - 1 && x === 2) b[ly - 3][0] = 1;\n    if (y === ly - 1 && x === lx - 3) b[ly - 3][lx - 1] = 1;\n    if (y === ly - 3 && x === 0) b[ly - 1][2] = 1;\n    if (y === ly - 3 && x === lx - 1) b[ly - 1][lx - 3] = 1;\n    return true;\n  }\n  function newPattern(width, height) {\n    const b = newBlank(width, height);\n    while (newWall(b)) ;\n    return b;\n  }\n  function bitsToWallMap(bits, width, height) {\n    const b = [];\n    for (let y = 0; y < height; y++) {\n      const row = [];\n      for (let x = 0; x < width; x++) {\n        row.push(bits[y * width + x] === \"1\" ? 2 : 1);\n      }\n      b.push(row);\n    }\n    return b;\n  }\n  function darkLightCheck(b) {\n    let dark = 0;\n    let light = 0;\n    for (let j = 0; j < b.length; j++) {\n      for (let i = 0; i < b[0].length; i++) {\n        if (b[j][i] !== 2) {\n          if ((i + j) % 2 === 0) light++;\n          else dark++;\n        }\n      }\n    }\n    return dark === light;\n  }\n  function new4map(x, y) {\n    const m = newBlank(x, y);\n    for (let i = 0; i < x; i++) {\n      for (let j = 0; j < y; j++) {\n        m[j][i] = [0, 0, 0, 0];\n      }\n    }\n    return m;\n  }\n  function adjCheck(wmap, smap, x, y) {\n    const lx = wmap[0].length;\n    const ly = wmap.length;\n    const adj = [0, 0, 0, 0];\n    if (y === 0) adj[0] = 1;\n    else if (wmap[y - 1][x] >= 2) {\n      adj[0] = 1;\n      if (wmap[y - 1][x] === 3 && smap[y - 1][x][1] === 1) adj[0] = 2;\n    }\n    if (y === ly - 1) adj[1] = 1;\n    else if (wmap[y + 1][x] >= 2) {\n      adj[1] = 1;\n      if (wmap[y + 1][x] === 3 && smap[y + 1][x][0] === 1) adj[1] = 2;\n    }\n    if (x === 0) adj[2] = 1;\n    else if (wmap[y][x - 1] >= 2) {\n      adj[2] = 1;\n      if (wmap[y][x - 1] === 3 && smap[y][x - 1][3] === 1) adj[2] = 2;\n    }\n    if (x === lx - 1) adj[3] = 1;\n    else if (wmap[y][x + 1] >= 2) {\n      adj[3] = 1;\n      if (wmap[y][x + 1] === 3 && smap[y][x + 1][2] === 1) adj[3] = 2;\n    }\n    return adj;\n  }\n  function newAdjmap(wmap, smap) {\n    const lx = wmap[0].length;\n    const ly = wmap.length;\n    const adjmap = new4map(lx, ly);\n    for (let i = 0; i < lx; i++) {\n      for (let j = 0; j < ly; j++) {\n        if (wmap[j][i] === 1) adjmap[j][i] = adjCheck(wmap, smap, i, j);\n      }\n    }\n    return adjmap;\n  }\n  function cycleCheck(smap, x, y) {\n    let d = smap[y][x].indexOf(1);\n    const x0 = x;\n    const y0 = y;\n    let n = 0;\n    const maxN = smap.length * smap[0].length;\n    while (true) {\n      n++;\n      if (d === 0) {\n        y -= 1;\n        if (smap[y][x].reduce((a, b) => a + b, 0) === 2) {\n          const a = smap[y][x].slice();\n          a[1] = 0;\n          d = a.indexOf(1);\n        } else return false;\n      } else if (d === 1) {\n        y += 1;\n        if (smap[y][x].reduce((a, b) => a + b, 0) === 2) {\n          const a = smap[y][x].slice();\n          a[0] = 0;\n          d = a.indexOf(1);\n        } else return false;\n      } else if (d === 2) {\n        x -= 1;\n        if (smap[y][x].reduce((a, b) => a + b, 0) === 2) {\n          const a = smap[y][x].slice();\n          a[3] = 0;\n          d = a.indexOf(1);\n        } else return false;\n      } else if (d === 3) {\n        x += 1;\n        if (smap[y][x].reduce((a, b) => a + b, 0) === 2) {\n          const a = smap[y][x].slice();\n          a[2] = 0;\n          d = a.indexOf(1);\n        } else return false;\n      }\n      if (x === x0 && y === y0) return n;\n      if (n > maxN) return false;\n    }\n  }\n  function countOf(arr, v) {\n    let n = 0;\n    for (const x of arr) if (x === v) n++;\n    return n;\n  }\n  function snakeFillStep(wmap, adjmap, smap, max, pairing = true, cycleblock = true) {\n    const lx = wmap[0].length;\n    const ly = wmap.length;\n    let ham = true;\n    for (let i = 0; i < lx; i++) {\n      for (let j = 0; j < ly; j++) {\n        if (wmap[j][i] !== 1) continue;\n        if (countOf(adjmap[j][i], 1) === 2) {\n          for (let n = 0; n < 4; n++) {\n            if (adjmap[j][i][n] === 0 || adjmap[j][i][n] === 2) smap[j][i][n] = 1;\n          }\n          wmap[j][i] = 3;\n        }\n        if (countOf(adjmap[j][i], 2) >= 3) ham = false;\n        if (countOf(adjmap[j][i], 1) >= 3) ham = false;\n        if (pairing && countOf(adjmap[j][i], 2) === 2) {\n          if (cycleblock) {\n            const test = smap.map((row) => row.map((cell) => cell.slice()));\n            for (let n = 0; n < 4; n++) {\n              if (adjmap[j][i][n] === 2) test[j][i][n] = 1;\n            }\n            const x = cycleCheck(test, i, j);\n            if (!x) {\n              smap[j][i] = test[j][i];\n              wmap[j][i] = 3;\n            } else if (x !== max) ham = false;\n          } else {\n            for (let n = 0; n < 4; n++) {\n              if (adjmap[j][i][n] === 2) smap[j][i][n] = 1;\n            }\n            wmap[j][i] = 3;\n          }\n        }\n      }\n    }\n    return ham;\n  }\n  function mapsEqual(a, b) {\n    if (a.length !== b.length) return false;\n    for (let j = 0; j < a.length; j++) {\n      if (a[j].length !== b[j].length) return false;\n      for (let i = 0; i < a[j].length; i++) {\n        const av = a[j][i];\n        const bv = b[j][i];\n        if (Array.isArray(av)) {\n          for (let k = 0; k < 4; k++) if (av[k] !== bv[k]) return false;\n        } else if (av !== bv) return false;\n      }\n    }\n    return true;\n  }\n  var Pattern = class _Pattern {\n    constructor(x, y, { wmap = null, smap = null, walls = null } = {}) {\n      this.wallmap = wmap ? wmap.map((row) => row.slice()) : newPattern(x, y);\n      this.snakemap = smap ? smap.map((row) => row.map((c) => c.slice())) : new4map(x, y);\n      this.lenx = x;\n      this.leny = y;\n      this.adjacencymap = newAdjmap(this.wallmap, this.snakemap);\n      this.ham = true;\n      this.wallcount = walls != null ? walls : this.countWalls();\n      this._progress = null;\n      this._cancelled = null;\n    }\n    clone() {\n      const p = Object.create(_Pattern.prototype);\n      p.wallmap = this.wallmap.map((row) => row.slice());\n      p.snakemap = this.snakemap.map((row) => row.map((c) => c.slice()));\n      p.adjacencymap = this.adjacencymap.map((row) => row.map((c) => c.slice()));\n      p.lenx = this.lenx;\n      p.leny = this.leny;\n      p.ham = this.ham;\n      p.wallcount = this.wallcount;\n      p._progress = this._progress;\n      p._cancelled = this._cancelled;\n      return p;\n    }\n    countWalls() {\n      let n = 0;\n      for (let j = 0; j < this.leny; j++) {\n        for (let i = 0; i < this.lenx; i++) {\n          if (this.wallmap[j][i] === 2) n++;\n        }\n      }\n      return n;\n    }\n    firstEmpty() {\n      for (let j = 0; j < this.leny; j++) {\n        for (let i = 0; i < this.lenx; i++) {\n          if (this.wallmap[j][i] === 1) return [i, j];\n        }\n      }\n      return null;\n    }\n    step(p = true) {\n      const ok = snakeFillStep(\n        this.wallmap,\n        this.adjacencymap,\n        this.snakemap,\n        this.lenx * this.leny - this.wallcount,\n        p\n      );\n      this.adjacencymap = newAdjmap(this.wallmap, this.snakemap);\n      if (!ok) this.ham = false;\n    }\n    work(p = true, lim = true) {\n      let prev = this.clone();\n      if (p) this.work(false, lim);\n      this.step(p);\n      while ((this.ham || lim) && !this.equals(prev)) {\n        if (this._cancelled && this._cancelled()) return;\n        prev = this.clone();\n        if (p) this.work(false, lim);\n        this.step(p);\n      }\n    }\n    equals(other) {\n      return mapsEqual(this.wallmap, other.wallmap) && mapsEqual(this.snakemap, other.snakemap);\n    }\n    /**\n     * @returns {Pattern|false} solved pattern or false\n     */\n    solve() {\n      if (this._cancelled && this._cancelled()) return false;\n      const prog = this._progress;\n      if (prog) {\n        let filled = 0;\n        for (const row of this.wallmap) {\n          for (const cell of row) if (cell === 3) filled++;\n        }\n        prog.tick(`${filled} cells forced`);\n      }\n      if (!this.ham) return false;\n      const free = this.lenx * this.leny - this.wallcount;\n      if (free % 2 || !darkLightCheck(this.wallmap)) {\n        this.ham = false;\n        return false;\n      }\n      this.work();\n      if (this._cancelled && this._cancelled()) return false;\n      if (!this.ham) return false;\n      const need = this.leny * this.lenx - this.wallcount;\n      if (this.wallmap[0][0] === 3 && cycleCheck(this.snakemap, 0, 0) === need || this.wallmap[0][1] === 3 && cycleCheck(this.snakemap, 1, 0) === need) {\n        return this;\n      }\n      let guess = this.clone();\n      const fe = this.firstEmpty();\n      if (fe == null) return false;\n      guess.wallmap[fe[1]][fe[0]] = 3;\n      const guesspiece = [0, 0, 0, 0];\n      if (this.adjacencymap[fe[1]][fe[0]][0] === 2) guesspiece[0] = 1;\n      else if (this.adjacencymap[fe[1]][fe[0]][2] === 2) guesspiece[2] = 1;\n      guesspiece[1] = 1;\n      guess.snakemap[fe[1]][fe[0]] = guesspiece.slice();\n      guess.adjacencymap = newAdjmap(guess.wallmap, guess.snakemap);\n      if (!cycleCheck(guess.snakemap, fe[0], fe[1])) {\n        const g1 = guess.solve();\n        if (g1) return g1;\n      }\n      guess = this.clone();\n      guess.wallmap[fe[1]][fe[0]] = 3;\n      guesspiece[1] = 0;\n      guesspiece[3] = 1;\n      guess.snakemap[fe[1]][fe[0]] = guesspiece.slice();\n      guess.adjacencymap = newAdjmap(guess.wallmap, guess.snakemap);\n      if (!cycleCheck(guess.snakemap, fe[0], fe[1])) {\n        const g2 = guess.solve();\n        if (g2) return g2;\n      }\n      return false;\n    }\n  };\n\n  // js/hamilton-classic-entry.js\n  var cancelled = false;\n  var dfsBackendLogged = false;\n  setCancelCheck(() => cancelled);\n  var wasmInit = initDfsWasm();\n  self.onmessage = async (ev) => {\n    const msg = ev.data || {};\n    if (msg.type === \"cancel\") {\n      cancelled = true;\n      dfsWasmSetCancelled(true);\n      syncWasmCancel();\n      return;\n    }\n    if (msg.type !== \"solve\") return;\n    cancelled = false;\n    dfsWasmSetCancelled(false);\n    const { bits, width, height, id } = msg;\n    try {\n      await wasmInit;\n      if (!dfsBackendLogged) {\n        dfsBackendLogged = true;\n        self.postMessage({\n          type: \"log\",\n          id,\n          message: dfsWasmReady() ? \"DFS: wasm\" : \"DFS: js\"\n        });\n      }\n      const result = runSolve(bits, width, height, id);\n      self.postMessage({\n        type: \"done\",\n        id,\n        stopped: cancelled,\n        ...result\n      });\n    } catch (err) {\n      self.postMessage({\n        type: \"error\",\n        id,\n        message: err && err.message ? err.message : String(err)\n      });\n    }\n  };\n  function emit(id, text) {\n    self.postMessage({ type: \"log\", id, message: text });\n  }\n  function emitTour(id, payload) {\n    self.postMessage({ type: \"tour\", id, ...payload });\n  }\n  function finish(tour, cycle, tourBest, color, bits, walls, cycleOpen) {\n    const gap = pathEndGap(tour, cycle);\n    const minGap = tour ? minPathEndGap(tour.length, cycle ? true : cycleOpen) : null;\n    return {\n      bits,\n      walls,\n      coloring: color,\n      tour,\n      kind: cycle ? \"cycle\" : tour ? \"path\" : \"none\",\n      has_path: !!(cycle || tour),\n      tour_best: cycle ? true : tourBest,\n      end_gap: gap,\n      min_end_gap: minGap\n    };\n  }\n  function runSolve(bits, width, height, id) {\n    configureBoard(width, height);\n    const walls = [...bits].filter((ch) => ch === \"1\").length;\n    const grid = bitsToGrid(bits);\n    const color = pathColoringReport(grid);\n    emit(\n      id,\n      `${walls} walls \\xB7 coloring ${color.black} black / ${color.white} white \\xB7 cycle ${color.cycle_possible ? \"possible\" : \"impossible\"} \\xB7 path ${color.path_possible ? \"possible\" : \"impossible\"}`\n    );\n    let tour = null;\n    let cycle = false;\n    let tourBest = null;\n    const cycleOpen = !!color.cycle_possible;\n    const push = (curTour, curCycle, curBest) => {\n      const gap = pathEndGap(curTour, curCycle);\n      const minGap = minPathEndGap(\n        curTour ? curTour.length : 0,\n        curCycle ? true : cycleOpen\n      );\n      emitTour(id, {\n        bits,\n        walls,\n        coloring: color,\n        tour: curTour,\n        kind: curCycle ? \"cycle\" : curTour ? \"path\" : \"none\",\n        has_path: !!(curCycle || curTour),\n        tour_best: curBest,\n        end_gap: gap,\n        min_end_gap: minGap\n      });\n    };\n    if (!color.path_possible && !color.cycle_possible) {\n      emit(id, \"coloring rules out a cycle and a path\");\n      return finish(null, false, null, color, bits, walls, cycleOpen);\n    }\n    return progressScope((msg) => emit(id, msg), 1e3, () => {\n      if (color.path_possible && !cancelled) {\n        emit(id, \"searching for a path\");\n        const found = findHamiltonianPath(grid);\n        if (cancelled) return finish(tour, cycle, tourBest, color, bits, walls, cycleOpen);\n        if (found) {\n          tour = found;\n          const gap = pathEndGap(found);\n          const minGap = minPathEndGap(found.length, cycleOpen);\n          tourBest = gap != null && minGap != null && gap <= minGap;\n          emit(id, `path found (gap ${gap})`);\n          push(tour, false, tourBest);\n        } else {\n          emit(id, \"no path\");\n        }\n      }\n      if (color.cycle_possible && !cycle && !cancelled) {\n        emit(id, \"searching for a cycle\");\n        const wmap = bitsToWallMap(bits, width, height);\n        const pattern = new Pattern(width, height, { wmap, walls });\n        pattern._progress = {\n          tick(extra) {\n            emit(id, extra || \"cycle search\");\n          }\n        };\n        pattern._cancelled = () => cancelled;\n        const res = pattern.solve();\n        if (cancelled) return finish(tour, cycle, tourBest, color, bits, walls, cycleOpen);\n        if (res) {\n          const found = tourFromSnakemap(res.wallmap, res.snakemap);\n          if (found) {\n            tour = found;\n            cycle = true;\n            tourBest = true;\n            emit(id, \"cycle found\");\n            push(tour, true, true);\n          }\n        } else {\n          emit(id, \"no cycle\");\n        }\n      }\n      if (tour && !cycle && !cancelled) {\n        const gap = pathEndGap(tour);\n        const minGap = minPathEndGap(tour.length, cycleOpen);\n        if (gap != null && minGap != null && gap <= minGap) {\n          tourBest = true;\n          emit(id, `already closest (gap ${gap}, minimum ${minGap})`);\n          push(tour, false, true);\n        } else {\n          emit(id, `searching closest (gap ${gap}, minimum ${minGap})`);\n          const [newTour, newGap, isBest] = improvePathEndpoints(grid, tour, {\n            cyclePossible: cycleOpen,\n            onBetter(t, g, best) {\n              tour = t;\n              tourBest = best;\n              if (g === 1 && t.length % 2 === 0) {\n                cycle = true;\n                tourBest = true;\n                emit(id, \"gap 1 is a cycle\");\n                push(tour, true, true);\n              } else {\n                push(tour, false, best);\n              }\n            }\n          });\n          if (newTour) tour = newTour;\n          if (newGap != null) {\n          }\n          if (isBest) tourBest = true;\n        }\n      }\n      return finish(tour, cycle, tourBest, color, bits, walls, cycleOpen);\n    });\n  }\n})();\n";
  /* __HAMILTON_INLINE_WORKER_END__ */

  /**
   * Score-bar wall trophy only — never fruit (`lh7ff`) or death-screen (`LpoWPe`).
   * Prefers Counter/Pudding `#stat-icon`; else native Google `UEI8qf` in `.sEOCsb`.
   */
  HM.getScoreBarIcon = function getScoreBarIcon() {
    const counter = document.getElementById("stat-icon");
    if (counter) return counter;
    const bar = document.getElementsByClassName("sEOCsb")[0];
    if (bar) {
      const inBar = bar.querySelector('img[jsname="UEI8qf"]');
      if (inBar) return inBar;
    }
    return document.querySelector('img[jsname="UEI8qf"]');
  };

  HM.WALL_ICON_SRC =
    "https://www.google.com/logos/fnbx/snake_arcade/v22/trophy_01.png";
  HM._iconCache = {};
  HM._iconLoadGen = 0;

  /** Wall trophy brick pixels (medium green); skip pale mortar/backing. */
  HM._isWallBrickPixel = function _isWallBrickPixel(r, g, b, a) {
    if (a < 8) return false;
    if (!(g > r + 8 && g > b + 8)) return false;
    const lum = (r + g + b) / 3;
    if (lum > 158 || (a < 85 && lum > 130)) return false;
    return lum >= 85 && lum <= 155 && g >= 120 && a >= 85;
  };

  /** Recolor only brick pixels; mortar/backing stay as in the source PNG. */
  HM._recolorWallImage = function _recolorWallImage(img, mode) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const a = px[i + 3];
      if (!HM._isWallBrickPixel(r, g, b, a)) continue;
      const shade = Math.min(1.12, Math.max(0.62, g / 167));
      if (mode === "searching") {
        px[i] = Math.round(28 * shade);
        px[i + 1] = Math.round(98 * shade);
        px[i + 2] = Math.round(238 * shade);
      } else if (mode === "none") {
        px[i] = Math.round(168 * shade);
        px[i + 1] = Math.round(26 * shade);
        px[i + 2] = Math.round(22 * shade);
      } else if (mode === "worker") {
        px[i] = Math.round(148 * shade);
        px[i + 1] = Math.round(108 * shade);
        px[i + 2] = Math.round(12 * shade);
      }
    }
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL("image/png");
  };

  HM._wallIconBaseSrc = function _wallIconBaseSrc(el) {
    const src =
      HM._statIconOrigSrc ||
      (el && el.src && el.src.indexOf("data:") !== 0 ? el.src : null) ||
      (typeof window.getStatIconImageSrc === "function"
        ? window.getStatIconImageSrc()
        : null) ||
      HM.WALL_ICON_SRC;
    if (/trophy_01/i.test(src)) return src;
    return HM.WALL_ICON_SRC;
  };

  HM._clearIconTint = function _clearIconTint(el) {
    if (!el) return;
    el.style.background = "";
    el.style.backgroundColor = "";
    el.style.backgroundImage = "";
    el.style.filter = "";
    el.style.webkitMaskImage = "";
    el.style.maskImage = "";
    el.style.webkitMaskSize = "";
    el.style.maskSize = "";
    el.style.webkitMaskRepeat = "";
    el.style.maskRepeat = "";
    el.style.webkitMaskPosition = "";
    el.style.maskPosition = "";
  };

  HM._applyRecoloredSrc = function _applyRecoloredSrc(el, state) {
    const base = HM._wallIconBaseSrc(el);
    const cacheKey = base + "|" + state;
    if (HM._iconCache[cacheKey]) {
      HM._clearIconTint(el);
      el.src = HM._iconCache[cacheKey];
      return;
    }
    const gen = ++HM._iconLoadGen;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      if (gen !== HM._iconLoadGen || HM.iconState !== state) return;
      try {
        HM._iconCache[cacheKey] = HM._recolorWallImage(img, state);
      } catch (err) {
        console.warn("HamiltonMod: brick recolor failed", err);
        return;
      }
      const target = HM.getScoreBarIcon();
      if (!target || HM.iconState !== state) return;
      HM._clearIconTint(target);
      target.src = HM._iconCache[cacheKey];
    };
    img.onerror = function () {
      console.warn("HamiltonMod: could not load wall icon for recolor", base);
    };
    img.src = base;
  };

  HM._restoreWallIconSrc = function _restoreWallIconSrc() {
    if (typeof window.getStatIconImageSrc === "function") {
      const src = window.getStatIconImageSrc();
      if (src) return src;
    }
    if (HM._statIconOrigSrc && /trophy_01/i.test(HM._statIconOrigSrc)) {
      return HM._statIconOrigSrc;
    }
    return HM.WALL_ICON_SRC;
  };

  /**
   * Recolor wall-trophy bricks only (blue searching / red none); mortar unchanged.
   */
  HM._applyIconVisual = function _applyIconVisual(state) {
    const el = HM.getScoreBarIcon();
    if (!el) return;
    if (HM._statIconOrigSrc == null && el.src && el.src.indexOf("data:") !== 0) {
      HM._statIconOrigSrc = el.src;
    }
    if (state === "searching" || state === "none" || state === "worker") {
      HM._applyRecoloredSrc(el, state);
      return;
    }
    HM._clearIconTint(el);
    el.src = HM._restoreWallIconSrc();
  };

  HM.setWallIconState = function setWallIconState(state) {
    HM.iconState = state;
    HM._applyIconVisual(state);
    if (HM._iconTimer) {
      clearInterval(HM._iconTimer);
      HM._iconTimer = null;
    }
    if (state === "searching" || state === "none" || state === "worker") {
      HM._iconTimer = setInterval(function () {
        if (HM.iconState === state) HM._applyIconVisual(state);
        else {
          clearInterval(HM._iconTimer);
          HM._iconTimer = null;
        }
      }, 400);
    }
  };

  HM.clearTour = function clearTour() {
    HM.currentTour = null;
    HM.isCycle = false;
  };

  HM.cancelSolve = function cancelSolve(hard) {
    if (!HM.worker) return;
    try {
      HM.worker.postMessage({ type: "cancel" });
    } catch (_) {
      /* ignore */
    }
    if (hard) {
      try {
        HM.worker.terminate();
      } catch (_) {
        /* ignore */
      }
      HM.worker = null;
      HM._workerPromise = null;
    }
  };

  /** Invalidate any in-flight solve so stale worker messages cannot apply. */
  HM.beginSolveGeneration = function beginSolveGeneration(bits) {
    const id = ++HM.solveId;
    HM._activeSolveId = id;
    HM._activeBits = bits || null;
    HM.solvePhase = "idle";
    HM.clearTour();
    HM._workerEpoch = (HM._workerEpoch || 0) + 1;
    HM.cancelSolve(true);
    return id;
  };

  HM.onGameReset = function onGameReset() {
    HM.beginSolveGeneration(null);
    if (!window.wallCoords) window.wallCoords = [];
    else window.wallCoords.length = 0;
    HM.setWallIconState("idle");
    HM.updateIndicator();
  };

  HM._messageMatchesActive = function _messageMatchesActive(msg) {
    if (msg.id !== HM.solveId || msg.id !== HM._activeSolveId) return false;
    if (msg.bits != null && HM._activeBits != null && msg.bits !== HM._activeBits) {
      return false;
    }
    return true;
  };

  HM._phaseFromLog = function _phaseFromLog(text) {
    const t = String(text || "").toLowerCase();
    if (t.indexOf("searching for a path") >= 0 || t.indexOf("path found") >= 0) {
      return "path";
    }
    if (
      t.indexOf("searching for a cycle") >= 0 ||
      t.indexOf("cycle found") >= 0 ||
      t.indexOf("cycle search") >= 0
    ) {
      return "cycle";
    }
    if (t.indexOf("closest") >= 0 || t.indexOf("gap") >= 0) {
      return "closest";
    }
    if (t.indexOf("coloring rules out") >= 0) return "none";
    return null;
  };

  HM.countWallCheckerColors = function countWallCheckerColors(coords, dims) {
    let white = 0;
    let black = 0;
    (coords || []).forEach(function (coord) {
      const x = coord[0];
      const y = coord[1];
      if (!dims || x < 0 || y < 0 || x >= dims.width || y >= dims.height) return;
      if ((x + y) & 1) black++;
      else white++;
    });
    return {
      white: white,
      black: black,
      ratio: Math.abs(white - black),
      total: white + black,
    };
  };

  /** Same pruning rules as worker pathColoringReport (open cells only). */
  HM.pathColoringFromBits = function pathColoringFromBits(bits, width, height) {
    const n = width * height;
    const free = new Uint8Array(n);
    const nbr = new Array(n);
    let nfree = 0;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / width);
      const c = i % width;
      const list = [];
      if (r > 0) list.push(i - width);
      if (r + 1 < height) list.push(i + width);
      if (c > 0) list.push(i - 1);
      if (c + 1 < width) list.push(i + 1);
      nbr[i] = list;
      if (bits[i] !== "1") {
        free[i] = 1;
        nfree++;
      }
    }
    function colorOf(i) {
      const r = Math.floor(i / width);
      const c = i % width;
      return (r + c) & 1;
    }
    function degreeAt(i) {
      let d = 0;
      for (let k = 0; k < nbr[i].length; k++) {
        if (free[nbr[i][k]]) d++;
      }
      return d;
    }
    function reachableFrom(start, skip) {
      const seen = new Uint8Array(n);
      const stack = [start];
      while (stack.length) {
        const i = stack.pop();
        if (!free[i] || seen[i] || i === skip) continue;
        seen[i] = 1;
        for (let k = 0; k < nbr[i].length; k++) {
          const j = nbr[i][k];
          if (free[j] && !seen[j] && j !== skip) stack.push(j);
        }
      }
      return seen;
    }

    let black = 0;
    let white = 0;
    const deg1 = [];
    const isolated = [];
    for (let i = 0; i < n; i++) {
      if (!free[i]) continue;
      if (colorOf(i)) black++;
      else white++;
      const d = degreeAt(i);
      if (d === 0) isolated.push(i);
      else if (d === 1) deg1.push(i);
    }

    const diff = Math.abs(black - white);
    const reasons = [];
    const cycleReasons = [];
    const extra = [];
    let first = -1;
    if (nfree > 1) {
      for (let i = 0; i < n; i++) {
        if (free[i]) {
          first = i;
          break;
        }
      }
      let reached = reachableFrom(first, -1);
      for (let i = 0; i < n; i++) {
        if (free[i] && !reached[i]) {
          extra.push(i);
          const r2 = reachableFrom(i, -1);
          for (let j = 0; j < n; j++) {
            if (r2[j]) reached[j] = 1;
          }
        }
      }
    }

    if (nfree > 0 && nfree < 4) {
      cycleReasons.push("too_small");
      reasons.push("too_small");
    }
    if (nfree > 1 && isolated.length) {
      cycleReasons.push("isolated");
      reasons.push("isolated");
    }
    if (extra.length) {
      cycleReasons.push("disconnected");
      reasons.push("disconnected");
    }
    if (black !== white) cycleReasons.push("imbalance");
    if (nfree & 1 && diff >= 3) reasons.push("path_imbalance");
    if (deg1.length) cycleReasons.push("dead_end");
    if (deg1.length > 2) reasons.push("too_many_dead_ends");
    if (nfree > 1 && (nfree & 1) && deg1.length) {
      const majority = black > white ? 1 : 0;
      for (let k = 0; k < deg1.length; k++) {
        if (colorOf(deg1[k]) !== majority) {
          reasons.push("minority_dead_end");
          break;
        }
      }
    } else if (
      nfree > 1 &&
      !(nfree & 1) &&
      deg1.length === 2 &&
      colorOf(deg1[0]) === colorOf(deg1[1])
    ) {
      reasons.push("same_color_dead_ends");
    }

    if (nfree > 3) {
      for (let i = 0; i < n; i++) {
        if (!free[i]) continue;
        let components = 0;
        let left = 0;
        for (let j = 0; j < n; j++) {
          if (free[j] && j !== i) left++;
        }
        if (!left) continue;
        let start = -1;
        for (let j = 0; j < n; j++) {
          if (free[j] && j !== i) {
            start = j;
            break;
          }
        }
        const seen = reachableFrom(start, i);
        components = 1;
        for (let j = 0; j < n; j++) {
          if (free[j] && j !== i && !seen[j]) {
            components++;
            if (components >= 3) {
              cycleReasons.push("three_way_cut");
              reasons.push("three_way_cut");
              break;
            }
            const r2 = reachableFrom(j, i);
            for (let t = 0; t < n; t++) {
              if (r2[t]) seen[t] = 1;
            }
          }
        }
        if (cycleReasons.indexOf("three_way_cut") >= 0) break;
      }
    }

    const pathColoring = reasons.length > 0;
    const cycleColoring = cycleReasons.length > 0;
    return {
      black: black,
      white: white,
      diff: diff,
      cycle_possible: !cycleColoring,
      path_possible: !pathColoring && diff <= 1,
    };
  };

  HM.isColoringImpossible = function isColoringImpossible(coloring) {
    return (
      !!coloring &&
      !coloring.path_possible &&
      !coloring.cycle_possible
    );
  };

  HM.buildWallBits = function buildWallBits(dims) {
    if (!dims) return null;
    let bits = window.coordinatesToBoardString(window.wallCoords || []);
    if (!bits || bits.length !== dims.cells) {
      const board = Array(dims.cells).fill("0");
      (window.wallCoords || []).forEach(function (coord) {
        const x = coord[0];
        const y = coord[1];
        if (x < 0 || y < 0 || x >= dims.width || y >= dims.height) return;
        board[y * dims.width + x] = "1";
      });
      bits = board.join("");
    }
    return bits;
  };

  HM.formatIndicatorText = function formatIndicatorText(counts) {
    const c = counts || { white: 0, black: 0, ratio: 0, total: 0 };
    return (
      "Hamilton Mod | White: " +
      c.white +
      " - Black: " +
      c.black +
      " | Ratio: " +
      c.ratio +
      " | Total: " +
      c.total
    );
  };

  HM.updateIndicator = function updateIndicator() {
    const el =
      HM._indicatorEl || document.getElementById("hamilton-mod-indicator");
    if (!el) return;
    HM._indicatorEl = el;
    const dims = HM.getBoardDims();
    const counts = HM.countWallCheckerColors(window.wallCoords || [], dims);
    el.textContent = HM.formatIndicatorText(counts);
  };

  HM._spawnWorkerOnce = function _spawnWorkerOnce() {
    const epoch = HM._workerEpoch;
    const code = HM._INLINE_CLASSIC_WORKER;
    if (!code || typeof code !== "string") {
      throw new Error("inline classic worker missing — rebuild embed");
    }
    const blobUrl = URL.createObjectURL(
      new Blob([code], { type: "application/javascript" })
    );
    const w = new Worker(blobUrl);
    w.onmessage = function (ev) {
      HM.onWorkerMessage(ev.data || {});
    };
    w.onerror = function (err) {
      console.error("HamiltonMod worker error", err);
      try {
        w.terminate();
      } catch (_) {
        /* ignore */
      }
      if (HM.worker === w) {
        HM.worker = null;
      }
      if (HM.iconState === "searching") {
        HM.setWallIconState("worker");
      }
    };
    // A newer pattern may have killed/replaced the generation while we spawned.
    if (epoch !== HM._workerEpoch) {
      try {
        w.terminate();
      } catch (_) {
        /* ignore */
      }
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (_) {
        /* ignore */
      }
      return null;
    }
    HM.worker = w;
    HM._workerBlobUrl = blobUrl;
    return w;
  };

  HM.ensureWorker = function ensureWorker() {
    if (HM.worker) return Promise.resolve(HM.worker);
    if (HM._workerPromise) return HM._workerPromise;

    const epoch = HM._workerEpoch;
    const trySpawn = function (remaining) {
      if (epoch !== HM._workerEpoch) return Promise.resolve(null);
      return Promise.resolve()
        .then(function () {
          return HM._spawnWorkerOnce();
        })
        .catch(function (err) {
          if (epoch !== HM._workerEpoch) return null;
          HM.worker = null;
          if (remaining <= 1) {
            console.error("HamiltonMod: failed to start worker after retries", err);
            return null;
          }
          console.warn(
            "HamiltonMod: worker start failed, retrying (" +
              (remaining - 1) +
              " left)"
          );
          return new Promise(function (resolve) {
            setTimeout(resolve, HM.WORKER_RETRY_MS);
          }).then(function () {
            return trySpawn(remaining - 1);
          });
        });
    };

    const spawnPromise = trySpawn(HM.WORKER_MAX_RETRIES).finally(function () {
      if (HM._workerPromise === spawnPromise) {
        HM._workerPromise = null;
      }
    });
    HM._workerPromise = spawnPromise;
    return HM._workerPromise;
  };

  HM.onWorkerMessage = function onWorkerMessage(msg) {
    if (!HM._messageMatchesActive(msg)) return;
    if (msg.type === "log") {
      const phase = HM._phaseFromLog(msg.message);
      if (phase) HM.solvePhase = phase;
      if (window.NepDebug) console.log("[Hamilton]", msg.message);
      return;
    }
    if (msg.type === "error") {
      console.error("HamiltonMod solve error:", msg.message);
      HM.solvePhase = "none";
      HM.setWallIconState("none");
      HM.clearTour();
      return;
    }
    if (msg.type === "tour") {
      if (msg.tour && msg.tour.length) {
        HM.currentTour = msg.tour;
        HM.isCycle = msg.kind === "cycle";
        HM.solvePhase = msg.kind === "cycle" ? "cycle" : "path";
        HM.setWallIconState("ok");
      }
      return;
    }
    if (msg.type === "done") {
      // Cancelled / superseded leftovers must not flip icon or tour.
      if (msg.stopped) return;
      if (msg.coloring) HM._lastColoring = msg.coloring;
      HM.updateIndicator();
      if (msg.tour && msg.tour.length) {
        HM.currentTour = msg.tour;
        HM.isCycle = msg.kind === "cycle";
        HM.solvePhase = "done";
        HM.setWallIconState("ok");
      } else {
        HM.clearTour();
        HM.solvePhase = "none";
        HM.setWallIconState("none");
      }
    }
  };

  HM.getBoardDims = function getBoardDims() {
    const sizes = window.WALL_SOLVER_SIZES || HM.WALL_SOLVER_SIZES;
    const sizeIdx =
      window.timeKeeper &&
      typeof window.timeKeeper.getCurrentSetting === "function"
        ? window.timeKeeper.getCurrentSetting("size")
        : -1;
    if (sizes[sizeIdx]) return sizes[sizeIdx];
    if (HM._lastGridW && HM._lastGridH) {
      const keys = Object.keys(sizes);
      for (let i = 0; i < keys.length; i++) {
        const d = sizes[keys[i]];
        if (d.width === HM._lastGridW && d.height === HM._lastGridH) return d;
      }
    }
    return null;
  };

  HM.notifyWallSpawn = function notifyWallSpawn() {
    if (!HM.isWallMode()) return;
    const dims = HM.getBoardDims();
    const bits = dims ? HM.buildWallBits(dims) : null;
    HM.updateIndicator();
    if (!dims || !bits) {
      console.warn("HamiltonMod: unknown board size; cannot solve yet");
      return;
    }
    HM._startSolve(bits, dims);
  };

  HM._postSolveToWorker = function _postSolveToWorker(worker, id, bits, dims) {
    worker.postMessage({
      type: "solve",
      id: id,
      bits: bits,
      width: dims.width,
      height: dims.height,
    });
  };

  HM._startSolve = function _startSolve(bits, dims) {
    const id = HM.beginSolveGeneration(bits);
    HM._lastBits = bits;
    HM._lastColoring = HM.pathColoringFromBits(
      bits,
      dims.width,
      dims.height
    );
    HM.updateIndicator();

    if (HM.isColoringImpossible(HM._lastColoring)) {
      HM.solvePhase = "none";
      HM.setWallIconState("none");
      return;
    }

    HM.solvePhase = "searching";
    HM.setWallIconState("searching");

    const run = function (retriesLeft) {
      HM.ensureWorker().then(function (worker) {
        if (id !== HM.solveId || id !== HM._activeSolveId) return;
        if (!worker) {
          console.error(
            "HamiltonMod: no Worker after retries — skipping solve (will not freeze the game)"
          );
          HM.solvePhase = "worker";
          HM.setWallIconState("worker");
          return;
        }
        try {
          HM._postSolveToWorker(worker, id, bits, dims);
        } catch (err) {
          console.error("HamiltonMod: postMessage failed", err);
          HM.cancelSolve(true);
          if (retriesLeft <= 0) {
            HM.solvePhase = "worker";
            HM.setWallIconState("worker");
            return;
          }
          run(retriesLeft - 1);
        }
      });
    };

    run(HM.WORKER_MAX_RETRIES - 1);
  };

  /** Single thin red polyline through cell centers. Tour cells are [row, col]. */
  HM.paintTour = function paintTour(ctx, cellSize, ox, oy) {
    const tour = HM.currentTour;
    if (!ctx || !tour || tour.length < 2 || !cellSize) return;

    const S = cellSize;
    const pts = tour.map(function (rc) {
      return [ox + rc[1] * S + S / 2, oy + rc[0] * S + S / 2];
    });

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e23b3b";
    ctx.lineWidth = Math.max(1.25, S * 0.1);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (HM.isCycle) ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  HM._readGeom = function _readGeom(renderer) {
    const p = HM._boardProps;
    if (!p || !renderer) return null;
    const board = renderer[p.board];
    if (!board) return null;
    const geom = board[p.geom];
    if (!geom) return null;
    const S = geom[p.cell];
    const grid = geom[p.grid];
    if (!S || !grid || typeof S !== "number") return null;
    return { S: S, grid: grid };
  };

  /**
   * Paint onto the board buffer context (no letterbox) before it is blitted.
   * layerCtx: compositor board buffer (e.g. this.Ja); ox/oy = shake offset Qh,Hh.
   */
  HM.paintOntoBuffer = function paintOntoBuffer(layerCtx, renderer, ox, oy) {
    if (!HM.isWallMode() || !HM.currentTour || !HM.currentTour.length) return;
    const g = HM._readGeom(renderer);
    if (!g || !layerCtx) return;
    HM._lastGridW = g.grid.width;
    HM._lastGridH = g.grid.height;
    try {
      HM.paintTour(layerCtx, g.S, ox || 0, oy || 0);
    } catch (err) {
      if (window.NepDebug) console.warn("HamiltonMod.paintOntoBuffer", err);
    }
  };

  /**
   * Called after the board buffer is blitted onto the main canvas.
   */
  HM.paintFrame = function paintFrame(renderer, ox, oy) {
    if (!HM.isWallMode()) return;
    const g = HM._readGeom(renderer);
    if (!g) return;
    HM._lastGridW = g.grid.width;
    HM._lastGridH = g.grid.height;
    if (!HM.currentTour || !HM.currentTour.length) return;
    const ctx = renderer.context;
    if (!ctx) return;
    let x = ox;
    let y = oy;
    if (typeof x !== "number" || typeof y !== "number") {
      x = Math.round((ctx.canvas.width - g.grid.width * g.S) / 2);
      y = Math.round((ctx.canvas.height - g.grid.height * g.S) / 2);
    }
    try {
      HM.paintTour(ctx, g.S, x, y);
    } catch (err) {
      if (window.NepDebug) console.warn("HamiltonMod.paintFrame", err);
    }
  };
};

////////////////////////////////////////////////////////////////////
// ALTER SNAKE CODE
////////////////////////////////////////////////////////////////////

window.HamiltonMod.alterSnakeCode = function (code) {
  const HM = window.HamiltonMod;

  // --- Reset: clear tour / cancel solve ---
  if (/window\.wallCoords\s*=\s*\[\];/.test(code)) {
    code = code.assertReplace(
      /window\.wallCoords\s*=\s*\[\];/,
      "window.wallCoords=[];window.HamiltonMod&&window.HamiltonMod.onGameReset();"
    );
  } else {
    // Stock / lightly patched dumps: ";this.reset()}}" or "this.reset();;;;}}"
    const reset_regex = /;?this\.reset\(\);*\}{2}/;
    window.catchError(reset_regex, code);
    if (!window.wallCoords) window.wallCoords = [];
    code = code.assertReplace(
      reset_regex,
      ";window.wallCoords=[];window.HamiltonMod&&window.HamiltonMod.onGameReset();$&"
    );
  }

  // --- Wall spawn (null, 5): only when a wall actually lands ---
  const wall_spawn_let =
    /(?:let|const|var) ([a-zA-Z0-9_$]{1,8})=\r?\n?[a-zA-Z0-9_$]{1,8}\(this\.[a-zA-Z0-9_$]{1,8},this\.[a-zA-Z0-9_$]{1,8}\(null,5\)\);/;
  const wall_spawn_assign =
    /\(([a-zA-Z0-9_$]{1,8})=[a-zA-Z0-9_$]{1,8}\((?:this|a)\.[a-zA-Z0-9_$]{1,8},(?:this|a)\.[a-zA-Z0-9_$]{1,8}\(null,5\)\)\)/;

  if (/wallCoords\.push/.test(code)) {
    code = code.assertReplace(
      /window\.wallCoords\.push\(\[([^\]]+)\]\)/,
      "window.wallCoords.push([$1]),window.HamiltonMod&&window.HamiltonMod.notifyWallSpawn()"
    );
  } else {
    const wall_let_match = code.match(wall_spawn_let);
    if (wall_let_match) {
      window.catchError(wall_spawn_let, code);
      const wall_pos = wall_let_match[1];
      // Prefer extending an existing `if (pos) { stats.walls... }` Counter stub
      const ifWallStats = new RegExp(
        "if\\(" +
          wall_pos +
          "\\)\\{stats\\.walls\\.game\\+\\+;([^}]*)\\}"
      );
      if (ifWallStats.test(code)) {
        code = code.assertReplace(
          ifWallStats,
          "if(" +
            wall_pos +
            "){stats.walls.game++;if(!window.wallCoords)window.wallCoords=[];window.wallCoords.push([" +
            wall_pos +
            ".x," +
            wall_pos +
            ".y]);window.HamiltonMod&&window.HamiltonMod.notifyWallSpawn();$1}"
        );
      } else {
        const inject =
          wall_let_match[0] +
          "\nif(" +
          wall_pos +
          "){if(!window.wallCoords)window.wallCoords=[];window.wallCoords.push([" +
          wall_pos +
          ".x," +
          wall_pos +
          ".y]);window.HamiltonMod&&window.HamiltonMod.notifyWallSpawn();}\n";
        code = code.assertReplace(wall_spawn_let, inject);
      }
    } else {
      window.catchError(wall_spawn_assign, code);
      const wall_assign_match = code.match(wall_spawn_assign);
      const wall_pos = wall_assign_match[1];
      const inner = wall_assign_match[0].slice(1, -1);
      code = code.assertReplace(
        wall_spawn_assign,
        "(" +
          inner +
          "," +
          wall_pos +
          "&&(window.wallCoords||(window.wallCoords=[]),window.wallCoords.push([" +
          wall_pos +
          ".x," +
          wall_pos +
          ".y]),window.HamiltonMod&&window.HamiltonMod.notifyWallSpawn())," +
          wall_pos +
          ")"
      );
    }
  }

  // --- Board geometry property names (cell centers match walls) ---
  // Walls: pos.x * this.BOARD.GEOM.CELL + this.BOARD.GEOM.CELL / 2
  const wallCenter =
    /([a-zA-Z0-9_$]+)\.pos\.x\*this\.([a-zA-Z0-9_$]{1,8})\.([a-zA-Z0-9_$]{1,8})\.([a-zA-Z0-9_$]{1,8})\+this\.\2\.\3\.\4\/2/;
  const wallCenterMatch = code.match(wallCenter);
  if (!wallCenterMatch) {
    console.warn(
      "HamiltonMod: could not find wall cell-center pattern; tour draw may fail"
    );
  } else {
    // Wall renderer uses this.BOARD; compositor uses the same board object as this.BOARD
    // Discover compositor board field: render=function(a,b){this.BOARD.Nn&&
    const compBoard = code.match(
      /render\s*=\s*function\s*\(\s*a\s*,\s*b\s*\)\s*\{\s*this\.([a-zA-Z0-9_$]{1,8})\.Nn&&/
    );
    const boardOnCompositor = compBoard
      ? compBoard[1]
      : wallCenterMatch[2];
    // Grid dims: BOARD.GEOM.GRID with .width / .height — usually same GEOM object
    const gridMatch = code.match(
      new RegExp(
        "this\\." +
          wallCenterMatch[2] +
          "\\." +
          wallCenterMatch[3] +
          "\\.([a-zA-Z0-9_$]{1,8})\\.width"
      )
    );
    HM._boardProps = {
      board: boardOnCompositor,
      geom: wallCenterMatch[3],
      cell: wallCenterMatch[4],
      grid: gridMatch ? gridMatch[1] : "oa",
    };
  }

  // Paint onto board buffer (Ja) before blit, then again on main canvas after blit.
  // Qh/Hh are shake offsets (usually 0) in scope of compositor render.
  const blitEnd =
    /this\.context\.drawImage\(this\.([a-zA-Z0-9_$]{1,8})\.canvas,([a-zA-Z0-9_$]{1,8}),([a-zA-Z0-9_$]{1,8})\)\}\}/;
  window.catchError(blitEnd, code);
  code = code.assertReplace(
    blitEnd,
    "window.HamiltonMod&&window.HamiltonMod.paintOntoBuffer(this.$1,this,typeof Qh==='number'?Qh:0,typeof Hh==='number'?Hh:0);this.context.drawImage(this.$1.canvas,$2,$3);window.HamiltonMod&&window.HamiltonMod.paintFrame(this,$2,$3)}}"
  );

  const blitInf =
    /this\.context\.drawImage\(this\.([a-zA-Z0-9_$]{1,8})\.canvas,([a-zA-Z0-9_$]{1,8})-([a-zA-Z0-9_$]{1,8}),([a-zA-Z0-9_$]{1,8})-([a-zA-Z0-9_$]{1,8})\)\}else\{/;
  if (blitInf.test(code)) {
    blitInf.lastIndex = 0;
    code = code.assertReplace(
      blitInf,
      "window.HamiltonMod&&window.HamiltonMod.paintFrame(this,$2-$3,$4-$5);this.context.drawImage(this.$1.canvas,$2-$3,$4-$5);window.HamiltonMod&&window.HamiltonMod.paintFrame(this,$2-$3,$4-$5)}else{"
    );
  }

  return code;
};

////////////////////////////////////////////////////////////////////
// RUN CODE AFTER
////////////////////////////////////////////////////////////////////

window.HamiltonMod.runCodeAfter = function () {
  const indicator = document.createElement("div");
  indicator.id = "hamilton-mod-indicator";
  indicator.style.cssText =
    "position:absolute;font-family:Roboto,Arial,sans-serif;color:white;font-size:14px;padding-top:4px;padding-left:30px;user-select:none;";
  const canvasNode = document.getElementsByClassName("jNB0Ic")[0];
  const parent = document.getElementsByClassName("EjCLSb")[0];
  if (parent && canvasNode) {
    parent.insertBefore(indicator, canvasNode);
  }
  window.HamiltonMod._indicatorEl = indicator;
  window.HamiltonMod.updateIndicator();
};
