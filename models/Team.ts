import mongoose, { Schema } from "mongoose";

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Changed type and added ref
    members: [{ type: Schema.Types.ObjectId, ref: "User" }], // Changed type and added ref
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
