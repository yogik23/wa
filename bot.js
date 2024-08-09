const axios = require('axios');
const bip39 = require('bip39');
const readlineSync = require('readline-sync');
const colors = require('colors');
const fs = require('fs');


// Define API endpoints and base URL
const API_BASE_URL = 'https://api.buenavista.wardenprotocol.org'; // Replace with actual base URL
const SEND_TOKEN_ENDPOINT = '/wardenprotocol/warden/intent/send'; // Replace with actual endpoint

/**
 * Create an address from a seed phrase.
 * @param {string} seedPhrase - The seed phrase.
 * @returns {string} - The public address.
 */
function getAddressFromSeedPhrase(seedPhrase) {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error('Invalid seed phrase');
  }

  // Convert seed phrase to seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
}

/**
 * Send tokens from one address to another.
 * @param {string} fromAddress - The sender's address.
 * @param {string} toAddress - The recipient's address.
 * @param {number} amount - The amount of tokens to send.
 */
async function sendTokens(fromAddress, toAddress, amount) {
  const url = `${API_BASE_URL}${SEND_TOKEN_ENDPOINT}`;
  const payload = {
    from: fromAddress,
    to: toAddress,
    amount: amount.toFixed(2) // Ensure amount is a valid number format
  };

  try {
    const response = await axios.post(url, payload);
    console.log(colors.green(`Successfully sent ${amount} WARD from ${fromAddress} to ${toAddress}`));
  } catch (error) {
    console.error(colors.red(`Failed to send WARD from ${fromAddress} to ${toAddress}: ${error.message}`));
  }
}

/**
 * Main function to execute the bot operations.
 */
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

  // Send transactions
  for (let i = 0; i < 50; i++) {
    for (const seedPhrase of seedPhrases) {
      try {
        const fromAddress = getAddressFromSeedPhrase(seedPhrase);
        console.log(colors.yellow(`Sending WARD from address: ${fromAddress}`));
        await sendTokens(fromAddress, targetAddress, amountToSend);
        await new Promise(resolve => setTimeout(resolve, delayBetweenTx)); // Delay between transactions
      } catch (error) {
        console.error(colors.red(`Error processing seed phrase: ${error.message}`));
      }
    }
  }
})();
