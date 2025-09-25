import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee"; // Restrict role to only these two
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["admin", "employee"], // Only allow admin or employee
    default: "employee"          // Default role will be employee
  },
});

// Prevent model overwrite during hot reload in Next.js
export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
