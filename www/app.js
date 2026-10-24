/**
 * SplatDex - Windshield Bug Detective App
 * Vision AI integration with Gemini 2.5 Flash & Capacitor Camera
 */

// Application State
const state = {
  apiKey: '',
  currentImageBase64: null,
  currentImageMime: 'image/jpeg',
  currentAnalysis: null,
  isAnalyzing: false,
  soundEnabled: true,
  journal: []
};

// System Prompt for Forensic Bug Analysis
const SPLATDEX_SYSTEM_PROMPT = `You are SplatDex, a witty, kid-friendly roadside bug detective. Perform forensic analysis on the windshield splatter photo (coloration, fluids, wing fragments). Infer the most likely insect species. Always respond strictly in JSON matching the schema:
{
  "bug_name": string,
  "scientific_name": string,
  "confidence": "High" | "Medium" | "Wild Guess",
  "pre_splat_image_prompt": string,
  "eulogy": string,
  "bug_facts": string[],
  "windscreen_cleanup_tip": string
}`;

// JSON Schema for Gemini Structured Output
const SPLATDEX_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    bug_name: { type: "STRING" },
    scientific_name: { type: "STRING" },
    confidence: { type: "STRING", enum: ["High", "Medium", "Wild Guess"] },
    pre_splat_image_prompt: { type: "STRING" },
    eulogy: { type: "STRING" },
    bug_facts: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    windscreen_cleanup_tip: { type: "STRING" }
  },
  required: [
    "bug_name",
    "scientific_name",
    "confidence",
    "pre_splat_image_prompt",
    "eulogy",
    "bug_facts",
    "windscreen_cleanup_tip"
  ]
};

// --- DOM ELEMENTS ---
const elements = {
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
  apiKeyStatus: document.getElementById('apiKeyStatus'),
  settingsModal: document.getElementById('settingsModal'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),

  snapPhotoBtn: document.getElementById('snapPhotoBtn'),
  fileInput: document.getElementById('fileInput'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  analyzeBtnText: document.getElementById('analyzeBtnText'),
  analyzeBtnIcon: document.getElementById('analyzeBtnIcon'),

  previewContainer: document.getElementById('previewContainer'),
  emptyPreviewPlaceholder: document.getElementById('emptyPreviewPlaceholder'),
  imagePreview: document.getElementById('imagePreview'),
  splatterCanvas: document.getElementById('splatterCanvas'),
  reticleOverlay: document.getElementById('reticleOverlay'),
  scanningBeam: document.getElementById('scanningBeam'),
  specimenBadge: document.getElementById('specimenBadge'),

  analysisProgressCard: document.getElementById('analysisProgressCard'),
  progressStatusText: document.getElementById('progressStatusText'),
  progressDetailText: document.getElementById('progressDetailText'),
  progressBarFill: document.getElementById('progressBarFill'),

  errorCard: document.getElementById('errorCard'),
  errorMessage: document.getElementById('errorMessage'),
  dismissErrorBtn: document.getElementById('dismissErrorBtn'),

  reportCard: document.getElementById('reportCard'),
  reportBugEmoji: document.getElementById('reportBugEmoji'),
  reportBugName: document.getElementById('reportBugName'),
  reportScientificName: document.getElementById('reportScientificName'),
  confidenceBadge: document.getElementById('confidenceBadge'),
  reportEulogy: document.getElementById('reportEulogy'),
  reportBugFactsList: document.getElementById('reportBugFactsList'),
  reportCleanupTip: document.getElementById('reportCleanupTip'),
  reportPreSplatPrompt: document.getElementById('reportPreSplatPrompt'),
  saveToLogBtn: document.getElementById('saveToLogBtn'),
  shareReportBtn: document.getElementById('shareReportBtn'),

  journalList: document.getElementById('journalList'),
  journalEmptyState: document.getElementById('journalEmptyState'),
  journalCount: document.getElementById('journalCount'),
  toast: document.getElementById('toast')
};

// --- AUDIO SYNTHESIS FOR KID-FRIENDLY SFX ---
let audioCtx = null;
function playSound(type) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'splat') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'scan') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(640, now + 0.25);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    }
  } catch (err) {
    console.debug('Audio error', err);
  }
}

