# Tesla API Request

This is a minimal request API for Tesla vehicles. The actual API is not included here. 
Instead, this module supports authentication so you don´t have to
worry about it. It also handles the renewal of access access tokens given a refresh token and keeping your vehicle awake.

If you don´t have a "refresh token" you may get it here.

- https://apps.apple.com/us/app/auth-app-for-tesla/id1552058613
- https://play.google.com/store/apps/details?id=net.leveugle.teslatokens&hl=en_US&gl=US

Simply provide a Tesla "refresh token" and 
a vehicle identification number (VIN) and this
module lets you send GET and POST requests to access your vehicle.

It is light weight and has no dependencies.

## Installation

````bash
npm install tesla-api-request --save
````


## Samples

### Lock door

````javascript
var TeslaAPI = require('tesla-api-request');

async function doorLock() {	

	require('dotenv').config();

	var options = {
		token: process.env.TESLA_API_REFRESH_TOKEN,
		vin: process.env.TESLA_API_VIN,
		debug: true
	};

	var tapi = new TeslaAPI(options);
	console.log(await tapi.post('command/door_lock'));
}

doorLock();
````

### Get information about your vehicle

````javascript
var TeslaAPI = require('tesla-api-request');

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
````

### Get your Tesla model

````javascript
var TeslaAPI = require('tesla-api-request');

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
````


## Methods
- **async get(path)** - Executes a GET request.
- **async post(path, body)** - Executes a POST request with optional body.
- **async request(method, path, options)** - Executes a request with additional options.

Please refer to the source code for more documentation.

# Tesla API Documentation
- https://tesla-api.timdorr.com