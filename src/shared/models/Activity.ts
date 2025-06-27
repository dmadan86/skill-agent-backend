import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    managerId: mongoose.Types.ObjectId;
    activityType: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: { type: String, required: true },
    content: { type: String, required: true },
}, { timestamps: true });

ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ managerId: 1, createdAt: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
