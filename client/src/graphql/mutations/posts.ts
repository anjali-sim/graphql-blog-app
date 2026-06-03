import { gql } from "@apollo/client";
import { POST_CARD_FRAGMENT, POST_DETAIL_FRAGMENT } from "../fragments";

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostDetail
    }
  }
  ${POST_DETAIL_FRAGMENT}
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      ...PostDetail
    }
  }
  ${POST_DETAIL_FRAGMENT}
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

export const PUBLISH_POST = gql`
  mutation PublishPost($id: ID!) {
    publishPost(id: $id) {
      ...PostCard
    }
  }
  ${POST_CARD_FRAGMENT}
`;

/**
 * likePost — used with optimistic updates.
 * The client immediately shows the incremented like count
 * before the server confirms, giving instant UI feedback.
 */
export const LIKE_POST = gql`
  mutation LikePost($id: ID!) {
    likePost(id: $id) {
      id
      likes
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      slug
      description
    }
  }
`;

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($userId: ID!, $role: Role!) {
    updateUserRole(userId: $userId, role: $role) {
      id
      username
      role
    }
  }
`;
