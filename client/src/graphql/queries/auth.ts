import { gql } from "@apollo/client";
import { AUTHOR_FRAGMENT } from "../fragments";

export const GET_ME = gql`
  query GetMe {
    me {
      ...AuthorInfo
    }
  }
  ${AUTHOR_FRAGMENT}
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      ...AuthorInfo
    }
  }
  ${AUTHOR_FRAGMENT}
`;
