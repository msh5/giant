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
  onSettingsClick?: () => void;
}

const SessionsPane: React.FC<SessionsPaneProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionCreate,
  onSessionDelete,
  onSettingsClick
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sessions-pane border-r border-gray-200 bg-gray-50 ${isCollapsed ? 'w-12' : 'w-64'} transition-all duration-300 flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && <h2 className="text-lg font-semibold">Sessions</h2>}
      </div>
      
      {!isCollapsed && (
        <>
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={onSessionCreate}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center"
            >
              <span className="mr-1">+</span> New Session
            </button>
          </div>
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
          <div className="p-3 border-t border-gray-200 flex items-center justify-between">
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            )}
            <button 
              onClick={toggleCollapse}
              className="p-1 rounded hover:bg-gray-200"
              aria-label={isCollapsed ? "Expand sessions pane" : "Collapse sessions pane"}
            >
              {isCollapsed ? '→' : '←'}
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
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="w-8 h-8 mt-auto mb-4 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          <button 
            onClick={toggleCollapse}
            className="p-1 rounded hover:bg-gray-200 mb-2"
            aria-label={isCollapsed ? "Expand sessions pane" : "Collapse sessions pane"}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionsPane;
