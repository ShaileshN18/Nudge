import mongoose, { Schema, Document } from "mongoose";

export interface ITaskAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  userProjectId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  status: "passed" | "failed";
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskAttemptSchema = new Schema<ITaskAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userProjectId: {
      type: Schema.Types.ObjectId,
      ref: "UserProject",
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["passed", "failed"],
      required: true,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.TaskAttempt ||
  mongoose.model<ITaskAttempt>("TaskAttempt", TaskAttemptSchema);
