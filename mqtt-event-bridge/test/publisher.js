"use strict"
const mqtt = require('mqtt');
const request = require('request-promise-native');

const sampleEvent = {
    "eventType": "User.registered",
    "cloudEventsVersion": "0.1",
    "source": "https://example.com",
    "eventTime": "2019-03-14T02:30:16Z",
    "schemaURL": "https://example.com/ODATA_SPEC/",
    "contentType": "application/json",
    "data": { "myKey": "myValue" }
};

const delay = 1000

const envVariables = {
    mqqtUrl: process.env.MQTT_URL,
    oauthUrl: process.env.OAUTH_URL,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET
}

var runAsync = async () => {
    let oauthToken = "Bearer dummy"
    if (envVariables.oauthUrl) {
        try {
            oauthToken = await request({
                uri: envVariables.oauthUrl + "/oauth/token",
                method: 'POST',
                json: true,
                form: {
                    'grant_type': 'client_credentials',
                    'client_id': envVariables.clientId,
                    'client_secret': envVariables.clientSecret
                }
            });
            console.log(`Received token from OAuth server: ${oauthToken.access_token}`);
        } catch (error) {
            console.error(`Failed retrivening a token: ${JSON.stringify(error, null, 2)}`)
            return;
        }
    } else {
        console.log("Skipping token retrieval as no OAUTH_URL variable is configured")
    }

    let client = mqtt.connect(envVariables.mqqtUrl, {
        wsOptions: {
            headers: {
                'Authorization': `Bearer ${oauthToken.access_token}`
            }
        }
    });

    client.on('connect', function () {
        console.log("Connected");
        setInterval(sendMessage, delay);
    });

    client.on('reconnect', function () {
        console.log("Reconnected");
    });

    client.on('close', function (err) {
        console.log(`Connection closed, optional error is ${err}`);
    });

    client.on('error', function (error) {
        console.log("Error: " + JSON.stringify(error, null, 2))
    })

    function sendMessage() {
        client.publish('EXTFACTORY', JSON.stringify(sampleEvent), { qos: 1 });
        console.log('Message Sent');
    }

}

runAsync()
