import mongoose from "mongoose";

const ProjectTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  projectName: {
    type: String,
    required: [true, "Please provide a project name"],
  },
  taskName: {
    type: String,
    required: [true, "Please provide a task name"],
  },
  startDate: {
    type: Date,
    required: [true, "Please provide a start date"],
  },
  endDate: {
    type: Date,
    required: [true, "Please provide an end date"],
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  dependencies: {
    type: [String],
    default: [],
  },
  assignedTo: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "#2196F3",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ProjectTask ||
  mongoose.model("ProjectTask", ProjectTaskSchema);
