import mongoose from "mongoose";

/*
 LoadBalancer document structure:
 {
   name: String,
   owner: ObjectId (User),
   endpoint: String, // logical path like "/flexilb/lb1"
   instances: [
     {
       id: String,
       url: String,
       isHealthy: Boolean,
       metrics: { requests: Number, failures: Number, totalLatencyMs: Number }
     }
   ],
   createdAt, updatedAt
 }
*/
const InstanceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true },
  isHealthy: { type: Boolean, default: true },
  metrics: {
    requests: { type: Number, default: 0 },
    failures: { type: Number, default: 0 },
    totalLatencyMs: { type: Number, default: 0 },
  },
}, { _id: false });

const LBSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true, unique: true },
  algorithm: { type: String, enum: ["round_robin", "least_conn", "random"], default: "round_robin" },
  instances: { type: [InstanceSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.LoadBalancer || mongoose.model("LoadBalancer", LBSchema);
