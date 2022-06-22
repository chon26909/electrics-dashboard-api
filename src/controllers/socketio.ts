import { Server } from 'socket.io';

let socket: any;

export const setupSocket = (server: any) => {


    const io = new Server(server);

    io.of('/dashboard').on("connection", (client) => {
        socket = client;

        // socket.emit('socketID', socket.id);

    })



}

export const emit = (emit: string, data: any) => {

    if (socket) {
        socket.emit(emit, data);
    }
    return
}