import DataLoader from "dataloader";
import { User } from "../models/User";
import { Category } from "../models/Category";

/**
 * DataLoaders batch and cache DB calls within a single request,
 * solving the N+1 query problem in GraphQL resolvers.
 *
 * Without DataLoader: fetching 10 posts triggers 10 separate author queries.
 * With DataLoader:    all 10 author IDs are batched into a single DB call.
 */

const batchUsers = async (ids: readonly string[]) => {
  const users = await User.find({ _id: { $in: ids as string[] } });
  const map = new Map(users.map((u) => [u._id.toString(), u]));
  return ids.map((id) => map.get(id) ?? null);
};

const batchCategories = async (ids: readonly string[]) => {
  const categories = await Category.find({ _id: { $in: ids as string[] } });
  const map = new Map(categories.map((c) => [c._id.toString(), c]));
  return ids.map((id) => map.get(id) ?? null);
};

export const createDataloaders = () => ({
  userLoader: new DataLoader<string, any>(batchUsers),
  categoryLoader: new DataLoader<string, any>(batchCategories),
});
