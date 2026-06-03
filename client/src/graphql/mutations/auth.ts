import { gql } from "@apollo/client";
import { AUTHOR_FRAGMENT } from "../fragments";

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...AuthorInfo
      }
    }
  }
  ${AUTHOR_FRAGMENT}
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...AuthorInfo
      }
    }
  }
  ${AUTHOR_FRAGMENT}
`;
