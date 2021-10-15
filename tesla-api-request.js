function isString(arg) {
	return typeof arg == 'string';
};

function isObject(arg) {
	return typeof arg == 'object' && arg != null;
};

function isFunction(arg) {
	return typeof arg === 'function';
};

function Request() {

	var Path = require('path');
	var URL = require('url');
	var self = this;

	function debug() {
	};


	function constructor() {

		var options = {protocol:'https:'};

		if (isObject(arguments[0])) {
			Object.assign(options, arguments[0]);
		}

		else if (isString(arguments[0])) {
			var url = new URL.parse(arguments[0]);

			if (url.protocol != undefined)
				options.protocol = url.protocol;

			if (url.port != undefined)
				options.port = url.port;

			if (url.hostname != undefined)
				options.hostname = url.hostname;

			if (url.path != undefined)
				options.path = url.path;

			if (isObject(arguments[1]))
				Object.assign(options, arguments[1]);

		}

		if (options.debug) {
            debug = isFunction(options.debug) ? options.debug : console.log;
        }

		self.defaultOptions = Object.assign({}, options);

		debug('Default options', self.defaultOptions);
	}

	this.get = function() {
		return self.request.apply(self, ['GET'].concat(Array.prototype.slice.call(arguments)));
	}

	this.delete = function() {
		return self.request.apply(self, ['DELETE'].concat(Array.prototype.slice.call(arguments)));
	}

	this.post = function() {
		return self.request.apply(self, ['POST'].concat(Array.prototype.slice.call(arguments)));
	}

	this.put = function() {
		return self.request.apply(self, ['PUT'].concat(Array.prototype.slice.call(arguments)));
	}

	this.request = function() {

		debug('Request arguments:', arguments);

		var self    = this;
		var https   = require('https');
		var http    = require('http');
		var options = {};

		if (isString(arguments[0])) {
			if (isString(arguments[1])) {
				options.method = arguments[0];
				options.path   = arguments[1];

				Object.assign(options, arguments[2]);
			}
			else {
				options.method = arguments[0];
				Object.assign(options, arguments[1]);
			}
		}
		else if (isObject(arguments[0])) {
			options = arguments[0];
		}
		else {
			return Promise.reject('Missing options.');
		}

		debug('Request options:', options);
		
	    return new Promise(function(resolve, reject) {
			var data = isObject(options.body) ? JSON.stringify(options.body) : options.body;
			var headers = {};

			if (self.defaultOptions.headers != undefined) {
				for (var key in self.defaultOptions.headers) {
					headers[key.toLowerCase()] = self.defaultOptions.headers[key];
				}

			}

			if (options.headers != undefined) {
				for (var key in options.headers) {
					headers[key.toLowerCase()] = options.headers[key];
				}

			}

			// If default options includes a path, join the two
			if (isString(self.defaultOptions.path) && isString(options.path)) {
				options.path = Path.join(self.defaultOptions.path, options.path);
			}

			headers['content-length'] = data == undefined ? 0 : Buffer.from(data).length;

			if (isObject(options.body)) 
				headers['content-type'] = 'application/json;charset=utf-8';

			var params = {};
			Object.assign(params, self.defaultOptions, options, {headers:headers});

			var iface = params.protocol === "https:" ? https : http;

			debug('Request params:', params);

	        var request = iface.request(params, function(response) {

				response.setEncoding('utf8');				

				var body = [];

				response.on('data', function(chunk) {
					body.push(chunk);
				});

	            response.on('end', function() {
	                body = body.join('');

					var contentType = '';

					if (response.headers && isString(response.headers['content-type'])) {
						contentType = response.headers['content-type'];
					}

					if (contentType.match("application/json")) {
						try {
							body = JSON.parse(body);
		                }
						catch (error) {
		                }
					}

	                var reply = {
	                    statusCode     : response.statusCode,
	                    statusMessage  : response.statusMessage,
	                    headers        : response.headers,
	                    body           : body
	                };

	                resolve(reply);
	            })
	        });

	        if (data) {
	            request.write(data);
	        }

			request.on('error', function(error) {
				reject(error);
			});

	        request.end();
	    })
	};


	constructor.apply(self, arguments);
}



