import mongoose, { Schema, Document } from "mongoose";

export interface IUserProjectFile {
  path: string;
  content: string;
}

export interface IUserProject extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  files: IUserProjectFile[];
  currentTaskId?: mongoose.Types.ObjectId;
  completedTasks: mongoose.Types.ObjectId[];
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
    files: [
      {
        path: { type: String, required: true },
        content: { type: String, default: "" },
      },
    ],
    currentTaskId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    completedTasks: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

UserProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.models.UserProject ||
  mongoose.model<IUserProject>("UserProject", UserProjectSchema);
