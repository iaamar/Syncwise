// src/graphql/workspace.js
import { gql } from '@apollo/client';

export const GET_USER_WORKSPACES = gql`
  query GetUserWorkspaces {
    getUserWorkspaces {
      _id
      name
      description
      owner {
        _id
        username
        profilePicture
      }
      members {
        userId
        role
      }
      createdAt
    }
  }
`;

export const GET_WORKSPACE = gql`
  query GetWorkspace($id: ID!) {
    getWorkspace(id: $id) {
      _id
      name
      description
      owner {
        _id
        username
        profilePicture
      }
      members {
        userId
        role
      }
      createdAt
    }
  }
`;

export const GET_WORKSPACE_MEMBERS = gql`
  query GetWorkspaceMembers($workspaceId: ID!) {
    getWorkspaceMembers(workspaceId: $workspaceId) {
      _id
      username
      email
      profilePicture
      status
    }
  }
`;

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: WorkspaceInput!) {
    createWorkspace(input: $input) {
      _id
      name
      description
    }
  }
`;

export const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($id: ID!, $input: WorkspaceInput!) {
    updateWorkspace(id: $id, input: $input) {
      _id
      name
      description
    }
  }
`;

export const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: ID!) {
    deleteWorkspace(id: $id)
  }
`;

export const ADD_WORKSPACE_MEMBER = gql`
  mutation AddWorkspaceMember($workspaceId: ID!, $userId: ID!, $role: String) {
    addWorkspaceMember(workspaceId: $workspaceId, userId: $userId, role: $role) {
      _id
      members {
        userId
        role
      }
    }
  }
`;

export const REMOVE_WORKSPACE_MEMBER = gql`
  mutation RemoveWorkspaceMember($workspaceId: ID!, $userId: ID!) {
    removeWorkspaceMember(workspaceId: $workspaceId, userId: $userId) {
      _id
      members {
        userId
        role
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($workspaceId: ID!, $userId: ID!, $role: String!) {
    updateMemberRole(workspaceId: $workspaceId, userId: $userId, role: $role) {
      _id
      members {
        userId
        role
      }
    }
  }
`;