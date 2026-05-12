// Dragon Curve Fractal Generator
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// State
let dragonPath = [];
let isDrawing = false;
let drawIndex = 0;
let animationId = null;
let autoAnimId = null;
let currentIter = 14;
let autoDirection = 1;

// Color schemes
const colorSchemes = {
  aurora: (t, i, n) => {
    const h = 260 + 80 * t;
    const s = 80 + 20 * Math.sin(t * Math.PI * 3);
    const l = 50 + 15 * Math.sin(t * Math.PI * 2);
    return `hsl(${h}, ${s}%, ${l}%)`;
  },
  fire: (t, i, n) => {
    const r = Math.min(255, 50 + 205 * t);
    const g = Math.min(255, 50 + 155 * Math.pow(t, 1.5));
    const b = Math.min(100, 50 * Math.sin(t * Math.PI));
    return `rgb(${r|0}, ${g|0}, ${b|0})`;
  },
  ocean: (t, i, n) => {
    const h = 190 + 40 * t;
    const s = 70 + 20 * Math.sin(t * Math.PI);
    const l = 40 + 30 * t;
    return `hsl(${h}, ${s}%, ${l}%)`;
  },
  rainbow: (t, i, n) => `hsl(${(t * 360) % 360}, 85%, 55%)`,
  neon: (t, i, n) => {
    const h = (t * 360 + 180) % 360;
    return `hsl(${h}, 100%, 60%)`;
  },
  monochrome: (t, i, n) => {
    const v = 100 + 155 * t;
    return `rgb(${v|0}, ${v|0}, ${v|0})`;
  }
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (dragonPath.length > 0) redraw();
}
window.addEventListener('resize', resize);

// Generate dragon curve using L-system
// L → L+R+  R → -L-R
function generateDragon(iterations) {
  const segments = Math.pow(2, iterations);
  const path = [{ x: 0, y: 0 }];

  // Generate turn sequence using iterative approach
  const turns = [];
  for (let i = 0; i < iterations; i++) {
    const len = turns.length;
    turns.push(1); // +90°
    for (let j = len - 1; j >= 0; j--) {
      turns.push(-turns[j]);
    }
  }

  // Walk the path
  let x = 0, y = 0;
  let dx = 1, dy = 0; // Start heading right

  for (let i = 0; i < turns.length; i++) {
    path.push({ x, y });

    // Turn
    const turn = turns[i];
    const newDx = -dy * turn;
    const newDy = dx * turn;
    dx = newDx;
    dy = newDy;

    // Step
    x += dx;
    y += dy;
  }
  path.push({ x, y });

  return path;
}

function computeBounds(path) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of path) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

function getTransform(path) {
  const bounds = computeBounds(path);
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;

  const margin = 60;
  const availW = canvas.width - margin * 2;
  const availH = canvas.height - margin * 2;

  const scale = Math.min(availW / rangeX, availH / rangeY);

  const offsetX = (canvas.width - rangeX * scale) / 2 - bounds.minX * scale;
  const offsetY = (canvas.height - rangeY * scale) / 2 - bounds.minY * scale;

  return { scale, offsetX, offsetY };
}

