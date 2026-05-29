// ================================================================
// SATURN PROTOCOL V1.2 — CORE SHARED MODULE
// Drop this file into your repo root and add to every HTML page:
// <script src="saturn-core.js"></script>
// ================================================================

// ── CONFIG — update SATURN_MINT after pump.fun launch ───────────
const SATURN = {
  MINT:         "PASTE_SATURN_MINT_HERE",   // ← replace after launch
  DECIMALS:     9,
  FEE_WALLET:   "CqXPQf6Qe2D2KJ5UYvTLi3prAwQiSntJUXZmE3knyzFb",
  RPC:          "https://mainnet.helius-rpc.com/?api-key=f74bfe3e-5fb9-4834-ad1f-b38a3cc28ae7",
  LOCK_SOL_FEE: 0.5,
  TOKEN_FEE_PC: 0.002,   // 0.20% of locked tokens
  DISC:         0.5,     // 50% off when paying in $SATURN
  AGENT_SOL:    0.125,   // per agent per month
  solPrice:     150,     // updated by fetchPrices()
  satPrice:     0.005,   // updated after TGE
};

// ── DEV MODE ──────────────────────────────────────────────────────
const DEV_CODE = "boss2026";
const DEV_KEY  = "saturn_dev_v12";
let _tapCount = 0, _tapTimer = null;

function initDevMode() {
  if (sessionStorage.getItem(DEV_KEY) === "true") _applyDevBadge(true);
  // Tap logo 5x fast to open dev modal
  const logo = document.getElementById("saturnLogo");
  if (!logo) return;
  logo.addEventListener("click", () => {
    _tapCount++;
    clearTimeout(_tapTimer);
    _tapTimer = setTimeout(() => { _tapCount = 0; }, 3000);
    if (_tapCount >= 5) { _tapCount = 0; openDevModal(); }
  });
}

function openDevModal() {
  const m = document.getElementById("devModal");
  if (m) { m.classList.add("open"); setTimeout(() => document.getElementById("devCodeInput")?.focus(), 100); }
}

function closeDevModal() {
  const m = document.getElementById("devModal");
  if (m) m.classList.remove("open");
  const i = document.getElementById("devCodeInput"); if (i) i.value = "";
  const e = document.getElementById("devError"); if (e) e.textContent = "";
}

function submitDevCode() {
  const v = (document.getElementById("devCodeInput")?.value || "").trim().toLowerCase();
  if (v === DEV_CODE) {
    sessionStorage.setItem(DEV_KEY, "true");
    closeDevModal();
    _applyDevBadge(true);
    saturnToast("🛸 Dev mode ON — all protocol fees waived");
    if (typeof renderPage === "function") renderPage();
  } else {
    const e = document.getElementById("devError");
    if (e) e.textContent = "Invalid code. Try again.";
    const i = document.getElementById("devCodeInput"); if (i) i.value = "";
  }
}

function openDevStatus() {
  const m = document.getElementById("devStatusModal");
  if (m) m.classList.add("open");
}

function deactivateDev() {
  sessionStorage.removeItem(DEV_KEY);
  _applyDevBadge(false);
  const m = document.getElementById("devStatusModal");
  if (m) m.classList.remove("open");
  saturnToast("Dev mode deactivated");
  if (typeof renderPage === "function") renderPage();
}

function isDev() { return sessionStorage.getItem(DEV_KEY) === "true"; }

function _applyDevBadge(on) {
  const b = document.getElementById("devBadge");
  if (b) b.style.display = on ? "flex" : "none";
}

