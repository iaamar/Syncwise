// src/graphql/accessRequests.js
import { gql } from '@apollo/client';

export const GET_WORKSPACE_ACCESS_REQUESTS = gql`
  query GetWorkspaceAccessRequests($workspaceId: ID!) {
    getWorkspaceAccessRequests(workspaceId: $workspaceId) {
      _id
      user {
        _id
        username
        email
        profilePicture
      }
      status
      message
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENDING_WORKSPACE_REQUESTS = gql`
  query GetPendingWorkspaceRequests {
    getPendingWorkspaceRequests {
      _id
      workspaceId {
        _id
        name
        description
      }
      user {
        _id
        username
        email
        profilePicture
      }
      status
      createdAt
    }
  }
`;

export const REQUEST_WORKSPACE_ACCESS = gql`
  mutation RequestWorkspaceAccess($workspaceId: ID!, $message: String) {
    requestWorkspaceAccess(workspaceId: $workspaceId, message: $message) {
      _id
      status
    }
  }
`;

export const APPROVE_WORKSPACE_ACCESS_REQUEST = gql`
  mutation ApproveWorkspaceAccessRequest($requestId: ID!) {
    approveWorkspaceAccessRequest(requestId: $requestId) {
      _id
      status
    }
  }
`;

export const REJECT_WORKSPACE_ACCESS_REQUEST = gql`
  mutation RejectWorkspaceAccessRequest($requestId: ID!) {
    rejectWorkspaceAccessRequest(requestId: $requestId) {
      _id
      status
    }
  }
`;