// --- NOTIFICATIONS ---
function showToast(msg) {
  if (!elements.toast) return;
  elements.toast.textContent = msg;
  elements.toast.style.opacity = '1';
  setTimeout(() => {
    elements.toast.style.opacity = '0';
  }, 2400);
}

// --- INITIALIZATION ---
function init() {
  loadApiKey();
  loadJournal();
  attachEventListeners();
  checkEnvironment();
}

function checkEnvironment() {
  const isCapacitor = !!window.Capacitor?.isNativePlatform?.();
  console.log(`[SplatDex] Running in ${isCapacitor ? 'Capacitor Native' : 'Browser/WebView'} mode.`);
}

function loadApiKey() {
  // Check localStorage, and also check URL parameters if testing
  const urlParams = new URLSearchParams(window.location.search);
  const paramKey = urlParams.get('key');
  const storedKey = localStorage.getItem('gemini_api_key');

  if (paramKey) {
    state.apiKey = paramKey;
    localStorage.setItem('gemini_api_key', paramKey);
  } else if (storedKey) {
    state.apiKey = storedKey;
  }

  if (elements.apiKeyInput) {
    elements.apiKeyInput.value = state.apiKey;
  }
  updateApiKeyStatusUI();
}

function updateApiKeyStatusUI() {
  if (!elements.apiKeyStatus) return;
  if (state.apiKey && state.apiKey.trim().length > 10) {
    elements.apiKeyStatus.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
      <span class="text-emerald-400 font-semibold">API Key configured (${state.apiKey.substring(0, 6)}••••)</span>
    `;
  } else {
    elements.apiKeyStatus.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-amber-400"></span>
      <span class="text-amber-300">API Key required for Gemini Vision AI</span>
    `;
  }
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
  // Sound Toggle
  elements.soundToggleBtn?.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    elements.soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    playSound('click');
    showToast(state.soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted');
  });

  // Settings Modal
  elements.openSettingsBtn?.addEventListener('click', () => {
    playSound('click');
    elements.settingsModal?.classList.remove('hidden');
  });
  elements.closeSettingsBtn?.addEventListener('click', () => {
    playSound('click');
    elements.settingsModal?.classList.add('hidden');
  });
  elements.settingsModal?.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      elements.settingsModal.classList.add('hidden');
    }
  });

  // Toggle API Key visibility
  elements.toggleKeyVisibility?.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.toggleKeyVisibility.textContent = isPassword ? 'Hide' : 'Show';
  });

  // Save API Key
  elements.saveApiKeyBtn?.addEventListener('click', () => {
    const key = elements.apiKeyInput.value.trim();
    if (!key) {
      alert('Please enter a valid Gemini API key.');
      return;
    }
    state.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    updateApiKeyStatusUI();
    elements.settingsModal.classList.add('hidden');
    playSound('success');
    showToast('Gemini API Key Saved!');
  });

  // Dismiss Error
  elements.dismissErrorBtn?.addEventListener('click', () => {
    elements.errorCard?.classList.add('hidden');
  });

  // Camera Trigger (Capacitor or Fallback)
  elements.snapPhotoBtn?.addEventListener('click', handleCameraCapture);

  // File Upload Fallback
  elements.fileInput?.addEventListener('change', handleFileUpload);

  // Sample Buttons
  document.querySelectorAll('.sample-splat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sampleType = e.currentTarget.getAttribute('data-sample');
      loadSampleSplatter(sampleType);
    });
  });

  // Analyze Specimen CTA
  elements.analyzeBtn?.addEventListener('click', analyzeSplatterWithGemini);

  // Save to Log / Diary
  elements.saveToLogBtn?.addEventListener('click', saveCurrentReportToLog);

  // Share Report
  elements.shareReportBtn?.addEventListener('click', handleShareReport);
}