function clearCanvas() {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function redraw() {
  clearCanvas();
  if (dragonPath.length < 2) return;

  const { scale, offsetX, offsetY } = getTransform(dragonPath);
  const scheme = colorSchemes[document.getElementById('color-scheme').value] || colorSchemes.aurora;
  const lw = parseFloat(document.getElementById('line-width').value);
  const total = dragonPath.length - 1;

  // Draw with slight glow
  ctx.shadowBlur = 4;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < total; i++) {
    const p1 = dragonPath[i];
    const p2 = dragonPath[i + 1];
    const t = i / total;

    ctx.beginPath();
    ctx.moveTo(p1.x * scale + offsetX, p1.y * scale + offsetY);
    ctx.lineTo(p2.x * scale + offsetX, p2.y * scale + offsetY);
    ctx.strokeStyle = scheme(t, i, total);
    ctx.shadowColor = scheme(t, i, total);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// Animated draw
function startDraw() {
  if (isDrawing) return;

  stopAuto();
  currentIter = parseInt(document.getElementById('iterations').value);
  dragonPath = generateDragon(currentIter);

  const speedMap = [1, 5, 25, 100, 500];
  const speed = speedMap[parseInt(document.getElementById('speed').value) - 1] || 100;

  isDrawing = true;
  drawIndex = 0;

  const drawBtn = document.getElementById('draw-btn');
  drawBtn.textContent = '⏸ Pause';

  function drawStep() {
    if (!isDrawing) return;

    clearCanvas();
    const { scale, offsetX, offsetY } = getTransform(dragonPath);
    const scheme = colorSchemes[document.getElementById('color-scheme').value] || colorSchemes.aurora;
    const lw = parseFloat(document.getElementById('line-width').value);
    const total = dragonPath.length - 1;

    const endIndex = Math.min(drawIndex + speed, total);

    ctx.shadowBlur = 4;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < endIndex; i++) {
      const p1 = dragonPath[i];
      const p2 = dragonPath[i + 1];
      const t = i / total;

      ctx.beginPath();
      ctx.moveTo(p1.x * scale + offsetX, p1.y * scale + offsetY);
      ctx.lineTo(p2.x * scale + offsetX, p2.y * scale + offsetY);
      ctx.strokeStyle = scheme(t, i, total);
      ctx.shadowColor = scheme(t, i, total);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    drawIndex = endIndex;

    document.getElementById('segments').textContent = `Segments: ${endIndex}/${total}`;
    document.getElementById('progress').textContent = `${((endIndex / total) * 100).toFixed(1)}%`;

    if (drawIndex < total) {
      animationId = requestAnimationFrame(drawStep);
    } else {
      isDrawing = false;
      drawBtn.textContent = '▶ Draw';
      document.getElementById('progress').textContent = '✓ Complete';
    }
  }

  animationId = requestAnimationFrame(drawStep);
}

function stopDraw() {
  isDrawing = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  document.getElementById('draw-btn').textContent = '▶ Draw';
}

// Auto animation: cycles through iterations
function startAuto() {
  stopDraw();
  if (autoAnimId) return;

  let iter = 1;
  let phase = 'drawing';

  function autoStep() {
    if (!autoAnimId) return;

    dragonPath = generateDragon(iter);
    currentIter = iter;
    document.getElementById('iterations').value = iter;
    document.getElementById('iter-val').textContent = iter;

    clearCanvas();
    const { scale, offsetX, offsetY } = getTransform(dragonPath);
    const scheme = colorSchemes[document.getElementById('color-scheme').value] || colorSchemes.aurora;
    const lw = parseFloat(document.getElementById('line-width').value);
    const total = dragonPath.length - 1;

    ctx.shadowBlur = 4;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < total; i++) {
      const p1 = dragonPath[i];
      const p2 = dragonPath[i + 1];
      const t = i / total;

      ctx.beginPath();
      ctx.moveTo(p1.x * scale + offsetX, p1.y * scale + offsetY);
      ctx.lineTo(p2.x * scale + offsetX, p2.y * scale + offsetY);
      ctx.strokeStyle = scheme(t, i, total);
      ctx.shadowColor = scheme(t, i, total);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    document.getElementById('segments').textContent = `Segments: ${total}`;
    document.getElementById('progress').textContent = `Iteration ${iter} ✓`;

    iter += autoDirection;
    if (iter > 18) {
      iter = 18;
      autoDirection = -1;
    } else if (iter < 1) {
      iter = 1;
      autoDirection = 1;
    }

    autoAnimId = setTimeout(autoStep, 800);
  }

  document.getElementById('auto-btn').textContent = '⏹ Stop';
  autoAnimId = setTimeout(autoStep, 400);
}

function stopAuto() {
  if (autoAnimId) {
    clearTimeout(autoAnimId);
    autoAnimId = null;
  }
  document.getElementById('auto-btn').textContent = '🔄 Animate';
  autoDirection = 1;
}

function reset() {
  stopDraw();
  stopAuto();
  dragonPath = [];
  drawIndex = 0;
  clearCanvas();
  document.getElementById('segments').textContent = 'Segments: 0';
  document.getElementById('progress').textContent = '';
}

// Event listeners
document.getElementById('draw-btn').addEventListener('click', () => {
  if (isDrawing) {
    stopDraw();
  } else {
    startDraw();
  }
});

document.getElementById('reset-btn').addEventListener('click', reset);

document.getElementById('auto-btn').addEventListener('click', () => {
  if (autoAnimId) {
    stopAuto();
  } else {
    startAuto();
  }
});

document.getElementById('iterations').addEventListener('input', (e) => {
  document.getElementById('iter-val').textContent = e.target.value;
});

document.getElementById('speed').addEventListener('input', (e) => {
  const labels = ['Very Slow', 'Slow', 'Medium', 'Fast', 'Instant'];
  document.getElementById('speed-val').textContent = labels[parseInt(e.target.value) - 1] || 'Fast';
});

document.getElementById('line-width').addEventListener('input', (e) => {
  document.getElementById('lw-val').textContent = e.target.value;
  if (dragonPath.length > 0 && !isDrawing) redraw();
});

document.getElementById('color-scheme').addEventListener('change', () => {
  if (dragonPath.length > 0 && !isDrawing) redraw();
});

// Init
resize();