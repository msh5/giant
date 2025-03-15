import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';

interface SqlEditorProps {
  onExecute: (query: string) => void;
  initialValue?: string;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ onExecute, initialValue = '' }) => {
  const [query, setQuery] = useState<string>(initialValue);
  
  // Update query when initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleExecute = () => {
    onExecute(query);
  };

  return (
    <div className="sql-editor">
      <AceEditor
        mode="sql"
        theme="github"
        onChange={setQuery}
        name="sql-editor"
        editorProps={{ $blockScrolling: true }}
        value={query}
        width="100%"
        height="200px"
        fontSize={14}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
      />
      <button 
        onClick={handleExecute}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Execute Query
      </button>
    </div>
  );
};

export default SqlEditor;
