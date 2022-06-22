import mqtt, { MqttClient } from "mqtt";
import Electric from "../models/Electric.model";
import * as socket from './socketio';

let mqttService: MqttClient;


export const setMQTT = () => {
    mqttService = mqtt.connect(String(process.env.MQTT_BROKER));
}

export const subscriber = () => {

    const voltage = 220;
    const root_topic = 'don/electric/';

    mqttService.subscribe(root_topic + '#');

    mqttService.on('message', async (_topic, _message) => {

        try {
            const message = String(_message);
            const topic = String(_topic).replace(root_topic, '');
    
    
            const data = {
                name: topic,
                watt: (Number(message) * voltage).toFixed(2)
            }
    
            if (Number(data.watt) > 0) {
    
                socket.emit(topic, { watt: Number(data.watt), amp: Number(message) });
    
                await Electric.create(data);
            }
        } catch (error) {
            console.log(error);
        }

    })

    // setInterval(() => {
    //     mqttService.publish('don/electric/fan', String(0.168));
    // }, 5000);

    // setInterval(() => {
    //     mqttService.publish('don/electric/air', String(5));
    // }, 10000)
}