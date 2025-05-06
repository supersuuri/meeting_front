
/* models/ProjectTask.ts */
import mongoose, { Schema } from 'mongoose';

const ProjectTaskSchema = new Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  type: { type: String, enum: ['task', 'milestone'], default: 'task' },
  userId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.ProjectTask || mongoose.model('ProjectTask', ProjectTaskSchema);
