// ============================================================
// SATURN v1.5 — saturn-dev.js (FIXED)
// All 6 bots | Jupiter lite-api | DexScreener new pairs
// ============================================================

const DEV_SESSION_KEY = "saturn_dev_v12";

const SOL_MINT   = "So11111111111111111111111111111111111111112";
const LAMPORTS   = 1_000_000_000;

const JUPITER_PRICE_API = "https://lite-api.jup.ag/price/v2";
const JUPITER_QUOTE_API = "https://lite-api.jup.ag/swap/v1/quote";
const JUPITER_SWAP_API  = "https://lite-api.jup.ag/swap/v1/swap";
const DEX_NEW_PAIRS_API = "https://api.dexscreener.com/token-profiles/latest/v1";
const DEX_PAIR_INFO_API = "https://api.dexscreener.com/latest/dex/tokens";

const RPC_URL    = "https://mainnet.helius-rpc.com/?api-key=91b12828-68ae-42f0-a425-c7874c31d61d";
const connection = new solanaWeb3.Connection(RPC_URL, "confirmed");

// ─── SETTINGS ────────────────────────────────────────────────
let globalSlippageBps = parseFloat(localStorage.getItem("globalSlippageBps") || "150");
let aggressiveEnabled = false;
let mevProtection     = localStorage.getItem("mevProtection") !== "false";

// ─── ALL 6 AGENTS ────────────────────────────────────────────
let AGENTS_CONFIG = {
"The Mastermind":    { active:true, intervalMs:3600000, amountSol:parseFloat(localStorage.getItem("masterAmount")  ||"0.05"),  slippageBps:null, strategy:"highVolume", minLiqUsd:50000 },
"Sniper X":          { active:true, intervalMs:120000,  amountSol:parseFloat(localStorage.getItem("sniperAmount")  ||"0.02"),  slippageBps:300,  strategy:"newest",     minLiqUsd:3000  },
"DCA Steady":        { active:true, intervalMs:1800000, amountSol:parseFloat(localStorage.getItem("dcaAmount")     ||"0.01"),  slippageBps:null, strategy:"highVolume", minLiqUsd:10000 },
"Momentum Wave":     { active:true, intervalMs:600000,  amountSol:parseFloat(localStorage.getItem("momentumAmount")||"0.015"), slippageBps:null, strategy:"momentum",   minLiqUsd:5000  },
"Bundle Filter Pro": { active:true, intervalMs:900000,  amountSol:parseFloat(localStorage.getItem("bundleAmount")  ||"0.01"),  slippageBps:null, strategy:"safeOnly",   minLiqUsd:25000 },
"Night Owl":         { active:true, intervalMs:900000,  amountSol:parseFloat(localStorage.getItem("owlAmount")     ||"0.005"), slippageBps:null, strategy:"highVolume", minLiqUsd:5000  }
};

let tradeHistory = JSON.parse(localStorage.getItem("saturnTrades") || "[]");
let liveFeedLog  = [];

// ─── HELPERS ─────────────────────────────────────────────────
function isDev() { return sessionStorage.getItem(DEV_SESSION_KEY) === "true"; }

function base64ToUint8Array(b64) {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ... (the rest of the file stays the same — I only fixed quotes for now)

function saveAmount(agentName, value) {
  const keys = { "The Mastermind":"masterAmount","Sniper X":"sniperAmount","DCA Steady":"dcaAmount","Momentum Wave":"momentumAmount","Bundle Filter Pro":"bundleAmount","Night Owl":"owlAmount" };
  const v = Math.max(0.001, Math.min(10, parseFloat(value)||0.01));
  if (keys[agentName]) localStorage.setItem(keys[agentName], v);
  if (AGENTS_CONFIG[agentName]) AGENTS_CONFIG[agentName].amountSol = v;
  addToLiveFeed(`⚙️ ${agentName} → ${v} SOL/trade`);
}

// (Full file is long — if you want me to give the complete fixed file in one go, just say “give full fixed js” and I’ll paste everything.)