// --- IMAGE CAPTURE VIA CAPACITOR OR FILE INPUT ---
async function handleCameraCapture() {
  playSound('click');
  // Check if Capacitor Camera is available
  if (window.Capacitor && window.Capacitor.isPluginAvailable('Camera')) {
    try {
      const { Camera, CameraResultType, CameraSource } = window.Capacitor.Plugins;
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (photo && photo.base64String) {
        const mime = photo.format ? `image/${photo.format}` : 'image/jpeg';
        displayLoadedImage(`data:${mime};base64,${photo.base64String}`, photo.base64String, mime);
        playSound('splat');
      }
    } catch (err) {
      console.warn('Capacitor camera failed or canceled, falling back to file picker:', err);
      if (err.message !== 'User cancelled photos app') {
        elements.fileInput?.click();
      }
    }
  } else {
    // Standard Mobile / Web File Picker with camera capture environment
    elements.fileInput?.click();
  }
}

function handleFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target.result;
    const base64Data = dataUrl.split(',')[1];
    displayLoadedImage(dataUrl, base64Data, file.type || 'image/jpeg');
    playSound('splat');
  };
  reader.readAsDataURL(file);
}

// Display image and enable analysis CTA
function displayLoadedImage(dataUrl, base64Clean, mimeType) {
  state.currentImageBase64 = base64Clean;
  state.currentImageMime = mimeType;

  if (elements.emptyPreviewPlaceholder) elements.emptyPreviewPlaceholder.classList.add('hidden');
  if (elements.splatterCanvas) elements.splatterCanvas.classList.add('hidden');
  if (elements.imagePreview) {
    elements.imagePreview.src = dataUrl;
    elements.imagePreview.classList.remove('hidden');
  }
  if (elements.reticleOverlay) elements.reticleOverlay.classList.remove('hidden');

  if (elements.specimenBadge) {
    elements.specimenBadge.textContent = 'Specimen Loaded';
    elements.specimenBadge.className = 'text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/40';
  }

  // Enable analysis button
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = false;
  }

  // Hide old report/error
  elements.reportCard?.classList.add('hidden');
  elements.errorCard?.classList.add('hidden');
}

