/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');


async function main({organisationName="A", organisationNumber=1, userId}) {
    if(!userId)
        return Promise.reject("UserId can't be null");
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org' + organisationNumber + '.example.com', 'connection-org' + organisationNumber + '.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userId);
        if (!identity) {
            console.log('An identity for the user "'+userId+'" does not exist in the wallet');
            console.log('Register user on the application before retrying');
            return Promise.reject('An identity for the user "'+userId+'" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userId, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // addRow - org, data
        const result = await contract.evaluateTransaction('fetchOrgData', organisationName);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

        return Promise.resolve(result);
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return Promise.reject(`Failed to evaluate transaction: ${error}`);
    }
}

module.exports = main;
