"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterModel = void 0;
const mongoose_1 = require("mongoose");
const CounterSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
});
exports.CounterModel = (0, mongoose_1.model)("Counter", CounterSchema);
