import mongoose from "mongoose";

const UserProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    completedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

UserProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.models.UserProject ||
  mongoose.model("UserProject", UserProjectSchema);