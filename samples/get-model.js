var TeslaAPI = require('../tesla-api-request.js');

async function getModel() {	

	require('dotenv').config();

	var options = {
		token: process.env.TESLA_API_REFRESH_TOKEN,
		vin: process.env.TESLA_API_VIN,
		debug: console.log
	};

	var tapi = new TeslaAPI(options);
	var vehicleData = await tapi.get('vehicle_data');
	var model = 'Model Unknown';
	var displayName = vehicleData.display_name;

	if (displayName.match(/^\d+$/))
		displayName = null;

	vehicleData.option_codes.split(',').forEach((code) => {
		switch(code) {
			case 'MDLS':
			case 'MS03':
			case 'MS04': {
				model = 'Model S';
				break;
			}
			case 'MDLX': {
				model = 'Model X';
				break;
			}
			case 'MDL3': {
				model = 'Model 3';
				break;
			}
			case 'MDLY': {
				model = 'Model Y';
				break;
			}
		}            
	});

	if (displayName)
		console.log(`Your Tesla is a ${model} and you named it ${displayName}.`);
	else
		console.log(`Your Tesla is a ${model} and you have not given your car a real name yet.`);
}

getModel();