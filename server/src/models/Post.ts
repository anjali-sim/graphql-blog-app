import mongoose, { Schema, Document } from "mongoose";

export type PostStatus = "DRAFT" | "PUBLISHED";

export interface IPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: PostStatus;
  author: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  tags: string[];
  likes: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    likes: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

PostSchema.index({ title: "text", content: "text", excerpt: "text" });

export const Post = mongoose.model<IPost>("Post", PostSchema);