// ── WALLET ADAPTERS ───────────────────────────────────────────────
const WALLETS = [
  { id:"phantom",  name:"Phantom",         color:"#ab9ff2",
    detect: () => !!window.solana?.isPhantom,
    connect: async () => { const r = await window.solana.connect(); return r.publicKey.toString(); },
    sign: () => window.solana, url: "https://phantom.app/" },
  { id:"solflare", name:"Solflare",        color:"#fc7227",
    detect: () => !!window.solflare?.isSolflare,
    connect: async () => { await window.solflare.connect(); return window.solflare.publicKey.toString(); },
    sign: () => window.solflare, url: "https://solflare.com/" },
  { id:"backpack", name:"Backpack",        color:"#e33e3f",
    detect: () => !!(window.backpack?.isBackpack || window.xnft?.solana),
    connect: async () => { const b = window.backpack || window.xnft?.solana; await b.connect(); return b.publicKey.toString(); },
    sign: () => window.backpack || window.xnft?.solana, url: "https://backpack.app/" },
  { id:"coinbase", name:"Coinbase Wallet", color:"#0052ff",
    detect: () => !!window.coinbaseSolana,
    connect: async () => { const r = await window.coinbaseSolana.connect(); return r.publicKey.toString(); },
    sign: () => window.coinbaseSolana, url: "https://www.coinbase.com/wallet" },
  { id:"brave",    name:"Brave Wallet",    color:"#ff6000",
    detect: () => !!(window.braveSolana || window.solana?.isBraveWallet),
    connect: async () => { const w = window.braveSolana || window.solana; const r = await w.connect(); return r.publicKey.toString(); },
    sign: () => window.braveSolana || window.solana, url: "https://brave.com/wallet/" },
  { id:"trust",    name:"Trust Wallet",    color:"#3375BB",
    detect: () => !!window.trustwallet?.solana,
    connect: async () => { const r = await window.trustwallet.solana.connect(); return r.publicKey.toString(); },
    sign: () => window.trustwallet?.solana, url: "https://trustwallet.com/" },
];

let WALLET = { id: null, pubkey: null };

function openWalletModal() {
  if (WALLET.pubkey) { if (confirm("Disconnect wallet?")) disconnectWallet(); return; }
  const det = WALLETS.filter(w => w.detect && w.detect());
  const not = WALLETS.filter(w => !w.detect || !w.detect());
  let h = "";
  if (det.length) { h += '<div class="wdiv">Detected</div>'; h += det.map(w => _walletRow(w, true)).join(""); }
  if (not.length) { h += '<div class="wdiv">Install to use</div>'; h += not.map(w => _walletRow(w, false)).join(""); }
  const list = document.getElementById("walletList");
  if (list) list.innerHTML = h;
  const m = document.getElementById("walletModal");
  if (m) m.classList.add("open");
}

function _walletRow(w, det) {
  return `<div class="wopt ${det ? "det" : ""}" onclick="selectWallet('${w.id}')">
    <div class="wicon" style="background:${w.color}20;border:1px solid ${w.color}40">💼</div>
    <div class="winfo"><div class="wname">${w.name}</div>
    <div class="wstatus ${det ? "det" : ""}">${det ? "Detected · Ready" : "Not installed"}</div></div>
    <div class="warrow">${det ? "›" : "↗"}</div>
  </div>`;
}

async function selectWallet(id) {
  const w = WALLETS.find(x => x.id === id);
  if (!w) return;
  if (!w.detect || !w.detect()) { window.open(w.url, "_blank"); return; }
  try {
    const pk = await w.connect();
    WALLET = { id, pubkey: pk };
    const m = document.getElementById("walletModal");
    if (m) m.classList.remove("open");
    updateWalletButton();
    if (typeof onWalletConnected === "function") onWalletConnected(pk);
    saturnToast("✅ " + w.name + " connected");
  } catch(e) {
    saturnToast("❌ Connection failed: " + (e.message || "Unknown error"));
  }
}

function disconnectWallet() {
  WALLET = { id: null, pubkey: null };
  updateWalletButton();
  if (typeof onWalletDisconnected === "function") onWalletDisconnected();
  saturnToast("Wallet disconnected");
}

function updateWalletButton() {
  const btn = document.getElementById("walletBtn");
  if (!btn) return;
  if (WALLET.pubkey) {
    btn.classList.add("connected");
    btn.innerHTML = `<span class="wdot"></span>${WALLET.pubkey.slice(0,4)}...${WALLET.pubkey.slice(-4)}`;
  } else {
    btn.classList.remove("connected");
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1"/><polyline points="15 3 21 9 15 15"/><line x1="21" y1="9" x2="7" y2="9"/></svg> Connect Wallet`;
  }
}

