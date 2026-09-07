import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    goal: { type: String, required: true },
    targetFiles: [{ type: String }],
    evaluationCriteria: [{ type: String }],
  },
  { _id: true }
);

const FileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    content: { type: String, default: "" },
    type: { type: String },
    visible: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    targetTasks: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    track: {
      type: String,
      enum: ["frontend", "backend", "fullstack"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    tasks: [TaskSchema],
    files: [FileSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);