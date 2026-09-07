import mongoose, { Schema, Document } from "mongoose";

export interface ITask {
  order: number;
  title: string;
  description: string;
  goal: string;
  targetFiles?: string[];
  evaluationCriteria?: string[];
}

export interface IFile {
  path: string;
  content: string;
  type?: string;
  visible: boolean;
  editable: boolean;
  targetTasks?: mongoose.Types.ObjectId[];
}

export interface IProject extends Document {
  slug: string;
  title: string;
  description: string;
  track: "frontend" | "backend" | "fullstack";
  difficulty: "beginner" | "intermediate" | "advanced";
  tasks: ITask[];
  files: IFile[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
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

const FileSchema = new Schema<IFile>(
  {
    path: { type: String, required: true },
    content: { type: String, default: "" },
    type: { type: String },
    visible: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    targetTasks: [{ type: Schema.Types.ObjectId }],
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
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
  mongoose.model<IProject>("Project", ProjectSchema);
