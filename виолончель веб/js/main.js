// ==========================================
// DOM ЭЛЕМЕНТЫ
// ==========================================
const lengthInput = document.getElementById('lengthInput');
const tensionInput = document.getElementById('tensionInput');
const densityInput = document.getElementById('densityInput');
const diameterInput = document.getElementById('diameterInput');

const frequencyOutput = document.getElementById('frequencyOutput');
const speedOutput = document.getElementById('speedOutput');
const wavelengthOutput = document.getElementById('wavelengthOutput');

const scaleInput = document.getElementById('scaleInput');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');

const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const canvas1 = document.getElementById('stringCanvas1');
const canvas2 = document.getElementById('stringCanvas2');
const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');

// ==========================================
// ПЕРЕМЕННЫЕ ФИЗИКИ
// ==========================================
let frequency = 0;
let waveSpeed = 0;
let wavelength = 0;
let amplitude = 8;
let time = 0;
let currentScale = 1;

// ==========================================
// ИСТОРИЯ ДЛЯ UNDO/REDO
// ==========================================
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 5;

// ==========================================
// НАСТРОЙКА CANVAS
// ==========================================
function resizeCanvas(canvas, container) {
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function updateCanvasSizes() {
  resizeCanvas(canvas1, document.getElementById('imageBox1'));
  resizeCanvas(canvas2, document.getElementById('imageBox2'));
}

window.addEventListener('resize', updateCanvasSizes);
updateCanvasSizes();

// ==========================================
// РАСЧЁТ ПАРАМЕТРОВ
// ==========================================
function calculate() {
  const L = parseFloat(lengthInput.value);
  const F = parseFloat(tensionInput.value);
  const mu = parseFloat(densityInput.value);

  if (!L || !F || !mu || L <= 0 || F <= 0 || mu <= 0) {
    return;
  }

  waveSpeed = Math.sqrt(F / mu);
  frequency = waveSpeed / (2 * L);
  wavelength = waveSpeed / frequency;
  
  amplitude = Math.max(2, 12 / Math.sqrt(F));

  frequencyOutput.textContent = `${frequency.toFixed(2)} Гц`;
  speedOutput.textContent = `${waveSpeed.toFixed(2)} м/с`;
  wavelengthOutput.textContent = `${wavelength.toFixed(4)} м`;
}

// ==========================================
// ОБРАБОТЧИКИ ВВОДА
// ==========================================
lengthInput.addEventListener('input', () => {
  saveToHistory();
  calculate();
});

tensionInput.addEventListener('input', () => {
  saveToHistory();
  calculate();
});

densityInput.addEventListener('input', () => {
  saveToHistory();
  calculate();
});

diameterInput.addEventListener('input', () => {
  saveToHistory();
  calculate();
});

// ==========================================
// КНОПКИ СТРЕЛОК
// ==========================================
document.querySelectorAll('.arrow-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const param = btn.dataset.param;
    const dir = parseInt(btn.dataset.dir);
    
    let input, step;
    
    switch(param) {
      case 'length':
        input = lengthInput;
        step = 0.01;
        break;
      case 'tension':
        input = tensionInput;
        step = 1;
        break;
      case 'density':
        input = densityInput;
        step = 0.0001;
        break;
      case 'diameter':
        input = diameterInput;
        step = 0.1;
        break;
    }
    
    if (input) {
      let value = parseFloat(input.value);
      value += step * dir;
      value = Math.max(0.01, value);
      
      if (param === 'length') {
        input.value = value.toFixed(2);
      } else if (param === 'tension') {
        input.value = value.toFixed(0);
      } else if (param === 'density') {
        input.value = value.toFixed(4);
      } else if (param === 'diameter') {
        input.value = value.toFixed(1);
      }
      
      saveToHistory();
      calculate();
    }
  });
});

