let wallet = null;
let walletProvider = null;

async function connectWallet() {

  try {

    if (window.phantom?.solana?.isPhantom) {

      walletProvider = window.phantom.solana;

    }

    else if (window.solflare?.isSolflare) {

      walletProvider = window.solflare;

    }

    else if (window.backpack?.isBackpack) {

      walletProvider = window.backpack;

    }

    else {

      alert(
        "No Solana wallet detected.\n\nInstall Phantom Wallet."
      );

      return null;

    }

    const response =
      await walletProvider.connect();

    wallet = response.publicKey;

    console.log(
      "Wallet Connected:",
      wallet.toString()
    );

    const walletButton =
      document.getElementById("connectWallet");

    if (walletButton) {

      walletButton.innerText =
        wallet.toString().slice(0, 4)
        +
        "..."
        +
        wallet.toString().slice(-4);

    }

    localStorage.setItem(
      "saturnWallet",
      wallet.toString()
    );

    return wallet;

  }

  catch (error) {

    console.error(
      "Wallet connection failed:",
      error
    );

    alert(
      "Wallet connection failed."
    );

    return null;

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
