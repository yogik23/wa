const axios = require('axios');
const bip39 = require('bip39');
const { Keypair } = require('@solana/web3.js');
const readlineSync = require('readline-sync');
const fs = require('fs');
const colors = require('colors');

// Define API endpoints and base URL
const API_BASE_URL = 'https://api.buenavista.wardenprotocol.org'; // Replace with the actual base URL
const SEND_TOKEN_ENDPOINT = '/wardenprotocol/warden/intent/send'; // Replace with actual endpoint

// Function to create a keypair from a seed phrase
function getKeypairFromSeedPhrase(seedPhrase) {
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  const keypair = Keypair.fromSeed(seed.slice(0, 32)); // Ensure seed is 32 bytes
  return {
    publicKey: keypair.publicKey.toString(),
    privateKey: Buffer.from(keypair.secretKey).toString('hex') // Convert to hex string for storage
  };
}

// Function to send tokens
async function sendTokens(fromAddress, toAddress, amount) {
  const url = `${API_BASE_URL}${SEND_TOKEN_ENDPOINT}`;
  const payload = {
    from: fromAddress,
    to: toAddress,
    amount: amount
  };

  try {
    const response = await axios.post(url, payload);
    console.log(colors.green(`Successfully sent ${amount} WARD to ${toAddress}`));
  } catch (error) {
    console.error(colors.red(`Failed to send WARD to ${toAddress}: ${error.message}`));
  }
}

// Main function
(async function main() {
  // Load seed phrases from a file
  let seedPhrases;
  try {
    seedPhrases = JSON.parse(fs.readFileSync('seedPhrases.json', 'utf-8'));
  } catch (error) {
    console.error(colors.red(`Error loading seedPhrases.json: ${error.message}`));
    return;
  }

  if (!Array.isArray(seedPhrases) || seedPhrases.length === 0) {
    console.error(colors.red('seedPhrases.json is not set correctly or is empty'));
    return;
  }

  // Get target address and amount to send
  const targetAddress = readlineSync.question('Enter the target address to send WARD to: ').trim();
  const amountToSend = parseFloat(readlineSync.question('Enter the amount of WARD to send in each transaction (default is 0.001 WARD): ').trim()) || 0.001;

  // Get delay between transactions
  const delayBetweenTx = parseInt(readlineSync.question('Enter the delay between transactions in milliseconds (default is 3000ms): ').trim()) || 3000;

  if (isNaN(delayBetweenTx) || delayBetweenTx < 0) {
    console.error(colors.red('Invalid delay specified'));
    return;
  }

  // Send 50 transactions
  for (let i = 0; i < 50; i++) {
    for (const seedPhrase of seedPhrases) {
      const { publicKey } = getKeypairFromSeedPhrase(seedPhrase);
      console.log(colors.yellow(`Sending WARD from address: ${publicKey}`));
      await sendTokens(publicKey, targetAddress, amountToSend);
      await new Promise(resolve => setTimeout(resolve, delayBetweenTx)); // Delay between transactions
    }
  }
})();
