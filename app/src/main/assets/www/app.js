/**
 * SplatDex - Windshield Bug Detective App
 * Vision AI integration with Gemini 3.8 Flash, Capacitor Camera,
 * and 100% Offline Road-Trip Forensic Failsafe Engine.
 */

// Application State
const state = {
  apiKey: '',
  currentImageBase64: null,
  currentImageMime: 'image/jpeg',
  currentAnalysis: null,
  isAnalyzing: false,
  soundEnabled: true,
  forceOfflineMode: false,
  playCrashCam: true,
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

// --- OFFLINE ROADSIDE DETECTIVE LIBRARY (16 COMMON HIGHWAY INSECTS) ---
const OFFLINE_BUG_LIBRARY = [
  {
    id: "june_beetle",
    bug_name: "General June Beetle",
    scientific_name: "Phyllophaga spp.",
    category: "chunky",
    emoji: "🪲",
    color_profile: "green_brown",
    confidence: "High",
    pre_splat_image_prompt: "A clumsy, golden-brown armored June beetle buzzing near porch lights on a warm summer evening.",
    eulogy: "A brave, chunky aviator whose armored carapace met 70 MPH minivan aerodynamics.",
    bug_facts: [
      "June bugs are notoriously terrible pilots and fly like tiny blimps with no steering wheel.",
      "Their thick exoskeletons are made of chitin, the same tough material in lobster and crab claws!",
      "Most June bugs spend 2 to 3 years underground as grubs before flying for just a few weeks."
    ],
    windscreen_cleanup_tip: "Soak the dried chitin with warm soapy water for 3 minutes before wiping to prevent windshield scratches!"
  },
  {
    id: "lovebug",
    bug_name: "Lovebug Road-Trip Duo",
    scientific_name: "Plecia nearctica",
    category: "winged",
    emoji: "❤️",
    color_profile: "red_black",
    confidence: "High",
    pre_splat_image_prompt: "Two black and orange-red lovebugs drifting happily over highway asphalt in Florida.",
    eulogy: "United in life and united on the windshield glass forever.",
    bug_facts: [
      "Lovebugs fly in glued-together pairs during May and September across southern highways.",
      "Their body fluids are mildly acidic and will bake into automotive clear coat under hot sunshine!",
      "They are attracted to hot highway asphalt, engine fumes, and the smell of decomposing grass."
    ],
    windscreen_cleanup_tip: "Clean immediately with a wet dryer sheet or baking soda paste — never let lovebug juice bake in the sun!"
  },
  {
    id: "honeybee",
    bug_name: "Golden Honeybee",
    scientific_name: "Apis mellifera",
    category: "sticky",
    emoji: "🐝",
    color_profile: "yellow",
    confidence: "Medium",
    pre_splat_image_prompt: "A fuzzy golden worker bee laden with bright yellow pollen flying over clover meadows.",
    eulogy: "A sweet pollen collector on her final highway nectar patrol. Rest in wildflower peace.",
    bug_facts: [
      "The yellow splatter stain is actually pure floral pollen harvested by the bee's hairy hind legs!",
      "A worker honeybee visits over 2,000 flowers in a single busy summer day.",
      "Honeybees flap their wings 200 times every second, creating their famous buzzing sound."
    ],
    windscreen_cleanup_tip: "Yellow pollen residue dissolves fast with a 50/50 mix of white vinegar and water."
  },
  {
    id: "moth",
    bug_name: "Velvet Highway Moth",
    scientific_name: "Lymantria dispar",
    category: "winged",
    emoji: "🦋",
    color_profile: "dusty_grey",
    confidence: "High",
    pre_splat_image_prompt: "A fluffy, dusty-winged night moth spiraling toward shining LED headlights.",
    eulogy: "It followed the brightest light on Interstate 80 all the way to the glass.",
    bug_facts: [
      "The chalky grey smudge comes from thousands of microscopic powdery scales covering their wings.",
      "Moths navigate using the light of the moon, which is why headlights completely confuse them!",
      "Some moths have fake owl-eyes painted on their wings to scare off bats and birds."
    ],
    windscreen_cleanup_tip: "Wipe with a dry microfiber cloth first to remove dusty scales, then spray windshield washer fluid."
  },
  {
    id: "dragonfly",
    bug_name: "Electric Blue Dragonfly",
    scientific_name: "Pachydiplax longipennis",
    category: "winged",
    emoji: "⚡",
    color_profile: "blue",
    confidence: "High",
    pre_splat_image_prompt: "A shimmering iridescent blue dragonfly darting over a roadside wetland at top speed.",
    eulogy: "The undisputed stunt pilot of the pond, outmaneuvered only by tempered glass.",
    bug_facts: [
      "Dragonflies can fly backwards, upside down, and hover completely still in mid-air!",
      "They have 30,000 lenses in each eye, giving them nearly 360-degree vision around them.",
      "Dragonflies are among the most successful predators in nature, catching 95% of their targeted prey."
    ],
    windscreen_cleanup_tip: "The thin translucent fluid clears easily with regular wiper fluid and fresh wiper blades."
  },
  {
    id: "cicada",
    bug_name: "Dog-Day Screaming Cicada",
    scientific_name: "Neotibicen canicularis",
    category: "chunky",
    emoji: "📢",
    color_profile: "green_brown",
    confidence: "High",
    pre_splat_image_prompt: "A wide-bodied olive-green cicada vibrating in an oak tree with glassy, vein-covered wings.",
    eulogy: "Spent 17 quiet years underground only to meet our SUV at mile marker 42.",
    bug_facts: [
      "A swarm of male cicadas singing together can reach 100 decibels — as loud as a lawn mower!",
      "Cicadas possess three tiny extra eyes called ocelli on the top of their heads.",
      "Their massive splatter imprint leaves unmistakable diamond-patterned wing vein impressions."
    ],
    windscreen_cleanup_tip: "Use warm water and car wash soap to loosen the heavy grease before turning on wipers."
  },
  {
    id: "green_bottle_fly",
    bug_name: "Emerald Bottle Fly",
    scientific_name: "Lucilia sericata",
    category: "winged",
    emoji: "🪰",
    color_profile: "green_brown",
    confidence: "Medium",
    pre_splat_image_prompt: "A brilliant metallic green bottle fly zipping across a sunny roadside picnic table.",
    eulogy: "Shiny as a jewel, quick as lightning, flattened like a pancake.",
    bug_facts: [
      "That metallic shine isn't paint — it's light reflecting off microscopic microscopic grooves in their armor!",
      "Bottle flies taste food through special sensor receptors on their feet.",
      "Their wings flap over 300 times per second, giving them supreme agility."
    ],
    windscreen_cleanup_tip: "A quick spray of standard blue windshield washer fluid wipes this clean instantly."
  },
  {
    id: "yellowjacket",
    bug_name: "Yellowjacket Stunt Wasp",
    scientific_name: "Vespula maculifrons",
    category: "sticky",
    emoji: "🐝",
    color_profile: "yellow",
    confidence: "High",
    pre_splat_image_prompt: "A striped yellow and black wasp scoping out open soda cans at a highway rest stop.",
    eulogy: "Feared by picnickers everywhere, stopped cold by a Subaru Forester.",
    bug_facts: [
      "Unlike honeybees, wasps can sting multiple times without losing their stinger.",
      "In late summer, yellowjackets develop a massive sweet tooth and seek out sweet fruit and soda.",
      "They build papery nests by chewing wood fibers into fine pulp mixed with saliva."
    ],
    windscreen_cleanup_tip: "Soak with a damp sponge for 60 seconds to soften the sticky sugar-rich fluid."
  },
  {
    id: "grasshopper",
    bug_name: "Carolina Grasshopper",
    scientific_name: "Dissosteira carolina",
    category: "chunky",
    emoji: "🦗",
    color_profile: "green_brown",
    confidence: "High",
    pre_splat_image_prompt: "A large brown and green grasshopper with yellow-rimmed wings springing off roadside clover.",
    eulogy: "One giant leap for bug-kind, one sudden landing on the passenger side window.",
    bug_facts: [
      "Grasshoppers can leap 20 times the length of their body — like a human jumping over a basketball court!",
      "They have ears located on their bellies beneath their wings.",
      "Their greenish fluids come from digested chlorophyll grass juice inside their digestive tract."
    ],
    windscreen_cleanup_tip: "Use bug-sponge mesh or a soft microfiber towel with soapy suds."
  },
  {
    id: "firefly",
    bug_name: "Twinkling Lightning Bug",
    scientific_name: "Photinus pyralis",
    category: "sticky",
    emoji: "✨",
    color_profile: "yellow",
    confidence: "Medium",
    pre_splat_image_prompt: "A soft-bodied firefly lighting up with bright neon green flashes at dusk.",
    eulogy: "A gentle forest lantern that left its final glow on our road-trip windshield.",
    bug_facts: [
      "Fireflies are actually beetles! Their glowing light produces almost 100% light with 0% wasted heat.",
      "Each firefly species blinks in its own secret morse-code flash pattern to find friends.",
      "Their glow comes from a natural chemical reaction between luciferin and oxygen."
    ],
    windscreen_cleanup_tip: "Wipe with water and glass cleaner — firefly residue is soft and cleans up with ease."
  },
  {
    id: "mosquito",
    bug_name: "Highway Mosquito",
    scientific_name: "Culex pipiens",
    category: "winged",
    emoji: "🦟",
    color_profile: "red_black",
    confidence: "Medium",
    pre_splat_image_prompt: "A slender mosquito hovering in search of a roadside campfire.",
    eulogy: "The world's most annoying highway hitchhiker got permanently canceled.",
    bug_facts: [
      "Only female mosquitoes bite; male mosquitoes feed peacefully on sweet plant nectar!",
      "Mosquitoes locate people by sniffing out the carbon dioxide gas in our breath from 75 feet away.",
      "They are attracted to dark-colored clothing and body warmth on humid nights."
    ],
    windscreen_cleanup_tip: "A standard spritz of wiper fluid removes this tiny red micro-dot immediately."
  },
  {
    id: "ladybug",
    bug_name: "Seven-Spotted Ladybug",
    scientific_name: "Coccinella septempunctata",
    category: "chunky",
    emoji: "🐞",
    color_profile: "red_black",
    confidence: "High",
    pre_splat_image_prompt: "A bright red dome beetle with seven polished black spots strolling on a leaf.",
    eulogy: "Good luck charm to gardeners, bad luck encounter on the interstate.",
    bug_facts: [
      "A single ladybug can devour over 5,000 crop-damaging aphids during its lifetime.",
      "When scared, ladybugs can pretend to be dead and release a harmless yellow fluid from their knees!",
      "Their bright red color warns birds that they taste nasty and bitter."
    ],
    windscreen_cleanup_tip: "Clean with regular glass cleaner and paper towels — leaves minimal residue."
  },
  {
    id: "stink_bug",
    bug_name: "Marmorated Stink Bug",
    scientific_name: "Halyomorpha halys",
    category: "chunky",
    emoji: "🛡️",
    color_profile: "green_brown",
    confidence: "Wild Guess",
    pre_splat_image_prompt: "A shield-shaped brown speckled stink bug clinging to a highway toll booth sign.",
    eulogy: "It had the armor of a medieval knight, but unfortunately met modern horsepower.",
    bug_facts: [
      "The shield-shaped body of a stink bug is an ancient natural armor design.",
      "Their defensive odor smells like cilantro or crushed marzipan to ward off predators.",
      "They can fly up to 3 miles in a day searching for fruit orchards."
    ],
    windscreen_cleanup_tip: "Wash off quickly with dish soap and rinse well to prevent any faint aroma."
  },
  {
    id: "mayfly",
    bug_name: "Lakefront Mayfly",
    scientific_name: "Ephemera vulgata",
    category: "winged",
    emoji: "🪶",
    color_profile: "dusty_grey",
    confidence: "High",
    pre_splat_image_prompt: "A delicate pale mayfly with two long wispy tail filaments dancing over a lake highway bridge.",
    eulogy: "Its entire adult lifespan was only 24 hours — it spent the last 2 seconds meeting our wipers.",
    bug_facts: [
      "Adult mayflies have no mouths and cannot eat — their sole life mission is to fly and lay eggs!",
      "Mayflies hatch in swarms so massive they can sometimes show up on weather Doppler radar!",
      "Finding mayflies near lakes is a sign of super clean, unpolluted water."
    ],
    windscreen_cleanup_tip: "Mayfly residue is very watery; simple wiper fluid and a few wiper swipes clean it right up."
  },
  {
    id: "crane_fly",
    bug_name: "Giant Crane Fly (Skeeter Eater)",
    scientific_name: "Tipula oleracea",
    category: "winged",
    emoji: "🕷️",
    color_profile: "dusty_grey",
    confidence: "High",
    pre_splat_image_prompt: "A massive, harmless, spindly-legged crane fly bobbing gracefully near the highway rest stop light.",
    eulogy: "All legs and no brakes. Rest in spindly peace, giant dancing friend.",
    bug_facts: [
      "Despite looking like giant mosquitoes, crane flies do NOT bite humans or animals at all!",
      "Their long legs break off easily if grabbed by predators, allowing them to escape like tricksters.",
      "Their larvae live in damp soil and help break down dead grass and fallen autumn leaves."
    ],
    windscreen_cleanup_tip: "The thin leg residue wipes away cleanly with a dry paper towel."
  },
  {
    id: "water_bug",
    bug_name: "Giant Electric Light Bug",
    scientific_name: "Lethocerus americanus",
    category: "chunky",
    emoji: "🦀",
    color_profile: "green_brown",
    confidence: "Wild Guess",
    pre_splat_image_prompt: "A huge, intimidating 3-inch dark brown water bug stalking minnows in a ditch.",
    eulogy: "The apex predator of roadside ditches met the immovable glass of the family truck.",
    bug_facts: [
      "These giants are also called 'Toe-Biters' and can grow up to 4 inches long!",
      "They can catch and eat small fish, tadpoles, and even tiny baby frogs in ponds.",
      "At night they fly between ponds and are powerfully drawn to glowing gas station floodlights."
    ],
    windscreen_cleanup_tip: "This is a heavy impact! Use warm soapy water and a sponge to fully lift the thick residue."
  }
];

// --- DOM ELEMENTS ---
const elements = {
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
  apiKeyStatus: document.getElementById('apiKeyStatus'),
  settingsModal: document.getElementById('settingsModal'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
  forceOfflineToggle: document.getElementById('forceOfflineToggle'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  networkPill: document.getElementById('networkPill'),
  networkPillText: document.getElementById('networkPillText'),

  openGuideBtn: document.getElementById('openGuideBtn'),
  closeGuideBtn: document.getElementById('closeGuideBtn'),
  guideModal: document.getElementById('guideModal'),
  guideBugList: document.getElementById('guideBugList'),

  snapPhotoBtn: document.getElementById('snapPhotoBtn'),
  cameraInput: document.getElementById('cameraInput'),
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

  failsafeBanner: document.getElementById('failsafeBanner'),
  failsafeReasonText: document.getElementById('failsafeReasonText'),

  errorCard: document.getElementById('errorCard'),
  errorMessage: document.getElementById('errorMessage'),
  dismissErrorBtn: document.getElementById('dismissErrorBtn'),

  reportCard: document.getElementById('reportCard'),
  reportSourceBadge: document.getElementById('reportSourceBadge'),
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
  toast: document.getElementById('toast'),

  // Crash-Cam Elements
  crashCamToggle: document.getElementById('crashCamToggle'),
  crashCamModal: document.getElementById('crashCamModal'),
  crashCamCanvas: document.getElementById('crashCamCanvas'),
  skipCrashCamBtn: document.getElementById('skipCrashCamBtn'),
  crashCamSubtitle: document.getElementById('crashCamSubtitle')
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
  loadSettings();
  loadJournal();
  attachEventListeners();
  renderFieldGuide('all');
  updateNetworkStatus();

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  checkEnvironment();
}

function checkEnvironment() {
  const isCapacitor = !!window.Capacitor?.isNativePlatform?.();
  console.log(`[SplatDex] Running in ${isCapacitor ? 'Capacitor Native' : 'Browser/WebView'} mode. Offline library loaded with ${OFFLINE_BUG_LIBRARY.length} species.`);
}

function updateNetworkStatus() {
  if (!elements.networkPill) return;
  const isOnline = navigator.onLine && !state.forceOfflineMode;
  if (isOnline) {
    elements.networkPill.className = 'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (elements.networkPillText) elements.networkPillText.textContent = state.apiKey ? 'AI Online + Offline Ready' : 'Road-Trip Offline Ready';
  } else {
    elements.networkPill.className = 'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30';
    if (elements.networkPillText) elements.networkPillText.textContent = '100% Offline Road-Trip Mode';
  }
}

function loadSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramKey = urlParams.get('key');
  const storedKey = localStorage.getItem('gemini_api_key');
  const storedOffline = localStorage.getItem('splatdex_force_offline');

  if (paramKey) {
    state.apiKey = paramKey;
    localStorage.setItem('gemini_api_key', paramKey);
  } else if (storedKey) {
    state.apiKey = storedKey;
  }

  if (storedOffline === 'true') {
    state.forceOfflineMode = true;
    if (elements.forceOfflineToggle) elements.forceOfflineToggle.checked = true;
  }

  const storedCrashCam = localStorage.getItem('splatdex_crash_cam');
  if (storedCrashCam !== null) {
    state.playCrashCam = storedCrashCam === 'true';
  } else {
    state.playCrashCam = true;
  }
  if (elements.crashCamToggle) {
    elements.crashCamToggle.checked = state.playCrashCam;
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
      <span class="text-emerald-400 font-semibold">Gemini API Key active (${state.apiKey.substring(0, 6)}••••)</span>
    `;
  } else {
    elements.apiKeyStatus.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-sky-400"></span>
      <span class="text-sky-300">No API key required — Road-Trip Offline Library is active!</span>
    `;
  }
}

function attachEventListeners() {
  // Sound FX
  elements.soundToggleBtn?.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    elements.soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    playSound('click');
    showToast(state.soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted');
  });

  // Settings
  elements.openSettingsBtn?.addEventListener('click', () => {
    playSound('click');
    elements.settingsModal?.classList.remove('hidden');
  });
  elements.closeSettingsBtn?.addEventListener('click', () => {
    playSound('click');
    elements.settingsModal?.classList.add('hidden');
  });
  elements.settingsModal?.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) elements.settingsModal.classList.add('hidden');
  });

  // Field Guide Modal
  elements.openGuideBtn?.addEventListener('click', () => {
    playSound('click');
    elements.guideModal?.classList.remove('hidden');
  });
  elements.closeGuideBtn?.addEventListener('click', () => {
    playSound('click');
    elements.guideModal?.classList.add('hidden');
  });
  elements.guideModal?.addEventListener('click', (e) => {
    if (e.target === elements.guideModal) elements.guideModal.classList.add('hidden');
  });

  // Guide Category Filters
  document.querySelectorAll('.guide-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playSound('click');
      document.querySelectorAll('.guide-filter-btn').forEach(b => {
        b.className = 'guide-filter-btn text-xs px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-brand hover:text-white active:scale-95 transition';
      });
      e.currentTarget.className = 'guide-filter-btn text-xs px-3 py-1 rounded-lg bg-lime-500 text-slate-950 font-bold font-brand active:scale-95 transition';
      const filter = e.currentTarget.getAttribute('data-filter');
      renderFieldGuide(filter);
    });
  });

  // Toggle API Key visibility
  elements.toggleKeyVisibility?.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.toggleKeyVisibility.textContent = isPassword ? 'Hide' : 'Show';
  });

  // Force Offline Mode toggle
  elements.forceOfflineToggle?.addEventListener('change', (e) => {
    state.forceOfflineMode = e.target.checked;
    localStorage.setItem('splatdex_force_offline', state.forceOfflineMode ? 'true' : 'false');
    updateNetworkStatus();
    playSound('click');
    showToast(state.forceOfflineMode ? 'Offline Road-Trip Mode Engaged' : 'Online AI Mode Enabled');
  });

  // Funny Windshield Crash-Cam Replay toggle
  elements.crashCamToggle?.addEventListener('change', (e) => {
    state.playCrashCam = e.target.checked;
    localStorage.setItem('splatdex_crash_cam', state.playCrashCam ? 'true' : 'false');
    playSound('click');
    showToast(state.playCrashCam ? 'Crash-Cam Animation On' : 'Crash-Cam Animation Off');
  });

  // Save Settings
  elements.saveApiKeyBtn?.addEventListener('click', () => {
    const key = elements.apiKeyInput.value.trim();
    state.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    state.forceOfflineMode = !!elements.forceOfflineToggle?.checked;
    localStorage.setItem('splatdex_force_offline', state.forceOfflineMode ? 'true' : 'false');
    if (elements.crashCamToggle) {
      state.playCrashCam = elements.crashCamToggle.checked;
      localStorage.setItem('splatdex_crash_cam', state.playCrashCam ? 'true' : 'false');
    }

    updateApiKeyStatusUI();
    updateNetworkStatus();
    elements.settingsModal.classList.add('hidden');
    playSound('success');
    showToast('Settings saved!');
  });

  // Dismiss Error
  elements.dismissErrorBtn?.addEventListener('click', () => {
    elements.errorCard?.classList.add('hidden');
  });

  // Camera & Upload Triggers
  elements.snapPhotoBtn?.addEventListener('click', handleCameraCapture);
  elements.cameraInput?.addEventListener('change', handleFileUpload);
  elements.fileInput?.addEventListener('change', handleFileUpload);

  // Sample Buttons
  document.querySelectorAll('.sample-splat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sampleType = e.currentTarget.getAttribute('data-sample');
      loadSampleSplatter(sampleType);
    });
  });

  // Forensic Analysis Trigger
  elements.analyzeBtn?.addEventListener('click', startForensicInvestigation);

  // Journal and Sharing
  elements.saveToLogBtn?.addEventListener('click', saveCurrentReportToLog);
  elements.shareReportBtn?.addEventListener('click', handleShareReport);
}

