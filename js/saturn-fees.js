async function sendLockFee() {

  try {

    if (!wallet || !walletProvider) {

      const connectedWallet =
        await connectWallet();

      if (!connectedWallet) {

        alert("Please connect your wallet first.");
        return false;

      }

    }

    const connection =
      new solanaWeb3.Connection(
        window.SATURN_CONFIG.RPC_URL,
        "confirmed"
      );

    const treasuryWallet =
      new solanaWeb3.PublicKey(
        window.SATURN_CONFIG.FEE_WALLET
      );

    const transaction =
      new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: wallet,
          toPubkey: treasuryWallet,
          lamports: Math.round(
            0.3 * solanaWeb3.LAMPORTS_PER_SOL
          )
        })
      );

    transaction.feePayer = wallet;

    const latestBlockhash =
      await connection.getLatestBlockhash();

    transaction.recentBlockhash =
      latestBlockhash.blockhash;

    const signedTransaction =
      await walletProvider.signTransaction(transaction);

    const signature =
      await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

    await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    console.log("Lock fee paid:", signature);

    alert(
      "✅ Fee paid successfully.\n\nTransaction:\n" + signature
    );

    return true;

  }

  catch (error) {

    console.error("Fee payment failed:", error);

    alert(
      "Fee payment failed.\n\nPossible reasons:\n- You rejected Phantom\n- Not enough SOL\n- RPC issue\n- Wallet disconnected"
    );

    return false;

  }

}