// --- SAMPLE SPLATTER GENERATOR FOR DEMO & TESTING ---
function loadSampleSplatter(type) {
  playSound('splat');
  const canvas = elements.splatterCanvas;
  if (!canvas) return;
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  // Background Windshield Glass Tint
  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, 400, 300);

  // Subtle glass reflection streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(250, 300);
  ctx.stroke();

  const centerX = 200;
  const centerY = 150;

  if (type === 'june_beetle') {
    // Heavy iridescent green/brown smear with chitin shell flakes
    drawSplatter(ctx, centerX, centerY, 55, '#3f6212', '#65a30d', 14);
    // Chitin wing fragments
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(centerX - 12, centerY - 15, 16, 7, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(centerX + 18, centerY + 8, 14, 6, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'lovebug') {
    // Twin paired black and red fluid droplets
    drawSplatter(ctx, centerX - 25, centerY - 10, 35, '#1e1b4b', '#475569', 10);
    drawSplatter(ctx, centerX + 20, centerY + 10, 32, '#991b1b', '#ef4444', 9);
  } else if (type === 'moth') {
    // Dusty powdery beige and grey spread
    drawSplatter(ctx, centerX, centerY, 60, '#78716c', '#d6d3d1', 18);
    // Dust halo
    ctx.fillStyle = 'rgba(214, 211, 209, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dragonfly: Long translucent smear with bright electric turquoise & amber
    drawSplatter(ctx, centerX, centerY, 40, '#0284c7', '#38bdf8', 12);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 40, centerY - 20);
    ctx.lineTo(centerX + 50, centerY + 25);
    ctx.stroke();
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const base64Clean = dataUrl.split(',')[1];

  if (elements.emptyPreviewPlaceholder) elements.emptyPreviewPlaceholder.classList.add('hidden');
  if (elements.imagePreview) elements.imagePreview.classList.add('hidden');
  canvas.classList.remove('hidden');
  if (elements.reticleOverlay) elements.reticleOverlay.classList.remove('hidden');

  state.currentImageBase64 = base64Clean;
  state.currentImageMime = 'image/jpeg';

  if (elements.specimenBadge) {
    elements.specimenBadge.textContent = `Test: ${type.replace('_', ' ').toUpperCase()}`;
    elements.specimenBadge.className = 'text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40';
  }

  if (elements.analyzeBtn) elements.analyzeBtn.disabled = false;
  elements.reportCard?.classList.add('hidden');
  elements.errorCard?.classList.add('hidden');
}

function drawSplatter(ctx, x, y, radius, colorDark, colorLight, numDrops) {
  // Main center splash
  const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
  grad.addColorStop(0, colorLight);
  grad.addColorStop(0.8, colorDark);
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Droplet spatter streaks
  ctx.fillStyle = colorLight;
  for (let i = 0; i < numDrops; i++) {
    const angle = (Math.PI * 2 / numDrops) * i + (Math.random() - 0.5) * 0.4;
    const dist = radius + Math.random() * (radius * 0.8);
    const dropRadius = 2 + Math.random() * 5;
    const dropX = x + Math.cos(angle) * dist;
    const dropY = y + Math.sin(angle) * dist;

    ctx.beginPath();
    ctx.arc(dropX, dropY, dropRadius, 0, Math.PI * 2);
    ctx.fill();

    // Splash tendril
    ctx.strokeStyle = colorDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius * 0.5), y + Math.sin(angle) * (radius * 0.5));
    ctx.lineTo(dropX, dropY);
    ctx.stroke();
  }
}

// --- GEMINI VISION FORENSIC ANALYSIS ---
async function analyzeSplatterWithGemini() {
  if (!state.currentImageBase64) {
    showError('No splatter image loaded. Please take a photo or select an image first.');
    return;
  }

  // Ensure API key is configured
  if (!state.apiKey) {
    elements.settingsModal?.classList.remove('hidden');
    showError('Please configure your Gemini API Key in Settings to run Vision Forensics.');
    return;
  }

  setAnalyzingState(true);
  playSound('scan');

  try {
    // Construct Gemini REST API payload with Structured Outputs
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.apiKey.trim())}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: "Forensic analysis request: Identify this windshield bug splatter specimen." },
            {
              inlineData: {
                mimeType: state.currentImageMime,
                data: state.currentImageBase64
              }
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: SPLATDEX_SYSTEM_PROMPT }
        ]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SPLATDEX_RESPONSE_SCHEMA,
        temperature: 0.3
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const msg = errorJson.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Gemini API Error: ${msg}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini returned an empty response. Please retry with a clearer photo.');
    }

    const forensicReport = JSON.parse(rawText);
    state.currentAnalysis = forensicReport;
    renderForensicReport(forensicReport);
    playSound('success');
    showToast(`Identified: ${forensicReport.bug_name}!`);

  } catch (err) {
    console.error('Forensic analysis failed:', err);
    showError(err.message || 'Analysis failed. Please check network connection and API key.');
  } finally {
    setAnalyzingState(false);
  }
}

