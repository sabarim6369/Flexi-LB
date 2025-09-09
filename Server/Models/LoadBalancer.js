import mongoose from "mongoose";

const InstanceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true },
  instancename:{type:String,required:false},
  isHealthy: { type: Boolean, default: true },
  healthStatus: { 
    type: String, 
    enum: ["healthy", "degraded", "slow", "down"], 
    default: "healthy" 
  },

  weight: { type: Number, default: 1 },  
  metrics: {
    requests: { type: Number, default: 0 },
    failures: { type: Number, default: 0 },
    totalLatencyMs: { type: Number, default: 0 },
    lastLatency: { type: Number, default: 0 },
        hourlyRequests: { 
      type: Map, 
      of: Number, 
      default: {} 
    }  
  },
}, { _id: false });

const LBSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true, unique: true },
  algorithm: { 
    type: String, 
    enum: [
      "round_robin", 
      "least_conn", 
      "random", 
      "ip_hash", 
      "weighted_round_robin", 
      "least_response_time"
    ], 
    default: "round_robin" 
  },
  instances: { type: [InstanceSchema], default: [] },
  slug: { type: String, required: true, unique: true },
}, { timestamps: true });


export default mongoose.models.LoadBalancer || mongoose.model("LoadBalancer", LBSchema);