// ==========================================
// ИСТОРИЯ (UNDO/REDO)
// ==========================================
function saveToHistory() {
  const state = {
    L: lengthInput.value,
    F: tensionInput.value,
    mu: densityInput.value,
    d: diameterInput.value
  };
  
  history = history.slice(0, historyIndex + 1);
  history.push(state);
  
  if (history.length > MAX_HISTORY) {
    history.shift();
  } else {
    historyIndex++;
  }
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const state = history[historyIndex];
    lengthInput.value = state.L;
    tensionInput.value = state.F;
    densityInput.value = state.mu;
    diameterInput.value = state.d;
    calculate();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const state = history[historyIndex];
    lengthInput.value = state.L;
    tensionInput.value = state.F;
    densityInput.value = state.mu;
    diameterInput.value = state.d;
    calculate();
  }
}

document.getElementById('prevStep').addEventListener('click', undo);
document.getElementById('nextStep').addEventListener('click', redo);

// ==========================================
// МАСШТАБИРОВАНИЕ ИЗОБРАЖЕНИЙ
// ==========================================
function updateScale() {
  let scale = parseInt(scaleInput.value) || 100;
  scale = Math.max(10, Math.min(200, scale));
  scaleInput.value = scale;
  
  currentScale = scale / 100;
  
  img1.style.transform = `scale(${currentScale})`;
  img2.style.transform = `scale(${currentScale})`;
}

scaleInput.addEventListener('input', updateScale);

zoomInBtn.addEventListener('click', () => {
  scaleInput.value = Math.min(200, parseInt(scaleInput.value) + 10);
  updateScale();
});

zoomOutBtn.addEventListener('click', () => {
  scaleInput.value = Math.max(10, parseInt(scaleInput.value) - 10);
  updateScale();
});

// ==========================================
// РИСОВАНИЕ СТРУНЫ ТОЧНО ПОВЕРХ ФОТО
// ==========================================
function drawString(ctx, canvas, stringConfig) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseWidth = canvas.width / currentScale;
  const baseHeight = canvas.height / currentScale;
  
  const x = baseWidth * stringConfig.xRatio * currentScale;
  const yStart = baseHeight * stringConfig.yStartRatio * currentScale;
  const yEnd = baseHeight * stringConfig.yEndRatio * currentScale;
  const stringLength = yEnd - yStart;
  
  const segments = Math.floor(100 * Math.sqrt(currentScale));
  const scaledAmplitude = amplitude * currentScale;
  const stringThickness = (parseFloat(diameterInput.value) || 1.5) * currentScale;
  
  // ЖЁЛТАЯ СТРУНА
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = stringThickness;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 2 * currentScale;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
  ctx.beginPath();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = yStart + stringLength * t;
    
    const displacement = scaledAmplitude * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * frequency * time);
    const xPos = x + displacement;
    
    if (i === 0) {
      ctx.moveTo(xPos, y);
    } else {
      ctx.lineTo(xPos, y);
    }
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ==========================================
// КОНФИГУРАЦИЯ СТРУН - ТОЧНО ПО ФОТО
// ==========================================

const stringConfig1 = {
  xRatio: 0.38,      // ПЕРВОЕ ФОТО (верхнее) - струна ЛЕВЕЕ
  yStartRatio: 0.05,
  yEndRatio: 0.95
};

const stringConfig2 = {
  xStartRatio: 0.33,  // ← УМЕНЬШИ (0.30, 0.28) чтобы верх был левее
  xEndRatio: 0.37,    // ← УВЕЛИЧЬ (0.40, 0.42) чтобы низ был правее
  yStartRatio: 0.12,
  yEndRatio: 0.88
};

// ==========================================
// АНИМАЦИЯ
// ==========================================
function animate(timestamp) {
  time = timestamp / 1000;
  
  drawString(ctx1, canvas1, stringConfig1);
  drawString(ctx2, canvas2, stringConfig2);
  
  requestAnimationFrame(animate);
}

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
saveToHistory();
calculate();
updateScale();
requestAnimationFrame(animate);
