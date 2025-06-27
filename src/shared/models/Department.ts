// src/shared/models/Department.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  manager: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

DepartmentSchema.index({ name: 1, manager: 1 }); // no unique
// Create indexes for efficient queries
DepartmentSchema.index({ manager: 1 });
DepartmentSchema.index({ members: 1 });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);