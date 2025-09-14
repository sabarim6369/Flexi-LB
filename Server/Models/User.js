import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
    notifications: {
    emailAlerts: { type: Boolean, default: true },
    serverDownAlerts: { type: Boolean, default: true },
    performanceAlerts: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