// ── FEE COLLECTION — SOL ─────────────────────────────────────────
async function collectSOLFee(solAmount) {
  if (isDev()) { return "DEV_MODE_NO_FEE"; }
  const conn = new solanaWeb3.Connection(SATURN.RPC, "confirmed");
  const from = new solanaWeb3.PublicKey(WALLET.pubkey);
  const to   = new solanaWeb3.PublicKey(SATURN.FEE_WALLET);
  const { blockhash } = await conn.getLatestBlockhash();
  const tx = new solanaWeb3.Transaction({ recentBlockhash: blockhash, feePayer: from });
  tx.add(solanaWeb3.SystemProgram.transfer({
    fromPubkey: from, toPubkey: to,
    lamports: Math.round(solAmount * solanaWeb3.LAMPORTS_PER_SOL)
  }));
  const w = WALLETS.find(x => x.id === WALLET.id);
  const signed = await w.sign().signTransaction(tx);
  const sig = await conn.sendRawTransaction(signed.serialize());
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

// ── FEE COLLECTION — SPL TOKEN ($SATURN) ─────────────────────────
async function collectSPLFee(mintAddress, amount, decimals) {
  if (isDev()) { return "DEV_MODE_NO_FEE"; }
  const TPK  = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  const ATPK = new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bRS");
  const conn  = new solanaWeb3.Connection(SATURN.RPC, "confirmed");
  const from  = new solanaWeb3.PublicKey(WALLET.pubkey);
  const mint  = new solanaWeb3.PublicKey(mintAddress);
  const toOwner = new solanaWeb3.PublicKey(SATURN.FEE_WALLET);
  const bigAmt = BigInt(Math.round(amount * (10 ** decimals)));
  const ata = (owner) => solanaWeb3.PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TPK.toBuffer(), mint.toBuffer()], ATPK
  )[0];
  const fromATA = ata(from);
  const toATA   = ata(toOwner);
  const { blockhash } = await conn.getLatestBlockhash();
  const tx = new solanaWeb3.Transaction({ recentBlockhash: blockhash, feePayer: from });
  if (!await conn.getAccountInfo(toATA)) {
    tx.add(new solanaWeb3.TransactionInstruction({
      programId: ATPK,
      keys: [
        { pubkey: from,    isSigner: true,  isWritable: true  },
        { pubkey: toATA,   isSigner: false, isWritable: true  },
        { pubkey: toOwner, isSigner: false, isWritable: false },
        { pubkey: mint,    isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TPK,     isSigner: false, isWritable: false },
      ], data: Buffer.from([])
    }));
  }
  const td = Buffer.alloc(9); td[0] = 3; td.writeBigUInt64LE(bigAmt, 1);
  tx.add(new solanaWeb3.TransactionInstruction({
    programId: TPK,
    keys: [
      { pubkey: fromATA, isSigner: false, isWritable: true  },
      { pubkey: toATA,   isSigner: false, isWritable: true  },
      { pubkey: from,    isSigner: true,  isWritable: false },
    ], data: td
  }));
  const w = WALLETS.find(x => x.id === WALLET.id);
  const signed = await w.sign().signTransaction(tx);
  const sig = await conn.sendRawTransaction(signed.serialize());
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

// ── PRICE FETCH ───────────────────────────────────────────────────
async function fetchPrices() {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const d = await r.json();
    SATURN.solPrice = d?.solana?.usd || 150;
    const el = document.getElementById("saturnPrice");
    if (el) el.textContent = "$" + SATURN.satPrice.toFixed(4);
  } catch(e) { console.warn("Price fetch failed:", e.message); }
}

// ── HELPERS ───────────────────────────────────────────────────────
function saturnForFee(solAmount) {
  return Math.ceil(solAmount * SATURN.solPrice * SATURN.DISC / SATURN.satPrice);
}

function saturnToast(msg, duration = 4000) {
  const t = document.createElement("div");
  t.className = "saturn-toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, duration);
}

// Auto-reconnect on page load
async function saturnAutoConnect() {
  if (window.solana?.isPhantom) {
    try {
      const r = await window.solana.connect({ onlyIfTrusted: true });
      WALLET = { id: "phantom", pubkey: r.publicKey.toString() };
      updateWalletButton();
      if (typeof onWalletConnected === "function") onWalletConnected(WALLET.pubkey);
    } catch(e) {}
  }
  if (!WALLET.pubkey && window.solflare?.isSolflare) {
    try {
      await window.solflare.connect();
      if (window.solflare.publicKey) {
        WALLET = { id: "solflare", pubkey: window.solflare.publicKey.toString() };
        updateWalletButton();
        if (typeof onWalletConnected === "function") onWalletConnected(WALLET.pubkey);
      }
    } catch(e) {}
  }
}

window.addEventListener("load", () => {
  initDevMode();
  fetchPrices();
  saturnAutoConnect();
  setInterval(fetchPrices, 60000);
  // Close modals on backdrop click
  document.querySelectorAll(".modal-backdrop").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) m.classList.remove("open"); });
  });
});
