async function getVehicleData() {	
	require('dotenv').config();

	var TeslaAPI = require('../tesla-api-request.js');

	var options = {
		token: process.env.TESLA_API_REFRESH_TOKEN,
		vin: process.env.TESLA_API_VIN,
		debug: true
	};

	var tapi = new TeslaAPI(options);
	console.log(await tapi.get('vehicle_data'));
}

getVehicleData();