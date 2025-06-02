// src/graphql/invitations.js
import { gql } from '@apollo/client';

export const GET_WORKSPACE_INVITATIONS = gql`
  query GetWorkspaceInvitations($workspaceId: ID!) {
    getWorkspaceInvitations(workspaceId: $workspaceId) {
      _id
      email
      status
      role
      expiresAt
      createdAt
      invitedBy {
        _id
        username
        profilePicture
      }
    }
  }
`;

export const GET_PENDING_INVITATIONS = gql`
  query GetPendingInvitations {
    getPendingInvitations {
      _id
      email
      role
      token
      expiresAt
      workspace {
        _id
        name
        description
        owner {
          _id
          username
          profilePicture
        }
      }
      invitedBy {
        _id
        username
        profilePicture
      }
    }
  }
`;

export const INVITE_USER_TO_WORKSPACE = gql`
  mutation InviteUserToWorkspace($input: WorkspaceInvitationInput!) {
    inviteUserToWorkspace(input: $input) {
      _id
      email
      status
      role
      expiresAt
    }
  }
`;

export const ACCEPT_WORKSPACE_INVITATION = gql`
  mutation AcceptWorkspaceInvitation($token: String!) {
    acceptWorkspaceInvitation(token: $token) {
      _id
      name
      description
    }
  }
`;

export const REJECT_WORKSPACE_INVITATION = gql`
  mutation RejectWorkspaceInvitation($token: String!) {
    rejectWorkspaceInvitation(token: $token)
  }
`;

export const CANCEL_WORKSPACE_INVITATION = gql`
  mutation CancelWorkspaceInvitation($invitationId: ID!) {
    cancelWorkspaceInvitation(invitationId: $invitationId)
  }
`;