import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    course: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const Student = mongoose.model("Student", studentSchema);
