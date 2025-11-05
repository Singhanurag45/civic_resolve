import { Schema, model, Document } from "mongoose";

interface CounterDocument extends Document {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<CounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const CounterModel = model<CounterDocument>("Counter", CounterSchema);


