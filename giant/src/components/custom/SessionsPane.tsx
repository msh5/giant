import React, { useState } from 'react';

export interface Session {
  id: string;
  name: string;
  query: string;
  results: any[];
  jobInfo: any;
  createdAt: Date;
  updatedAt?: Date;
}

interface SessionsPaneProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: () => void;
  onSessionDelete: (sessionId: string) => void;
}

const SessionsPane: React.FC<SessionsPaneProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionCreate,
  onSessionDelete
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sessions-pane border-r border-gray-200 bg-gray-50 ${isCollapsed ? 'w-12' : 'w-64'} transition-all duration-300 flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && <h2 className="text-lg font-semibold">Sessions</h2>}
        <button 
          onClick={toggleCollapse}
          className="p-1 rounded hover:bg-gray-200"
          aria-label={isCollapsed ? "Expand sessions pane" : "Collapse sessions pane"}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No sessions yet</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      className={`w-full text-left p-3 flex items-center justify-between hover:bg-gray-100 ${
                        activeSessionId === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <div className="truncate">
                        <div className="font-medium">{session.name}</div>
                        <div className="text-xs text-gray-500">
                          {session.createdAt.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSessionDelete(session.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Delete session"
                      >
                        ×
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={onSessionCreate}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center"
            >
              <span className="mr-1">+</span> New Session
            </button>
          </div>
        </>
      )}
      
      {isCollapsed && (
        <div className="flex flex-col items-center pt-4">
          <button
            onClick={onSessionCreate}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center mb-4"
            aria-label="New session"
          >
            +
          </button>
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`w-8 h-8 mb-2 rounded-full flex items-center justify-center ${
                activeSessionId === session.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => onSessionSelect(session.id)}
              title={session.name}
            >
              {session.name.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPane;
