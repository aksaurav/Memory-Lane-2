import mongoose, { mongo } from "mongoose";

const identitySchema = new mongoose.Schema({
  name: {
    type: String,
    default: `Unknown`,
  },
  // FaceDescriptor is an array of 128 numbers from face-api.js
  faceDescriptor: {
    type: [Number],
    required: true,
  },
  lastConversation: {
    type: String,
    default: "",
  },
  tags: [String], // Automated topics
  lastSeen: {
    type: Date,
    default: Date.now,
  },
});

const Identify = mongoose.model("Identify", identitySchema);
export default Identify;
