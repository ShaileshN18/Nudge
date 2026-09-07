import mongoose from "mongoose";

const TaskAttemptSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        userProjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserProject",
            required: true,
        },

        taskId: {
            type: mongoose.Schema.Types.ObjectId,
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
    mongoose.model("TaskAttempt", TaskAttemptSchema);