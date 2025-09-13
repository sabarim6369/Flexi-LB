import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  message: { type: String, required: true },
  severity: { type: String, enum: ["info", "warning", "error"], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
