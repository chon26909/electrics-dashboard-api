import express, { Application } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import * as mqtt from './controllers/mqtt';
import * as socket from './controllers/socketio';
import { getElectrics, refreshPerMinute } from './controllers/electrics';

const app: Application = express();


const httpServer = http.createServer(app);

const port = process.env.PORT || 4000;

mongoose.connect(String(process.env.MONGO_URL), {
}).then(() => {
    console.log('Connnect MongoDB Successfully');
}).catch((err: any) => {
    console.log(err.message)
})

const allowedOrigins = ['*'];
const options: cors.CorsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use(cors(options));

socket.setupSocket(httpServer);
mqtt.setMQTT();
mqtt.subscriber();

// refreshPerMinute(5);


app.get('/electrics', getElectrics);


httpServer.listen(port, () => { 
    console.clear();
    console.log('server running port', port);    
})

