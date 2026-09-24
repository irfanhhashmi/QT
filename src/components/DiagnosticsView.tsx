import React, { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  data?: any;
  userAgent?: string;
}

const DiagnosticsView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'qt_diagnostics'), orderBy('timestamp', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        const fetchedLogs: LogEntry[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LogEntry));
        setLogs(fetchedLogs);
      } catch (e) {
        console.error('Failed to fetch diagnostics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl mb-4">WebRTC Diagnostics</h1>
      {loading ? <p>Loading...</p> : (
        <ul className="space-y-2">
          {logs.map(log => (
            <li key={log.id} className="border-b border-gray-700 pb-2">
              <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="ml-2 font-mono">{log.message}</span>
              {log.data && <pre className="text-xs bg-black p-2 mt-1">{JSON.stringify(log.data, null, 2)}</pre>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DiagnosticsView;
