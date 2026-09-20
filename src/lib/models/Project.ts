import mongoose, { Schema, Document } from "mongoose";

export interface ITask {
  _id?: string;
  order: number;
  title: string;
  description: string;
  instructions?: string;
  goal: string;
  targetFiles: string[];
  evaluationCriteria: string[];
  concepts?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface IFile {
  path: string;
  content: string;
  type?: string;
  visible?: boolean;
  editable?: boolean;
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
    instructions: { type: String },
    goal: { type: String, required: true },
    targetFiles: { type: [String], required: true, default: [] },
    evaluationCriteria: [{ type: String, required: true }],
    concepts: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
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
