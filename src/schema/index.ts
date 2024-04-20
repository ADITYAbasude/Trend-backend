import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import userType from "./types/user.type";
import userResolver from "./resolvers/user.resolver";
import postType from "./types/post.type";
import postResolver from "./resolvers/post.resolver";
import notificationType from "./types/notification.type";
import notificationResolver from "./resolvers/notification.resolver";

const typeDefs = mergeTypeDefs([userType, postType, notificationType ]);
const resolvers = mergeResolvers([userResolver, postResolver, notificationResolver]);

export { typeDefs, resolvers };
