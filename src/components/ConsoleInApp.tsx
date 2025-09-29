// src/components/ConsoleInApp.tsx
import { useState, useEffect } from 'react';

const ConsoleInApp = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
    };

    const addToLogs = (type: string, messages: any[]) => {
      const formattedMessages = messages.map(msg => {
        if (typeof msg === 'object') return JSON.stringify(msg, null, 2);
        return String(msg);
      }).join(' ');

      const logEntry = `[${type.toUpperCase()}] ${formattedMessages}`;
      setLogs(prevLogs => [...prevLogs, logEntry]);
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      addToLogs('log', args);
    };
    console.error = (...args) => {
      originalConsole.error(...args);
      addToLogs('error', args);
    };
    console.warn = (...args) => {
      originalConsole.warn(...args);
      addToLogs('warn', args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    };
  }, []); // Empty array ensures this runs only once

  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
    right: '10px',
    height: '200px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '14px',
    overflowY: 'scroll',
    border: '1px solid #444',
    borderRadius: '4px',
    zIndex: 9999,
  };

  const errorStyle: React.CSSProperties = { color: '#ff8a8a' };
  const warnStyle: React.CSSProperties = { color: '#ffd18a' };

  return (
    <div style={containerStyles}>
      <pre>
        {logs.map((log, index) => {
          const style = log.startsWith('[ERROR]') ? errorStyle : log.startsWith('[WARN]') ? warnStyle : {};
          return <div key={index} style={style}>{log}</div>;
        })}
      </pre>
    </div>
  );
};

export default ConsoleInApp;