// --- IMAGE CAPTURE ---
async function handleCameraCapture() {
  playSound('click');
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
        return;
      }
    } catch (err) {
      console.warn('Capacitor camera failed or canceled, falling back to camera input:', err);
      if (err.message === 'User cancelled photos app') {
        return;
      }
    }
  }

  // Fallback to camera input with capture="environment" for direct Camera app launch
  if (elements.cameraInput) {
    elements.cameraInput.click();
  } else if (elements.fileInput) {
    elements.fileInput.click();
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

  if (elements.analyzeBtn) elements.analyzeBtn.disabled = false;
  elements.reportCard?.classList.add('hidden');
  elements.errorCard?.classList.add('hidden');
  elements.failsafeBanner?.classList.add('hidden');

  // Trigger 2-second funny windshield crash-cam animation immediately upon selecting a photo
  if (state.playCrashCam) {
    playCrashCamAnimation();
  }
}

// --- SAMPLE GENERATOR ---
function loadSampleSplatter(type) {
  playSound('splat');
  const canvas = elements.splatterCanvas;
  if (!canvas) return;
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, 400, 300);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(250, 300);
  ctx.stroke();

  const centerX = 200;
  const centerY = 150;

  if (type === 'june_beetle') {
    drawSplatter(ctx, centerX, centerY, 55, '#3f6212', '#65a30d', 14);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(centerX - 12, centerY - 15, 16, 7, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(centerX + 18, centerY + 8, 14, 6, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'lovebug') {
    drawSplatter(ctx, centerX - 25, centerY - 10, 35, '#1e1b4b', '#475569', 10);
    drawSplatter(ctx, centerX + 20, centerY + 10, 32, '#991b1b', '#ef4444', 9);
  } else if (type === 'moth') {
    drawSplatter(ctx, centerX, centerY, 60, '#78716c', '#d6d3d1', 18);
    ctx.fillStyle = 'rgba(214, 211, 209, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
    ctx.fill();
  } else {
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
  elements.failsafeBanner?.classList.add('hidden');

  // Trigger funny windshield crash-cam animation on sample test specimen selection
  if (state.playCrashCam) {
    playCrashCamAnimation();
  }
}

function drawSplatter(ctx, x, y, radius, colorDark, colorLight, numDrops) {
  const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
  grad.addColorStop(0, colorLight);
  grad.addColorStop(0.8, colorDark);
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

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

    ctx.strokeStyle = colorDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius * 0.5), y + Math.sin(angle) * (radius * 0.5));
    ctx.lineTo(dropX, dropY);
    ctx.stroke();
  }
}

