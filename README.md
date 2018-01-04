# EspLamp Plugin

Example config.json:

    {
      "accessories": [
        {
            "accessory": "EspLamp",
            "name": "Lamp",
            "url": "your-custom-or-homegrown-service-url",
			"lamp-id": "1",
            "username" : "your-username",
			"password" : "your-password"
        }
      ]
    }

This plugin supports lamps controlled by any custom HTTP endpoint via GET (to get state, either "on" or "off"), and POST (to set new state, same two values). The "lamp-id", "username" and "password" parameters are passed along to "url" in each GET request. The same parameters plus "state" are passed along to "url" in each POST request.


