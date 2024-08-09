const axios = require('axios');
const readlineSync = require('readline-sync');
const fs = require('fs');
const colors = require('colors');

// Define API endpoints and base URL
const API_BASE_URL = 'https://api.buenavista.wardenprotocol.org'; // Replace with actual base URL
const SEND_TOKEN_ENDPOINT = '/wardenprotocol/warden/intent/send'; // Replace with actual endpoint

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
  // Load addresses from a file
  let addresses;
  try {
    addresses = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
  } catch (error) {
    console.error(colors.red(`Error loading accounts.json: ${error.message}`));
    return;
  }

  if (!Array.isArray(addresses) || addresses.length === 0) {
    console.error(colors.red('accounts.json is not set correctly or is empty'));
    return;
  }

  // Get target address and amount to send
  const targetAddress = readlineSync.question('Enter the target address to send WARD to: ').trim();
  const amountToSend = parseFloat(readlineSync.question('Enter the amount of WARD to send in each transaction (default is 1 WARD): ').trim()) || 1;

  // Get delay between transactions
  const delayBetweenTx = parseInt(readlineSync.question('Enter the delay between transactions in milliseconds (default is 3000ms): ').trim()) || 3000;

  if (isNaN(delayBetweenTx) || delayBetweenTx < 0) {
    console.error(colors.red('Invalid delay specified'));
    return;
  }

  // Send 50 transactions
  for (let i = 0; i < 50; i++) {
    for (const fromAddress of addresses) {
      console.log(colors.yellow(`Sending WARD from account: ${fromAddress}`));
      await sendTokens(fromAddress, targetAddress, amountToSend);
      await new Promise(resolve => setTimeout(resolve, delayBetweenTx)); // Delay between transactions
    }
  }
})();
