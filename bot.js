const axios = require('axios');
const readlineSync = require('readline-sync');
const fs = require('fs');
const colors = require('colors');
const bip39 = require('bip39');
const { Keypair, Connection, clusterApiUrl, SystemProgram, Transaction } = require('@solana/web3.js');

// Define API endpoints and base URL
const API_BASE_URL = 'https://api.buenavista.wardenprotocol.org'; // Replace with actual base URL
const SEND_TOKEN_ENDPOINT = '/wardenprotocol/warden/intent/send'; // Replace with actual endpoint

// Function to create keypair from seed phrase
function getKeypairFromSeed(seedPhrase) {
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  return Keypair.fromSeed(seed.slice(0, 32)); // Solana keypair uses 32-byte seeds
}

// Function to send tokens
async function sendTokens(fromKeypair, toAddress, amount) {
  const url = `${API_BASE_URL}${SEND_TOKEN_ENDPOINT}`;
  const payload = {
    from: fromKeypair.publicKey.toString(),
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
  const amountToSend = parseFloat(readlineSync.question('Enter the amount of WARD to send in each transaction (default is 1 WARD): ').trim()) || 1;

  // Get delay between transactions
  const delayBetweenTx = parseInt(readlineSync.question('Enter the delay between transactions in milliseconds (default is 1000ms): ').trim()) || 1000;

  if (isNaN(delayBetweenTx) || delayBetweenTx < 0) {
    console.error(colors.red('Invalid delay specified'));
    return;
  }

  // Send 50 transactions
  for (let i = 0; i < 50; i++) {
    for (const seedPhrase of seedPhrases) {
      const fromKeypair = getKeypairFromSeed(seedPhrase);
      console.log(colors.yellow(`Sending WARD from keypair with public key: ${fromKeypair.publicKey.toString()}`));
      await sendTokens(fromKeypair, targetAddress, amountToSend);
      await new Promise(resolve => setTimeout(resolve, delayBetweenTx)); // Delay between transactions
    }
  }
})();
