// MongoDB connection
import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  if (!mongoUri) throw new Error("MONGO_URI is required");
  mongoose.set("strictQuery", false);
  await mongoose.connect(mongoUri, {
    // useNewUrlParser/useUnifiedTopology are default with modern mongoose
  });
  console.log("MongoDB connected");
}
