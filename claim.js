const axios = require('axios');
const readlineSync = require('readline-sync');
const fs = require('fs');
const colors = require('colors');

// Define the API endpoints
const API_BASE_URL = 'https://api.buenavista.wardenprotocol.org'; // Replace with actual base URL
const SEND_TOKEN_ENDPOINT = '/wardenprotocol/warden/intent/send'; // Replace with actual endpoint
const RANDOM_ADDRESS_GENERATOR_ENDPOINT = '/wardenprotocol/warden/intent/random_addresses'; // Replace with actual endpoint

// Function to send tokens
async function sendTokens(fromAddress, toAddress, amount) {
  try {
    const response = await axios.post(`${API_BASE_URL}${SEND_TOKEN_ENDPOINT}`, {
      from: fromAddress,
      to: toAddress,
      amount: amount
    });
    console.log(colors.green(`Successfully sent ${amount} WARD to ${toAddress}`));
  } catch (error) {
    console.error(colors.red(`Failed to send WARD to ${toAddress}:`), error.message);
  }
}

// Function to generate random addresses
async function generateRandomAddresses(count) {
  try {
    const response = await axios.get(`${API_BASE_URL}${RANDOM_ADDRESS_GENERATOR_ENDPOINT}`, {
      params: { count }
    });
    return response.data.addresses; // Adjust according to the actual response structure
  } catch (error) {
    console.error(colors.red('Failed to generate random addresses:'), error.message);
    return [];
  }
}

// Main function
(async () => {
  const method = readlineSync.question(
    'Select input method (0 for seed phrase, 1 for private key): '
  );

  let addresses;
  if (method === '0') {
    addresses = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
  } else if (method === '1') {
    addresses = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));
  } else {
    console.error(colors.red('Invalid input method selected'));
    return;
  }

  if (!Array.isArray(addresses) || addresses.length === 0) {
    console.error(colors.red('Input file is not set correctly or is empty'));
    return;
  }

  const addressCount = parseInt(readlineSync.question(
    'How many random addresses do you want to generate? (default is 100): '
  ), 10) || 100;

  if (isNaN(addressCount) || addressCount <= 0) {
    console.error(colors.red('Invalid number of addresses specified'));
    return;
  }

  const randomAddresses = await generateRandomAddresses(addressCount);

  const amountToSend = parseFloat(readlineSync.question(
    'Enter the amount of WARD to send (default is 0.001 WARD): '
  )) || 0.001;

  const delayBetweenTx = parseInt(readlineSync.question(
    `Enter the delay between transactions in milliseconds (default is 5000ms): `
  ), 50) || 5000;

  if (isNaN(delayBetweenTx) || delayBetweenTx < 0) {
    console.error(colors.red('Invalid delay specified'));
    return;
  }

  for (const fromAddress of addresses) {
    console.log(colors.yellow(`Sending WARD from account: ${fromAddress}`));

    for (const toAddress of randomAddresses) {
      await sendTokens(fromAddress, toAddress, amountToSend);
      await new Promise(resolve => setTimeout(resolve, delayBetweenTx));
    }
  }
})();
