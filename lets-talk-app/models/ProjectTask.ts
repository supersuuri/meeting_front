import mongoose from "mongoose";

const ProjectTaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  progress: { type: Number, default: 0 },
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ["task", "milestone"], default: "task" },
  dependencies: { type: [String], default: [] },
  isDisabled: { type: Boolean, default: false },
  styles: {
    progressColor: { type: String },
    progressSelectedColor: { type: String },
  },
});

export default mongoose.models.ProjectTask || mongoose.model("ProjectTask", ProjectTaskSchema);
