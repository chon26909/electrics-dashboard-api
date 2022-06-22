import mongoose, { Schema, Document, SchemaOptions } from "mongoose";

interface ElectricDocument extends Document {
    name: string,
    watt: number;
    date: Date
}

const options: SchemaOptions = {
    toJSON: {
        transform(doc, ret) {
            delete ret._id,
            delete ret.__v;
        }
    },
    // timestamps: true
}

const userSchema = new Schema({
    name: { 
        type: String
    },
    watt: { 
        type: Number
    },
    date: { type : Date, default: Date.now }
}, options);

const Electric = mongoose.model<ElectricDocument>('electrics', userSchema);

export default Electric;