// --- ONBOARD COMPUTER COLORIMETRY SENSOR (OFFLINE ANALYZER) ---
async function analyzeImagePixelsColorimetry() {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        const targetDim = 100;
        offCanvas.width = targetDim;
        offCanvas.height = targetDim;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(img, 0, 0, targetDim, targetDim);

        const imgData = offCtx.getImageData(0, 0, targetDim, targetDim).data;
        let totalR = 0, totalG = 0, totalB = 0, counted = 0;
        let redDominant = 0, greenDominant = 0, yellowDominant = 0, blueDominant = 0, greyScale = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const brightness = (r + g + b) / 3;

          // Skip windshield black/dark tint borders and bright glass glare
          if (brightness > 25 && brightness < 235) {
            totalR += r;
            totalG += g;
            totalB += b;
            counted++;

            if (g > r * 1.15 && g > b * 1.15) {
              greenDominant++;
            } else if (r > g * 1.15 && r > b * 1.15) {
              redDominant++;
            } else if (r > 120 && g > 110 && b < 100) {
              yellowDominant++;
            } else if (b > r * 1.15 && b > g * 1.1) {
              blueDominant++;
            } else if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
              greyScale++;
            }
          }
        }

        // Determine dominant color profile
        let matchedColor = 'green_brown';
        const scores = [
          { color: 'green_brown', val: greenDominant },
          { color: 'red_black', val: redDominant },
          { color: 'yellow', val: yellowDominant },
          { color: 'dusty_grey', val: greyScale },
          { color: 'blue', val: blueDominant }
        ].sort((a, b) => b.val - a.val);

        if (scores[0].val > 5) {
          matchedColor = scores[0].color;
        }

        resolve({
          matchedColor,
          avgR: counted ? totalR / counted : 120,
          avgG: counted ? totalG / counted : 120,
          avgB: counted ? totalB / counted : 120
        });
      };
      img.onerror = () => {
        resolve({ matchedColor: 'green_brown' });
      };
      img.src = `data:${state.currentImageMime};base64,${state.currentImageBase64}`;
    } catch (e) {
      resolve({ matchedColor: 'green_brown' });
    }
  });
}

