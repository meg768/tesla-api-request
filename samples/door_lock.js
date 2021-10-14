async function doorLock() {	
	require('dotenv').config();

	var TeslaAPI = require('../tesla-api-request.js');

	var options = {
		token: process.env.TESLA_API_REFRESH_TOKEN,
		vin: process.env.TESLA_API_VIN,
		debug: true
	};

	var tapi = new TeslaAPI(options);
	console.log(await tapi.post('command/door_lock'));
}

doorLock();