module.exports = class TeslaAPI {

	constructor(options) {

		this.token = options.refreshToken || options.token;
		this.api = undefined;
		this.apiInvalidAfter = undefined;
		this.vin = options.vin;
		this.vehicle = undefined;
        this.wakeupTimeout = 60000;
		this.debug = () => {};

		if (!isString(this.vin))
			throw new Error('A vehicle ID (VIN) must be specified.');
		
		if (!isString(this.token))
			throw new Error('A refresh token must be specified.');

		if (options.debug) {
	        this.debug = typeof options.debug === 'function' ? options.debug : console.log;
        }

	}



	async getAPI() {

		var now = new Date();

		if (this.api && this.apiInvalidAfter && now.getTime() < this.apiInvalidAfter.getTime())
			return this.api;

		this.debug(`No access token or too long since access token was generated.`);

		var getAccessToken = async () => {
			var options = {
				headers: {
					"content-type": "application/json; charset=utf-8"
				},
				body: {
					"grant_type": "refresh_token",
					"refresh_token": this.token,
					"client_id": "ownerapi"	
				}
			};
	
			this.debug(`Fetching new access token...`);
	
			var request = new Request("https://auth.tesla.com");
			var reply = await request.post("oauth2/v3/token", options);
	
			return reply.body.access_token;
		}

		var accessToken = await getAccessToken();

		var options = {
            headers: {
                "content-type": `application/json; charset=utf-8`,
				"authorization": `Bearer ${accessToken}`
            }
        };

		// Create new API with the specifies access token
		this.api = new Request("https://owner-api.teslamotors.com/api/1", options);

		// Make sure we create a new API within a week or so
		this.apiInvalidAfter = new Date();
		this.apiInvalidAfter.setDate(this.apiInvalidAfter.getDate() + 7);

		this.debug(`This access token will expire ${this.apiInvalidAfter}.`);

		return this.api;				
	}

	async connect() {

		var api = await this.getAPI();
		var request = await api.get('vehicles');
		var vehicles = request.body.response;

		var vehicle = vehicles.find((item) => {
			return item.vin == this.vin;
		});

		if (vehicle == undefined) {
			throw new Error(`Vehicle ${this.vin} could not be found.`);
		}		

		this.vehicle = vehicle;
	}


	async request(method, path, options) {

		// Connect if not already done
		if (this.vehicle == undefined) {
			await this.connect();
		}

		var api = await this.getAPI();
		var then = new Date();

		var pause = (ms) => {
			return new Promise((resolve, reject) => {
				setTimeout(resolve, ms);
			});            
		};

		var wakeUp = async () => {
			var now = new Date();

			this.debug(`Sending wakeup to vehicle ${this.vin}...`);

			var reply = await api.post(`vehicles/${this.vehicle.id}/wake_up`);
			var response = reply.body.response;
	
			if (now.getTime() - then.getTime() > this.wakeupTimeout)
				throw new Error('Your Tesla cannot be reached within timeout period.');

			if (response.state == "online") {
				return response;
			}
			else {
				await pause(500);
				return await wakeUp();
			}
		}


		var path = `vehicles/${this.vehicle.id}/${path}`;
		var response = await api.request(method, path, options);
	
		switch(response.statusCode) {
			case 200: {
				break;
			}

			case 408:
			case 504: {
				await wakeUp();
				response = await api.request(method, path);
				break;
			}

			default: {
				throw new Error(`${response.statusMessage}. Status code ${response.statusCode}`);
			}
		}

		return response.body.response;
	}

	async get(path) {
		return await this.request('GET', path);
	}

	async post(path, body) {
		return await this.request('POST', path, {body:body});
	}

}
