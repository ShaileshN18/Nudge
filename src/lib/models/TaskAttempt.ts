import mongoose, { Schema, Document } from "mongoose";

export interface ICriterionResult {
  title: string;
  status: "pass" | "fail" | "uncertain";
  evidence?: string;
  feedback?: string;
}

export interface ITaskAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  userProjectId: mongoose.Types.ObjectId;
  projectSlug: string;
  taskId?: string;
  taskOrder: number;
  taskTitle: string;
  status: "pass" | "fail" | "uncertain";
  score?: number;
  criteriaResults: ICriterionResult[];
  overallFeedback: string;
  bugs?: string[];
  missingRequirements?: string[];
  conceptualIssues?: string[];
  nextStep?: string;
  shouldAskForNudge?: boolean;
  codeSnapshot?: Array<{ path: string; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const CriterionResultSchema = new Schema<ICriterionResult>(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["pass", "fail", "uncertain"],
      required: true,
    },
    evidence: { type: String, default: "" },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

const TaskAttemptSchema = new Schema<ITaskAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userProjectId: {
      type: Schema.Types.ObjectId,
      ref: "UserProject",
      required: true,
      index: true,
    },
    projectSlug: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: String,
    },
    taskOrder: {
      type: Number,
      required: true,
      index: true,
    },
    taskTitle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pass", "fail", "uncertain"],
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    criteriaResults: [CriterionResultSchema],
    overallFeedback: {
      type: String,
      required: true,
    },
    bugs: [{ type: String }],
    missingRequirements: [{ type: String }],
    conceptualIssues: [{ type: String }],
    nextStep: { type: String },
    shouldAskForNudge: { type: Boolean, default: false },
    codeSnapshot: [
      {
        path: { type: String, required: true },
        content: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

TaskAttemptSchema.index({ userId: 1, projectSlug: 1, taskOrder: 1, createdAt: -1 });

export default mongoose.models.TaskAttempt ||
  mongoose.model<ITaskAttempt>("TaskAttempt", TaskAttemptSchema);
