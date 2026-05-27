const connection = new solanaWeb3.Connection(
  window.SATURN_CONFIG.RPC_URL,
  "confirmed"
);

let wallet = null;

async function connectWallet() {
  try {

    if (window.phantom?.solana) {
      wallet = window.phantom.solana;
    }

    else if (window.solflare?.isSolflare) {
      wallet = window.solflare;
    }

    else if (window.backpack?.isBackpack) {
      wallet = window.backpack;
    }

    else {
      alert("No Solana wallet detected. Install Phantom Wallet.");
      return;
    }

    const response = await wallet.connect();

    const publicKey = response.publicKey.toString();

    console.log("Wallet Connected:", publicKey);

    const walletButton = document.getElementById("connectWallet");

    if (walletButton) {
      walletButton.innerText =
        publicKey.slice(0, 4) +
        "..." +
        publicKey.slice(-4);
    }

    localStorage.setItem("saturnWallet", publicKey);

  } catch (error) {

    console.error("Wallet connection failed:", error);

    alert("Wallet connection failed.");

  }
}

window.addEventListener("load", () => {

  const walletButton =
    document.getElementById("connectWallet");

  if (walletButton) {

    walletButton.addEventListener(
      "click",
      connectWallet
    );

  }

});
