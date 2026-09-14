import mongoose, { Schema, Document } from "mongoose";

export interface IUserProjectFile {
  path: string;
  content: string;
}

export interface IUserProject extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  projectSlug: string;
  files: IUserProjectFile[];
  currentTaskIndex: number;
  currentTaskId?: string;
  completedTasks: string[];
  activeFilePath?: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserProjectSchema = new Schema<IUserProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectSlug: {
      type: String,
      required: true,
      index: true,
    },
    files: [
      {
        path: { type: String, required: true },
        content: { type: String, default: "" },
      },
    ],
    currentTaskIndex: {
      type: Number,
      default: 0,
    },
    currentTaskId: {
      type: String,
      required: false,
    },
    completedTasks: [
      {
        type: String,
      },
    ],
    activeFilePath: {
      type: String,
      default: "",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

UserProjectSchema.index({ userId: 1, projectSlug: 1 }, { unique: true });
UserProjectSchema.index({ userId: 1, projectId: 1 });

export default mongoose.models.UserProject ||
  mongoose.model<IUserProject>("UserProject", UserProjectSchema);
