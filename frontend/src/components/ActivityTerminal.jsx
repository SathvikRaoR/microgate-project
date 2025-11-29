import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

/**
 * ActivityTerminal - Code-editor style terminal for displaying agent activity logs
 * @param {Object} props
 * @param {string[]} props.logs - Array of log strings to display
 * @param {string} props.theme - Theme ('dark' or 'light')
 */
export default function ActivityTerminal({ logs = [], theme = 'dark' }) {
  const terminalRef = useRef(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [showCursor, setShowCursor] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Animate new logs with fade-in effect
  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      const newLogs = logs.slice(displayedLogs.length);
      newLogs.forEach((log, index) => {
        setTimeout(() => {
          setDisplayedLogs(prev => [...prev, log]);
        }, index * 100); // Staggered animation
      });
    } else if (logs.length < displayedLogs.length) {
      // Handle log clear
      setDisplayedLogs(logs);
    }
  }, [logs, displayedLogs.length]);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // Cursor blink rate

    return () => clearInterval(interval);
  }, []);

  // Format timestamp
  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  // Extract actual log message if it's an object with message property
  const getLogMessage = (log) => {
    if (typeof log === 'string') return log;
    if (log && typeof log === 'object' && log.message) return log.message;
    return String(log);
  };

  // Parse log for special formatting (e.g., [SUCCESS], [ERROR], [INFO])
  const formatLog = (log, index) => {
    const logMessage = getLogMessage(log);
    const timestamp = getTimestamp();
    
    // Color coding based on log type
    let textColor = 'text-green-400';
    let prefix = '>';
    
    if (logMessage.includes('[ERROR]') || logMessage.includes('❌')) {
      textColor = 'text-red-400';
      prefix = '✗';
    } else if (logMessage.includes('[SUCCESS]') || logMessage.includes('✅')) {
      textColor = 'text-green-400';
      prefix = '✓';
    } else if (logMessage.includes('[INFO]') || logMessage.includes('ℹ️')) {
      textColor = 'text-cyan-400';
      prefix = 'ℹ';
    } else if (logMessage.includes('[WARN]') || logMessage.includes('⚠️')) {
      textColor = 'text-yellow-400';
      prefix = '⚠';
    }

    return (
      <div 
        key={index}
        className="animate-fadeIn opacity-0"
        style={{ 
          animation: 'fadeIn 0.3s ease-in forwards',
          animationDelay: `${index * 0.05}s`
        }}
      >
        <span className="text-gray-500">[{timestamp}]</span>
        <span className={`${textColor} mx-2`}>{prefix}</span>
        <span className={textColor}>{logMessage}</span>
      </div>
    );
  };

  const isDark = theme === 'dark';

  return (
    <div className="h-full flex flex-col">
      {/* Terminal Header */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${
        isDark 
          ? 'bg-black/40 border-green-500/30 text-green-400' 
          : 'bg-gray-100 border-purple-300 text-purple-700'
      }`}>
        <Terminal className="w-4 h-4" />
        <span className="text-sm font-mono font-bold">AGENT ACTIVITY LOG</span>
        <div className="ml-auto flex gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        className={`flex-1 p-4 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent ${
          isDark ? 'bg-black text-green-400' : 'bg-white text-gray-800'
        }`}
        style={{ 
          minHeight: '400px',
          maxHeight: '500px'
        }}
      >
        {displayedLogs.length === 0 ? (
          <div className="flex items-center">
            <span className="text-green-500/50">root@microgate:~$</span>
            <span className={`ml-2 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
          </div>
        ) : (
          <>
            {displayedLogs.map((log, index) => formatLog(log, index))}
            <div className="flex items-center mt-2">
              <span className="text-green-500/50">root@microgate:~$</span>
              <span className={`ml-2 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
            </div>
          </>
        )}
      </div>

      {/* Terminal Footer */}
      <div className={`px-4 py-1 border-t text-xs font-mono flex justify-between ${
        isDark 
          ? 'bg-black/40 border-green-500/30 text-green-500/50' 
          : 'bg-gray-100 border-purple-300 text-purple-500'
      }`}>
        <span>Lines: {displayedLogs.length}</span>
        <span>UTF-8 • LF • JavaScript</span>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.2);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.4);
        }
      `}</style>
    </div>
  );
}