// --- FUNNY WINDSHIELD CRASH-CAM ANIMATION & SYNTHESIS ---
let crashCamAnimationId = null;

function playCrashCamSound(type) {
  if (!state.soundEnabled) return () => {};
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    if (type === 'buzz') {
      // Escalating doppler mosquito / fly buzz with tremolo
      const osc = audioCtx.createOscillator();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.75);

      lfo.frequency.setValueAtTime(32, now); // flutter
      lfoGain.gain.setValueAtTime(0.04, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.7);

      lfo.connect(lfoGain.gain);
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      lfo.start(now);
      osc.start(now);

      return () => {
        try {
          const stopTime = audioCtx.currentTime;
          gain.gain.linearRampToValueAtTime(0.001, stopTime + 0.05);
          osc.stop(stopTime + 0.06);
          lfo.stop(stopTime + 0.06);
        } catch (_) {}
      };
    } else if (type === 'splat') {
      // Comic Cartoon Splat: Low bass thud + noise wet slap + comical boing
      const thudOsc = audioCtx.createOscillator();
      const thudGain = audioCtx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(160, now);
      thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      thudGain.gain.setValueAtTime(0.45, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      thudOsc.connect(thudGain);
      thudGain.connect(audioCtx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.25);

      const squishOsc = audioCtx.createOscillator();
      const squishGain = audioCtx.createGain();
      squishOsc.type = 'sawtooth';
      squishOsc.frequency.setValueAtTime(450, now);
      squishOsc.frequency.linearRampToValueAtTime(120, now + 0.2);
      squishGain.gain.setValueAtTime(0.2, now);
      squishGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      squishOsc.connect(squishGain);
      squishGain.connect(audioCtx.destination);
      squishOsc.start(now);
      squishOsc.stop(now + 0.2);

      const boingOsc = audioCtx.createOscillator();
      const boingGain = audioCtx.createGain();
      boingOsc.type = 'sine';
      boingOsc.frequency.setValueAtTime(260, now + 0.1);
      boingOsc.frequency.exponentialRampToValueAtTime(540, now + 0.35);
      boingGain.gain.setValueAtTime(0.18, now + 0.1);
      boingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      boingOsc.connect(boingGain);
      boingGain.connect(audioCtx.destination);
      boingOsc.start(now + 0.1);
      boingOsc.stop(now + 0.38);
    } else if (type === 'squeak') {
      // Windshield Wiper Squeegee Rubber Chirp
      const squeakOsc = audioCtx.createOscillator();
      const squeakGain = audioCtx.createGain();
      squeakOsc.type = 'sine';
      squeakOsc.frequency.setValueAtTime(1800, now);
      squeakOsc.frequency.linearRampToValueAtTime(2600, now + 0.08);
      squeakOsc.frequency.linearRampToValueAtTime(1400, now + 0.18);
      squeakGain.gain.setValueAtTime(0.12, now);
      squeakGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      squeakOsc.connect(squeakGain);
      squeakGain.connect(audioCtx.destination);
      squeakOsc.start(now);
      squeakOsc.stop(now + 0.19);
    }
  } catch (e) {
    console.debug('CrashCam audio err', e);
  }
  return () => {};
}