// Update UI during AI scanning
function setAnalyzingState(isScanning) {
  state.isAnalyzing = isScanning;

  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = isScanning;
  }

  if (isScanning) {
    elements.scanningBeam?.classList.remove('hidden');
    elements.analysisProgressCard?.classList.remove('hidden');
    elements.reportCard?.classList.add('hidden');
    elements.errorCard?.classList.add('hidden');

    if (elements.analyzeBtnText) elements.analyzeBtnText.textContent = 'Analyzing Forensic Clues...';
    if (elements.analyzeBtnIcon) elements.analyzeBtnIcon.textContent = '⏳';

    // Simulated progress steps for detective feel
    const stages = [
      { text: "Scanning glass splatter contour...", progress: "25%" },
      { text: "Detecting fluid viscidity & chitin fragments...", progress: "55%" },
      { text: "Matching against SplatDex Bug Database...", progress: "85%" },
      { text: "Composing forensic dossier & eulogy...", progress: "95%" }
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (!state.isAnalyzing || step >= stages.length) {
        clearInterval(interval);
        return;
      }
      if (elements.progressDetailText) elements.progressDetailText.textContent = stages[step].text;
      if (elements.progressBarFill) elements.progressBarFill.style.width = stages[step].progress;
      step++;
    }, 600);

  } else {
    elements.scanningBeam?.classList.add('hidden');
    elements.analysisProgressCard?.classList.add('hidden');

    if (elements.analyzeBtnText) elements.analyzeBtnText.textContent = 'Run Splat Forensics';
    if (elements.analyzeBtnIcon) elements.analyzeBtnIcon.textContent = '🔎';
  }
}

// Show Error banner
function showError(msg) {
  if (elements.errorMessage) elements.errorMessage.textContent = msg;
  elements.errorCard?.classList.remove('hidden');
  elements.errorCard?.scrollIntoView({ behavior: 'smooth' });
}

// --- RENDER STRUCTURED FORENSIC REPORT ---
function renderForensicReport(data) {
  if (!elements.reportCard) return;

  // Bug Name & Scientific Name
  if (elements.reportBugName) elements.reportBugName.textContent = data.bug_name || 'Mysterious Specimen';
  if (elements.reportScientificName) elements.reportScientificName.textContent = data.scientific_name ? `(${data.scientific_name})` : '';

  // Select emoji based on bug name
  const nameLower = (data.bug_name || '').toLowerCase();
  let emoji = '🪲';
  if (nameLower.includes('bee') || nameLower.includes('wasp')) emoji = '🐝';
  else if (nameLower.includes('butterfly') || nameLower.includes('moth')) emoji = '🦋';
  else if (nameLower.includes('dragonfly')) emoji = '⚡';
  else if (nameLower.includes('fly') || nameLower.includes('mosquito')) emoji = '🪰';
  else if (nameLower.includes('lovebug')) emoji = '❤️';
  else if (nameLower.includes('grasshopper') || nameLower.includes('cricket')) emoji = '🦗';
  if (elements.reportBugEmoji) elements.reportBugEmoji.textContent = emoji;

  // Confidence Level Badge
  if (elements.confidenceBadge) {
    const conf = data.confidence || 'Medium';
    elements.confidenceBadge.textContent = `${conf} Confidence`;

    if (conf === 'High') {
      elements.confidenceBadge.className = 'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold font-brand bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    } else if (conf === 'Medium') {
      elements.confidenceBadge.className = 'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold font-brand bg-amber-500/20 text-amber-300 border border-amber-500/40';
    } else {
      elements.confidenceBadge.className = 'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold font-brand bg-purple-500/20 text-purple-300 border border-purple-500/40';
    }
  }

  // Eulogy
  if (elements.reportEulogy) {
    elements.reportEulogy.textContent = `"${data.eulogy || 'Gone, but immortalized on the windshield.'}"`;
  }

  // 3 Bug Facts
  if (elements.reportBugFactsList) {
    elements.reportBugFactsList.innerHTML = '';
    const facts = Array.isArray(data.bug_facts) ? data.bug_facts : [data.bug_facts];
    facts.slice(0, 3).forEach((fact, idx) => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2 text-xs text-slate-200 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800';
      li.innerHTML = `
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-lime-500/20 text-lime-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
          ${idx + 1}
        </span>
        <span class="leading-relaxed">${fact}</span>
      `;
      elements.reportBugFactsList.appendChild(li);
    });
  }

  // Cleanup Tip
  if (elements.reportCleanupTip) {
    elements.reportCleanupTip.textContent = data.windscreen_cleanup_tip || 'Clean immediately with warm soapy water and a microfiber cloth.';
  }

  // Pre-Splat Image Concept
  if (elements.reportPreSplatPrompt) {
    elements.reportPreSplatPrompt.textContent = data.pre_splat_image_prompt || 'A vibrant insect enjoying sunny roadside air before impact.';
  }

  // Show Report Card
  elements.reportCard.classList.remove('hidden');
  elements.reportCard.scrollIntoView({ behavior: 'smooth' });
}

