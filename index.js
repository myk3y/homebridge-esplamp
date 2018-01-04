var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-esplamp", "EspLamp", LampAccessory);
}

function LampAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.url = config["url"];
    this.lampID = config["lamp-id"];
    this.username = config["username"];
    this.password = config["password"];

    this.lampservice = new Service.LampMechanism(this.name);

    this.lampservice
        .getCharacteristic(Characteristic.LampCurrentState)
        .on('get', this.getState.bind(this));

    this.lampservice
        .getCharacteristic(Characteristic.LampTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));

    //this.battservice = new Service.BatteryService(this.name);

   /* this.battservice
        .getCharacteristic(Characteristic.BatteryLevel)
        .on('get', this.getBattery.bind(this));

    this.battservice
        .getCharacteristic(Characteristic.ChargingState)
        .on('get', this.getCharging.bind(this));

    this.battservice
        .getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getLowBatt.bind(this));*/

}

LampAccessory.prototype.getState = function(callback) {
    this.log("Getting current state...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lampid: this.lampID }
    }, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var state = json.state; // "on" or "off"
            this.log("Lamp state is %s", state);
            var on = state == "on";
            callback(null, on); // success
        } else {
            if (response && response.statusCode) {
                this.log("Error getting state (status code %s): %s", response.statusCode, err);
            }
            callback(err);
        }
    }.bind(this));
}

/*LampAccessory.prototype.getBattery = function(callback) {
    this.log("Getting current battery...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lampid: this.lampID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var batt = json.battery;
            this.log("Lamp battery is %s", batt);
            callback(null, batt); // success
        }
        else {
            if (response && response.statusCode) {
                this.log("Error getting battery (status code %s): %s", response.statusCode, err);
            }
            callback(err);
        }
    }.bind(this));
}

LampAccessory.prototype.getCharging = function(callback) {
    callback(null, Characteristic.ChargingState.NOT_CHARGING);
}

LampAccessory.prototype.getLowBatt = function(callback) {
    this.log("Getting current battery...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lampid: this.lampID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var batt = json.battery;
            this.log("Lamp battery is %s", batt);
            var low = (batt > 20) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL : Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
            callback(null, low); // success
        }
        else {
            if (response && response.statusCode) {
                this.log("Error getting battery (status code %s): %s", response.statusCode, err);
            }
            callback(err);
        }
    }.bind(this));
}
*/
LampAccessory.prototype.setState = function(state, callback) {
    var lampState = (state == Characteristic.LampTargetState.SECURED) ? "on" : "off";

    this.log("Set state to %s", lampState);

    request.post({
        url: this.url,
        form: { username: this.username, password: this.password, lampid: this.lampID, state: lampState }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            this.log("State change complete.");

            // we succeeded, so update the "current" state as well
            var currentState = (state == Characteristic.LampTargetState.SECURED) ?
                Characteristic.LampCurrentState.SECURED : Characteristic.LampCurrentState.UNSECURED;

            this.lampservice
                .setCharacteristic(Characteristic.LampCurrentState, currentState);

            var json = JSON.parse(body);
            var batt = json.battery;

            this.battservice
                .setCharacteristic(Characteristic.BatteryLevel, batt);

            callback(null); // success

            var self = this;
            setTimeout(function() {
                if (currentState == Characteristic.LampTargetState.UNSECURED) { 
                    self.lampservice
                        .setCharacteristic(Characteristic.LampTargetState, Characteristic.LampTargetState.SECURED);
                }
            }, 5000);
        }
        else {
            this.log("Error '%s' setting lamp state. Response: %s", err, body);
            callback(err || new Error("Error setting lamp state."));
        }
    }.bind(this));
},

LampAccessory.prototype.getServices = function() {
    return [this.lampservice, this.battservice];
}