function playCrashCamAnimation(onComplete) {
  if (!elements.crashCamModal || !elements.crashCamCanvas) {
    if (onComplete) onComplete();
    return;
  }

  const canvas = elements.crashCamCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;   // 480
  const height = canvas.height; // 360

  elements.crashCamModal.classList.remove('hidden');
  if (elements.crashCamSubtitle) {
    elements.crashCamSubtitle.textContent = 'Incoming high-speed insect in flight trajectory! 🪰💨';
  }

  let isCompleted = false;
  let buzzStopper = playCrashCamSound('buzz');
  let phaseTriggeredSplat = false;
  let phaseTriggeredSqueak = false;

  const finish = () => {
    if (isCompleted) return;
    isCompleted = true;
    if (crashCamAnimationId) {
      cancelAnimationFrame(crashCamAnimationId);
      crashCamAnimationId = null;
    }
    if (buzzStopper) {
      buzzStopper();
      buzzStopper = null;
    }
    elements.crashCamModal.classList.add('hidden');
    canvas.classList.remove('shake-screen');
    if (onComplete) onComplete();
  };

  // Wire skip button
  const handleSkip = (e) => {
    e?.stopPropagation();
    finish();
  };
  elements.skipCrashCamBtn?.addEventListener('click', handleSkip, { once: true });

  const startTime = performance.now();
  const totalDuration = 2000; // 2.0-second 'bug hitting glass' sequence

  // Generate random splatter droplets once for consistent splash drawing
  const splatterDroplets = [];
  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 / 24) * i + (Math.random() - 0.5) * 0.3;
    const distance = 40 + Math.random() * 85;
    const radius = 3 + Math.random() * 9;
    splatterDroplets.push({ angle, distance, radius });
  }

  function frame(timestamp) {
    if (isCompleted) return;
    const elapsed = timestamp - startTime;

    // --- DRAW SCENE ---
    ctx.clearRect(0, 0, width, height);

    // 1. Sky & Horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, 160);

    // Distant highway mountains / hills
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(80, 130);
    ctx.lineTo(160, 150);
    ctx.lineTo(240, 135);
    ctx.lineTo(340, 155);
    ctx.lineTo(420, 128);
    ctx.lineTo(480, 160);
    ctx.closePath();
    ctx.fill();

    // 2. Highway Asphalt Road with perspective
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(215, 160);
    ctx.lineTo(265, 160);
    ctx.lineTo(480, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Road verge / desert borders
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(215, 160);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(480, 160);
    ctx.lineTo(265, 160);
    ctx.lineTo(480, 360);
    ctx.closePath();
    ctx.fill();

    // Highway moving yellow dashed center line (scrolling down fast)
    const stripeProgress = (elapsed % 250) / 250;
    for (let i = 0; i < 5; i++) {
      const stripeFrac = ((i + stripeProgress) / 5);
      const stripeY = 160 + stripeFrac * stripeFrac * 200;
      const stripeH = Math.max(4, stripeFrac * 28);
      const stripeW = Math.max(2, stripeFrac * 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(240 - stripeW / 2, stripeY, stripeW, stripeH);
    }

    // Car hood / dashboard at bottom
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(0, 335);
    ctx.quadraticCurveTo(240, 310, 480, 335);
    ctx.lineTo(480, 360);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 335);
    ctx.quadraticCurveTo(240, 310, 480, 335);
    ctx.stroke();

    // Windshield reflection diagonal glare lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(0, 180);
    ctx.moveTo(220, 0);
    ctx.lineTo(120, 300);
    ctx.moveTo(380, 0);
    ctx.lineTo(260, 360);
    ctx.stroke();

    // --- PHASE 1: BUG APPROACHING (0 to 750ms) ---
    if (elapsed < 750) {
      const progress = elapsed / 750;
      const ease = progress * progress * progress; // zooms towards camera exponentially
      const bugSize = 5 + ease * 125;
      const bugX = 240 + Math.sin(elapsed * 0.02) * 18 * (1 - progress);
      const bugY = 165 + ease * 25;
      const wingFlap = Math.sin(elapsed * 0.06);

      ctx.save();
      ctx.translate(bugX, bugY);

      // Flapping translucent cartoon wings
      ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(1, bugSize * 0.02);

      // Left wing
      ctx.save();
      ctx.rotate(-0.4 - wingFlap * 0.6);
      ctx.beginPath();
      ctx.ellipse(-bugSize * 0.45, -bugSize * 0.25, bugSize * 0.55, bugSize * 0.25, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right wing
      ctx.save();
      ctx.rotate(0.4 + wingFlap * 0.6);
      ctx.beginPath();
      ctx.ellipse(bugSize * 0.45, -bugSize * 0.25, bugSize * 0.55, bugSize * 0.25, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Bug Body (Chubby striped green/amber beetle with little legs)
      ctx.fillStyle = '#65a30d'; // lime green
      ctx.beginPath();
      ctx.ellipse(0, 0, bugSize * 0.38, bugSize * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, bugSize * 0.04);
      ctx.strokeStyle = '#14532d';
      ctx.stroke();

      // Stripes on shell
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = Math.max(1, bugSize * 0.03);
      ctx.beginPath();
      ctx.moveTo(-bugSize * 0.25, 0);
      ctx.lineTo(bugSize * 0.25, 0);
      ctx.moveTo(-bugSize * 0.2, bugSize * 0.12);
      ctx.lineTo(bugSize * 0.2, bugSize * 0.12);
      ctx.stroke();

      // Flailing antennae
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = Math.max(1, bugSize * 0.025);
      ctx.beginPath();
      ctx.moveTo(-bugSize * 0.15, -bugSize * 0.25);
      ctx.lineTo(-bugSize * 0.35, -bugSize * 0.55 + Math.sin(elapsed * 0.04) * 4);
      ctx.moveTo(bugSize * 0.15, -bugSize * 0.25);
      ctx.lineTo(bugSize * 0.35, -bugSize * 0.55 - Math.sin(elapsed * 0.04) * 4);
      ctx.stroke();

      // Googly Eyes (Wide with shock as it gets closer!)
      const eyeR = bugSize * 0.14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-bugSize * 0.15, -bugSize * 0.1, eyeR, 0, Math.PI * 2);
      ctx.arc(bugSize * 0.15, -bugSize * 0.1, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Panicked pupils
      ctx.fillStyle = '#000000';
      const pupilShift = progress > 0.7 ? 0 : Math.sin(elapsed * 0.03) * 2;
      ctx.beginPath();
      ctx.arc(-bugSize * 0.15 + pupilShift, -bugSize * 0.1, eyeR * 0.45, 0, Math.PI * 2);
      ctx.arc(bugSize * 0.15 - pupilShift, -bugSize * 0.1, eyeR * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Wide open screaming mouth when close
      if (progress > 0.45) {
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.ellipse(0, bugSize * 0.14, bugSize * 0.14, bugSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.fillRect(-bugSize * 0.04, bugSize * 0.04, bugSize * 0.08, bugSize * 0.04);

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-bugSize * 0.42, -bugSize * 0.3, bugSize * 0.05, 0, Math.PI * 2);
        ctx.arc(bugSize * 0.42, -bugSize * 0.3, bugSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // --- PHASE 2 & 3: IMPACT SPLATTER (750ms onwards) ---
    if (elapsed >= 750) {
      if (!phaseTriggeredSplat) {
        phaseTriggeredSplat = true;
        if (buzzStopper) {
          buzzStopper();
          buzzStopper = null;
        }
        playCrashCamSound('splat');
        canvas.classList.add('shake-screen');
        setTimeout(() => canvas.classList.remove('shake-screen'), 350);
        if (elements.crashCamSubtitle) {
          elements.crashCamSubtitle.textContent = '💥 KAPOW! Direct impact on safety glass!';
        }
      }

      const impactElapsed = elapsed - 750;
      const splashProgress = Math.min(1, impactElapsed / 250);

      const impactX = 240;
      const impactY = 190;
      const maxSplatterR = 85;
      const currentSplatterR = maxSplatterR * (0.4 + splashProgress * 0.6);

      // Glass spiderweb cracks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let r = 25; r <= 80; r += 25) {
        const crackR = r * splashProgress;
        for (let a = 0; a < Math.PI * 2; a += 0.5) {
          const cx = impactX + Math.cos(a) * (crackR + (a % 2 === 0 ? 5 : -4));
          const cy = impactY + Math.sin(a) * (crackR + (a % 2 === 0 ? -4 : 6));
          if (a === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.closePath();
      }
      const fractureAngles = [0.2, 0.7, 1.4, 2.1, 2.8, 3.5, 4.3, 5.2, 5.9];
      fractureAngles.forEach((angle) => {
        const len = (90 + (angle * 17) % 30) * splashProgress;
        ctx.moveTo(impactX, impactY);
        const midX = impactX + Math.cos(angle) * (len * 0.5) + (angle % 2 ? 6 : -6);
        const midY = impactY + Math.sin(angle) * (len * 0.5) + (angle % 2 ? -6 : 6);
        const endX = impactX + Math.cos(angle) * len;
        const endY = impactY + Math.sin(angle) * len;
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
      });
      ctx.stroke();

      // Slime Splatter (Juicy bright neon-lime green with golden-amber gooey center)
      const grad = ctx.createRadialGradient(impactX, impactY, 8, impactX, impactY, currentSplatterR);
      grad.addColorStop(0, '#facc15');
      grad.addColorStop(0.4, '#84cc16');
      grad.addColorStop(0.85, '#4d7c0f');
      grad.addColorStop(1, 'rgba(77, 124, 15, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(impactX, impactY, currentSplatterR, 0, Math.PI * 2);
      ctx.fill();

      // Viscous droplet tentacles flying outward
      ctx.fillStyle = '#84cc16';
      splatterDroplets.forEach(drop => {
        const dropDist = drop.distance * splashProgress;
        const dx = impactX + Math.cos(drop.angle) * dropDist;
        const dy = impactY + Math.sin(drop.angle) * dropDist;
        ctx.beginPath();
        ctx.arc(dx, dy, drop.radius * splashProgress, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(impactX + Math.cos(drop.angle) * (currentSplatterR * 0.3), impactY + Math.sin(drop.angle) * (currentSplatterR * 0.3));
        ctx.lineTo(dx, dy);
        ctx.stroke();
      });

      // Squished bug remnant bits
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.ellipse(impactX - 35, impactY - 18, 24 * splashProgress, 10 * splashProgress, -0.4, 0, Math.PI * 2);
      ctx.ellipse(impactX + 38, impactY - 12, 22 * splashProgress, 9 * splashProgress, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Two comical X eyes stuck on glass
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(impactX - 18, impactY - 12, 10, 0, Math.PI * 2);
      ctx.arc(impactX + 18, impactY - 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      [-18, 18].forEach(eyeX => {
        ctx.beginPath();
        ctx.moveTo(impactX + eyeX - 4, impactY - 12 - 4);
        ctx.lineTo(impactX + eyeX + 4, impactY - 12 + 4);
        ctx.moveTo(impactX + eyeX + 4, impactY - 12 - 4);
        ctx.lineTo(impactX + eyeX - 4, impactY - 12 + 4);
        ctx.stroke();
      });

      // Comic Book "SPLAT!" burst banner (visible during impact phase)
      if (impactElapsed < 600) {
        ctx.save();
        ctx.translate(impactX, impactY - 55);
        ctx.rotate(-0.12);

        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const spikes = 12;
        for (let s = 0; s < spikes * 2; s++) {
          const r = s % 2 === 0 ? 46 : 28;
          const sa = (Math.PI / spikes) * s;
          const sx = Math.cos(sa) * r;
          const sy = Math.sin(sa) * r;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 22px "Bungee", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#dc2626';
        ctx.fillText('SPLAT!', 0, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeText('SPLAT!', 0, 0);
        ctx.restore();
      }

      // --- PHASE 3: WINDSHIELD WIPER BLADE SWEEP (1350ms onwards) ---
      if (elapsed >= 1350) {
        if (!phaseTriggeredSqueak) {
          phaseTriggeredSqueak = true;
          playCrashCamSound('squeak');
          if (elements.crashCamSubtitle) {
            elements.crashCamSubtitle.textContent = '🧽 Windshield wiper squeegeeing evidence...';
          }
        }

        const wiperElapsed = elapsed - 1350;
        const wiperProgress = Math.min(1, wiperElapsed / 550);
        const wiperAngle = 0.35 + wiperProgress * 0.95;

        const pivotX = 410;
        const pivotY = 360;
        const wiperLength = 260;
        const tipX = pivotX - Math.cos(wiperAngle) * wiperLength;
        const tipY = pivotY - Math.sin(wiperAngle) * wiperLength;

        // Draw clear wiped arc over splatter
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.arc(pivotX, pivotY, wiperLength, Math.PI - wiperAngle, Math.PI - 0.35, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fill();
        ctx.restore();

        // Draw Wiper Arm & Rubber Blade
        ctx.save();
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        const perpX = Math.sin(wiperAngle) * 35;
        const perpY = -Math.cos(wiperAngle) * 35;
        ctx.beginPath();
        ctx.moveTo(tipX - perpX, tipY - perpY);
        ctx.lineTo(tipX + perpX, tipY + perpY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let w = -25; w <= 25; w += 10) {
          ctx.beginPath();
          ctx.arc(tipX + (perpX * w / 35), tipY + (perpY * w / 35), 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Check completion of 2-second sequence
    if (elapsed >= totalDuration) {
      if (elements.crashCamSubtitle) {
        elements.crashCamSubtitle.textContent = '🔬 Evidence secured! Ready for forensic scan...';
      }
      setTimeout(finish, 100);
      return;
    }

    crashCamAnimationId = requestAnimationFrame(frame);
  }

  crashCamAnimationId = requestAnimationFrame(frame);
}

// --- COMPLETE FORENSIC INVESTIGATION WITH FAILSAFE FALLBACK ---
async function startForensicInvestigation() {
  if (!state.currentImageBase64) {
    showError('No splatter image loaded. Please take a photo or select an image first.');
    return;
  }

  // If crash cam animation is still active from photo selection, finish it immediately
  if (crashCamAnimationId && elements.skipCrashCamBtn) {
    elements.skipCrashCamBtn.click();
  }

  setAnalyzingState(true);
  playSound('scan');

  // Check if offline mode is explicitly requested or device is without internet
  const isNetworkOffline = !navigator.onLine;
  const isForcedOffline = state.forceOfflineMode;
  const hasNoApiKey = !state.apiKey || state.apiKey.trim().length < 5;

  if (isForcedOffline || isNetworkOffline || hasNoApiKey) {
    let reason = "Road-Trip Offline Mode";
    if (isNetworkOffline) reason = "No Cellular Signal (Dead Zone)";
    else if (hasNoApiKey) reason = "Onboard Detective Mode (No Key Needed)";

    console.log(`[SplatDex Failsafe] Directing to onboard offline forensic library: ${reason}`);
    await executeOfflineAnalysis(reason);
    setAnalyzingState(false);
    return;
  }

  // Attempt Cloud Vision AI with timeout failsafe
  try {
    const report = await fetchGeminiVisionWithTimeout(8500); // 8.5 second timeout for highway dead zones
    state.currentAnalysis = report;
    renderForensicReport(report, 'cloud');
    playSound('success');
    showToast(`Identified: ${report.bug_name}!`);
  } catch (apiError) {
    console.warn('[SplatDex Failsafe Activated] Vision AI API failed or timed out:', apiError.message);
    const friendlyReason = `Network dead zone (${apiError.message.substring(0, 45)}) — Onboard Lab engaged!`;
    await executeOfflineAnalysis(friendlyReason);
  } finally {
    setAnalyzingState(false);
  }
}

// Fetch Gemini with AbortController timeout & model fallback
async function fetchGeminiVisionWithTimeout(timeoutMs) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash'];
  let lastError = null;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: "Forensic analysis request: Identify this windshield bug splatter specimen on the car window." },
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

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(state.apiKey.trim())}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.error?.message || `HTTP ${response.status}`;
        lastError = new Error(msg);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from model');

      return JSON.parse(rawText);
    } catch (err) {
      clearTimeout(timer);
      lastError = err.name === 'AbortError' ? new Error('Network timeout (weak highway cellular signal)') : err;
    }
  }

  throw lastError || new Error('All cloud AI models unreachable');
}

// Execute the Onboard Offline Library Matching
async function executeOfflineAnalysis(reason) {
  // Let the kid-friendly scanning progress animation run for 1.2 seconds for great feedback
  await new Promise(r => setTimeout(r, 1200));

  // Run pixel colorimetry to pick the most accurate bug in the library
  const pixelAnalysis = await analyzeImagePixelsColorimetry();

  // Filter candidates matching color profile
  const candidates = OFFLINE_BUG_LIBRARY.filter(b => b.color_profile === pixelAnalysis.matchedColor);
  const pool = candidates.length > 0 ? candidates : OFFLINE_BUG_LIBRARY;

  // Pick candidate
  const chosenBug = pool[Math.floor(Math.random() * pool.length)];

  const offlineReport = {
    bug_name: chosenBug.bug_name,
    scientific_name: chosenBug.scientific_name,
    confidence: chosenBug.confidence || "High",
    pre_splat_image_prompt: chosenBug.pre_splat_image_prompt,
    eulogy: chosenBug.eulogy,
    bug_facts: chosenBug.bug_facts,
    windscreen_cleanup_tip: chosenBug.windscreen_cleanup_tip,
    emoji: chosenBug.emoji
  };

  state.currentAnalysis = offlineReport;
  renderForensicReport(offlineReport, 'offline', reason);
  playSound('success');
  showToast(`Identified (Offline): ${offlineReport.bug_name}!`);
}

// Update UI during AI scanning
function setAnalyzingState(isScanning) {
  state.isAnalyzing = isScanning;
  if (elements.analyzeBtn) elements.analyzeBtn.disabled = isScanning;

  if (isScanning) {
    elements.scanningBeam?.classList.remove('hidden');
    elements.analysisProgressCard?.classList.remove('hidden');
    elements.reportCard?.classList.add('hidden');
    elements.errorCard?.classList.add('hidden');
    elements.failsafeBanner?.classList.add('hidden');

    if (elements.analyzeBtnText) elements.analyzeBtnText.textContent = 'Analyzing Forensic Clues...';
    if (elements.analyzeBtnIcon) elements.analyzeBtnIcon.textContent = '⏳';

    const stages = [
      { text: "Scanning glass splatter contour...", progress: "25%" },
      { text: "Sampling fluid colorimetry & wing shards...", progress: "55%" },
      { text: "Matching against SplatDex Roadside Database...", progress: "85%" },
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
    }, 450);

  } else {
    elements.scanningBeam?.classList.add('hidden');
    elements.analysisProgressCard?.classList.add('hidden');
    if (elements.analyzeBtnText) elements.analyzeBtnText.textContent = 'Run Splat Forensics';
    if (elements.analyzeBtnIcon) elements.analyzeBtnIcon.textContent = '🔎';
  }
}

function showError(msg) {
  if (elements.errorMessage) elements.errorMessage.textContent = msg;
  elements.errorCard?.classList.remove('hidden');
  elements.errorCard?.scrollIntoView({ behavior: 'smooth' });
}

// --- RENDER FORENSIC REPORT ---
function renderForensicReport(data, source = 'cloud', fallbackReason = null) {
  if (!elements.reportCard) return;

  // Source Badge & Failsafe Notification
  if (source === 'offline') {
    if (elements.reportSourceBadge) {
      elements.reportSourceBadge.innerHTML = '<span>🚗</span> Onboard Roadside Lab (100% Offline)';
      elements.reportSourceBadge.className = 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30';
    }
    if (fallbackReason && elements.failsafeBanner && elements.failsafeReasonText) {
      elements.failsafeReasonText.textContent = `${fallbackReason}`;
      elements.failsafeBanner.classList.remove('hidden');
    }
  } else {
    if (elements.reportSourceBadge) {
      elements.reportSourceBadge.innerHTML = '<span>🛰️</span> Cloud Vision AI (Gemini 3.8 Flash)';
      elements.reportSourceBadge.className = 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/20';
    }
    elements.failsafeBanner?.classList.add('hidden');
  }

  // Bug Name & Scientific Name
  if (elements.reportBugName) elements.reportBugName.textContent = data.bug_name || 'Mysterious Highway Specimen';
  if (elements.reportScientificName) elements.reportScientificName.textContent = data.scientific_name ? `(${data.scientific_name})` : '';

  // Bug Emoji
  let emoji = data.emoji || '🪲';
  if (!data.emoji) {
    const nameLower = (data.bug_name || '').toLowerCase();
    if (nameLower.includes('bee') || nameLower.includes('wasp')) emoji = '🐝';
    else if (nameLower.includes('butterfly') || nameLower.includes('moth')) emoji = '🦋';
    else if (nameLower.includes('dragonfly')) emoji = '⚡';
    else if (nameLower.includes('fly') || nameLower.includes('mosquito')) emoji = '🪰';
    else if (nameLower.includes('lovebug')) emoji = '❤️';
    else if (nameLower.includes('grasshopper') || nameLower.includes('cricket')) emoji = '🦗';
    else if (nameLower.includes('ladybug')) emoji = '🐞';
    else if (nameLower.includes('cicada')) emoji = '📢';
    else if (nameLower.includes('firefly') || nameLower.includes('lightning')) emoji = '✨';
  }
  if (elements.reportBugEmoji) elements.reportBugEmoji.textContent = emoji;

  // Confidence Badge
  if (elements.confidenceBadge) {
    const conf = data.confidence || 'High';
    elements.confidenceBadge.textContent = `${conf} Confidence`;

    if (conf === 'High') {
      elements.confidenceBadge.className = 'flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold font-brand bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    } else if (conf === 'Medium') {
      elements.confidenceBadge.className = 'flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold font-brand bg-amber-500/20 text-amber-300 border border-amber-500/40';
    } else {
      elements.confidenceBadge.className = 'flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold font-brand bg-purple-500/20 text-purple-300 border border-purple-500/40';
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

  // Windscreen Cleanup Tip
  if (elements.reportCleanupTip) {
    elements.reportCleanupTip.textContent = data.windscreen_cleanup_tip || 'Clean immediately with warm soapy water and a microfiber cloth.';
  }

  // Pre-Splat Image Concept
  if (elements.reportPreSplatPrompt) {
    elements.reportPreSplatPrompt.textContent = data.pre_splat_image_prompt || 'A vibrant insect enjoying sunny roadside air before impact.';
  }

  elements.reportCard.classList.remove('hidden');
  elements.reportCard.scrollIntoView({ behavior: 'smooth' });
}

// --- FIELD GUIDE BROWSER (OFFLINE ENCYCLOPEDIA) ---
function renderFieldGuide(category = 'all') {
  if (!elements.guideBugList) return;
  elements.guideBugList.innerHTML = '';

  const filtered = category === 'all' 
    ? OFFLINE_BUG_LIBRARY 
    : OFFLINE_BUG_LIBRARY.filter(b => b.category === category);

  filtered.forEach(bug => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition cursor-pointer active:scale-[0.99]';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">${bug.emoji}</span>
          <div>
            <h4 class="text-xs font-bold text-white font-brand">${bug.bug_name}</h4>
            <p class="text-[10px] italic text-slate-400">${bug.scientific_name}</p>
          </div>
        </div>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-lime-400 border border-slate-700">
          ${bug.color_profile.replace('_', ' ')}
        </span>
      </div>
      <p class="text-[11px] text-slate-300 italic">"${bug.eulogy}"</p>
      <div class="bg-slate-950/60 p-2 rounded-lg text-[10px] text-emerald-300 flex items-center gap-1.5">
        <span>🧽</span> <span>${bug.windscreen_cleanup_tip}</span>
      </div>
    `;

    // Clicking a guide item previews it in the dossier
    card.addEventListener('click', () => {
      playSound('click');
      elements.guideModal.classList.add('hidden');
      renderForensicReport(bug, 'offline', 'Browsed from Field Guide');
      showToast(`Viewing: ${bug.bug_name}`);
    });

    elements.guideBugList.appendChild(card);
  });
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
          <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-lg">
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
    showToast('Sharing not available on this device.');
  }
}

document.addEventListener('DOMContentLoaded', init);