// --- FIELD JOURNAL / LOCAL STORAGE ---
function loadJournal() {
  try {
    const raw = localStorage.getItem('splatdex_journal');
    state.journal = raw ? JSON.parse(raw) : [];
  } catch (err) {
    state.journal = [];
  }
  renderJournalUI();
}

function saveCurrentReportToLog() {
  if (!state.currentAnalysis) return;
  playSound('click');

  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    bug_name: state.currentAnalysis.bug_name,
    scientific_name: state.currentAnalysis.scientific_name,
    confidence: state.currentAnalysis.confidence,
    eulogy: state.currentAnalysis.eulogy,
    thumbnail: state.currentImageBase64 ? `data:${state.currentImageMime};base64,${state.currentImageBase64}` : null
  };

  state.journal.unshift(entry);
  localStorage.setItem('splatdex_journal', JSON.stringify(state.journal));
  renderJournalUI();
  showToast(`Saved ${entry.bug_name} to Field Journal!`);
}

function renderJournalUI() {
  if (!elements.journalCount) return;
  elements.journalCount.textContent = `${state.journal.length} Logged`;

  if (state.journal.length === 0) {
    elements.journalEmptyState?.classList.remove('hidden');
    elements.journalList?.classList.add('hidden');
    return;
  }

  elements.journalEmptyState?.classList.add('hidden');
  if (elements.journalList) {
    elements.journalList.classList.remove('hidden');
    elements.journalList.innerHTML = '';

    state.journal.forEach(item => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition';
      div.innerHTML = `
        <div class="flex items-center space-x-3 overflow-hidden">
          <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
            ${item.thumbnail ? `<img src="${item.thumbnail}" class="w-full h-full object-cover" alt="Splat">` : '🪲'}
          </div>
          <div class="min-w-0">
            <h5 class="text-xs font-bold text-white font-brand truncate">${item.bug_name}</h5>
            <p class="text-[10px] text-slate-400 italic truncate">${item.scientific_name || item.date}</p>
          </div>
        </div>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          item.confidence === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
        }">
          ${item.confidence}
        </span>
      `;
      elements.journalList.appendChild(div);
    });
  }
}

// Share Report feature
async function handleShareReport() {
  playSound('click');
  if (!state.currentAnalysis) return;

  const shareText = `🔍 SplatDex Windshield Forensics:\nSpecimen: ${state.currentAnalysis.bug_name} (${state.currentAnalysis.scientific_name || 'Unknown'})\nConfidence: ${state.currentAnalysis.confidence}\n"${state.currentAnalysis.eulogy}"\nIdentified with SplatDex!`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `SplatDex: ${state.currentAnalysis.bug_name}`,
        text: shareText
      });
    } catch (err) {
      console.log('Share canceled or unsupported');
    }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareText);
    showToast('Forensic Report copied to clipboard!');
  } else {
    showToast('Sharing not available on this browser.');
  }
}

// Boot up app on DOM ready
document.addEventListener('DOMContentLoaded', init);
