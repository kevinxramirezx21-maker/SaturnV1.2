let wallet = null;

async function connectWallet() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom wallet not found. Open this page inside Phantom browser or install Phantom extension.");
      return null;
    }

    const response = await window.solana.connect();
    wallet = response.publicKey;

    updateWalletButton();
    return wallet;

  } catch (err) {
    console.error("Wallet connection failed:", err);
    alert("Wallet connection failed.");
    return null;
  }
}

async function autoDetectWallet() {
  try {
    if (!window.solana || !window.solana.isPhantom) return;

    const response = await window.solana.connect({ onlyIfTrusted: true });

    if (response && response.publicKey) {
      wallet = response.publicKey;
      updateWalletButton();
    }

  } catch (err) {
    console.log("Wallet not previously trusted yet.");
  }
}

function updateWalletButton() {
  const button = document.getElementById("connectWallet");

  if (!button || !wallet) return;

  button.innerText =
    wallet.toString().slice(0, 4) +
    "..." +
    wallet.toString().slice(-4);
}

window.addEventListener("load", autoDetectWallet);
