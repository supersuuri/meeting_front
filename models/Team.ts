import mongoose, { Schema } from "mongoose";

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: String, required: true }, // Owner's user ID
    members: [{ type: String }], // Array of member user IDs
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
