import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, gql, useApolloClient } from '@apollo/client';
import { useParams } from 'react-router-dom';

const WorkspaceContext = createContext();

const GET_USER_WORKSPACES = gql`
  query GetUserWorkspaces {
    getUserWorkspaces {
      _id
      name
      description
      members {
        userId
        role
      }
    }
  }
`;

const GET_WORKSPACE = gql`
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

const GET_WORKSPACE_MEETINGS = gql`
  query GetWorkspaceMeetings($workspaceId: ID!) {
    getWorkspaceMeetings(workspaceId: $workspaceId) {
      _id
      title
      description
      host {
        _id
        username
        profilePicture
      }
      participants {
        _id
        username
        profilePicture
      }
      startTime
      endTime
      status
    }
  }
`;

export const WorkspaceProvider = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const client = useApolloClient();
  const params = useParams();
  
  const { data, loading, error, refetch } = useQuery(GET_USER_WORKSPACES);
  
  // Update active workspace based on URL parameter
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (params.workspaceId && (!activeWorkspace || activeWorkspace._id !== params.workspaceId)) {
        try {
          const { data } = await client.query({
            query: GET_WORKSPACE,
            variables: { id: params.workspaceId },
            fetchPolicy: 'network-only'
          });
          
          if (data?.getWorkspace) {
            setActiveWorkspace(data.getWorkspace);
          }
        } catch (err) {
          console.error('Error fetching workspace:', err);
        }
      }
    };
    
    if (params.workspaceId) {
      fetchWorkspace();
    }
  }, [params.workspaceId, client, activeWorkspace]);

  // Query for meetings when workspace changes
  const { data: meetingsData, refetch: refetchMeetings } = useQuery(GET_WORKSPACE_MEETINGS, {
    variables: { workspaceId: activeWorkspace?._id },
    skip: !activeWorkspace?._id,
    fetchPolicy: 'network-only',
    pollInterval: 30000 // Poll every 30 seconds to get updates on meetings
  });

  useEffect(() => {
    if (meetingsData?.getWorkspaceMeetings) {
      setMeetings(meetingsData.getWorkspaceMeetings);
    }
  }, [meetingsData]);

  // Join meeting
  const joinMeeting = (meeting) => {
    setActiveMeeting(meeting);
    setIsInMeeting(true);
  };

  // Leave meeting
  const leaveMeeting = () => {
    console.log("Leaving meeting and cleaning up in WorkspaceContext");
    setActiveMeeting(null);
    setIsInMeeting(false);
  };

  // Fetch meetings manually (for use after creating a meeting or receiving an invite)
  const fetchMeetings = async () => {
    if (activeWorkspace?._id) {
      try {
        const result = await refetchMeetings();
        if (result.data?.getWorkspaceMeetings) {
          setMeetings(result.data.getWorkspaceMeetings);
        }
      } catch (err) {
        console.error('Error fetching meetings:', err);
      }
    }
  };

  const workspaces = data?.getUserWorkspaces || [];

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        loading,
        error,
        refetchWorkspaces: refetch,
        activeWorkspace,
        setActiveWorkspace,
        meetings,
        activeMeeting,
        isInMeeting,
        joinMeeting,
        leaveMeeting,
        fetchMeetings,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);