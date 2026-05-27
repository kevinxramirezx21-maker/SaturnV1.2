async function sendLockFee() {

  try {

    if (!wallet || !wallet.publicKey) {

      alert("Please connect wallet first.");
      return false;

    }

    const connection = new solanaWeb3.Connection(
      window.SATURN_CONFIG.RPC_URL,
      "confirmed"
    );

    const transaction = new solanaWeb3.Transaction();

    const instruction =
      solanaWeb3.SystemProgram.transfer({

        fromPubkey: wallet.publicKey,

        toPubkey: new solanaWeb3.PublicKey(
          window.SATURN_CONFIG.FEE_WALLET
        ),

        lamports: 0.5 * solanaWeb3.LAMPORTS_PER_SOL

      });

    transaction.add(instruction);

    transaction.feePayer = wallet.publicKey;

    const latestBlockhash =
      await connection.getLatestBlockhash();

    transaction.recentBlockhash =
      latestBlockhash.blockhash;

    const signed =
      await wallet.signTransaction(transaction);

    const signature =
      await connection.sendRawTransaction(
        signed.serialize()
      );

    await connection.confirmTransaction(signature);

    alert("✅ 0.5 SOL lock fee paid successfully.");

    console.log("Fee tx:", signature);

    return true;

  } catch (error) {

    console.error(error);

    alert("Fee payment failed.");

    return false;

  }
}
