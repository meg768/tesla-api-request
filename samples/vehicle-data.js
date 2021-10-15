var TeslaAPI = require('../tesla-api-request.js');

async function getVehicleData() {	

	require('dotenv').config();

	var options = {
		token: process.env.TESLA_API_REFRESH_TOKEN,
		vin: process.env.TESLA_API_VIN,
		debug: true
	};

	var tapi = new TeslaAPI(options);
	var vehicleData = await tapi.get('vehicle_data');

	console.log(JSON.stringify(vehicleData, null, 4));
}

getVehicleData();