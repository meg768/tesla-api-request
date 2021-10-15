var TeslaAPI = require('../tesla-api-request.js');

async function doorLock() {	

	require('dotenv').config();

	var options = {
		token: process.env.TESLA_API_REFRESH_TOKEN,
		vin: process.env.TESLA_API_VIN,
		debug: console.log
	};

	var tapi = new TeslaAPI(options);
	var reply = await tapi.post('command/door_lock');

	console.log(reply.result == true ? 'Door locked.' : 'Hmm. Could not lock the door...');}

doorLock();
