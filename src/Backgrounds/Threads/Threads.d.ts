declare module '@/Backgrounds/Threads/Threads' {
  import React from 'react';
  
  interface ThreadsProps {
    amplitude?: number;
    distance?: number;
    enableMouseInteraction?: boolean;
  }
  
  const Threads: React.FC<ThreadsProps>;
  export default Threads;
}
