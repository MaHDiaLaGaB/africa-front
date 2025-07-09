// // components/NotificationHandler.tsx
// 'use client';
// import React, { useState, type ReactElement } from 'react';
// import { useWebSocket } from '@/lib/useNotifications';
// import { useAuth } from '@/lib/auth';

// // Define the shape of a notification
// interface Notification {
//   id: number;
//   text: string;
//   type: 'info' | 'alert';
//   timestamp: string;
// }

// // Define the expected shape of incoming WS messages
// interface WSData {
//   message: string;
//   type?: 'info' | 'alert';
// }

// export default function NotificationHandler(): ReactElement | null {
//   const { user } = useAuth();
//   const [notifications, setNotifications] = useState<Notification[]>([]);

//   // Handle incoming WebSocket data
//   const handleNewMessage = (data: WSData): void => {
//     setNotifications(prev => [
//       ...prev,
//       {
//         id: Date.now(),
//         text: data.message,
//         type: data.type ?? 'info',
//         timestamp: new Date().toLocaleTimeString(),
//       }
//     ]);

//     // Auto-remove oldest notification after 5 seconds
//     setTimeout(() => {
//       setNotifications(prev => prev.slice(1));
//     }, 5000);
//   };

//   // Initialize WebSocket; no-op if userId is null
//   useWebSocket(user?.id?.toString() ?? null, handleNewMessage);

//   if (!user) return null;

//   return (
//     <div className="fixed bottom-4 right-4 max-w-md w-full z-50">
//       {notifications.map(notif => (
//         <div 
//           key={notif.id}
//           className={`mb-2 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
//             notif.type === 'alert' 
//               ? 'bg-red-100 border-red-300' 
//               : 'bg-blue-100 border-blue-300'
//           }`}>
//           <p className="font-medium">{notif.text}</p>
//           <span className="text-xs text-gray-500 block mt-1">
//             {notif.timestamp}
//           </span>
//         </div>
//       ))}
//     </div>
//   );
// }
