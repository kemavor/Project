// components/LectureManager.tsx
import React, { useEffect, useState } from 'react';
import { getLectures, createLecture, type Lecture } from '../lib/api';
import { wsService } from '../lib/websocket';
import { formatDateTime, handleApiError } from '../lib/utils';
import toast from 'react-hot-toast';

const LectureManager: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load lectures on component mount
  useEffect(() => {
    loadLectures();
    
    // Set up WebSocket listeners for real-time updates
    wsService.on('lecture:status_change', (data) => {
      setLectures(prev => prev.map(lecture => 
        lecture.id === Number(data.lectureId)
          ? { ...lecture, status: data.status }
          : lecture
      ));
    });

    return () => {
      // Cleanup WebSocket listeners
      wsService.off('lecture:status_change', () => {});
    };
  }, []);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const response = await getLectures();
      if (response.data && Array.isArray(response.data)) {
        setLectures(response.data);
      }
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLecture = async (lectureData: {
    title: string;
    instructor: string;
    description: string;
    date: string;
    duration: number;
  }) => {
    try {
      setCreating(true);
      const response = await createLecture(lectureData);
      if (response.data) {
        setLectures(prev => [...prev, response.data as Lecture]);
      }
      toast.success('Lecture created successfully!');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setCreating(false);
    }
  };

  const joinLecture = (lectureId: string) => {
    wsService.joinLecture(lectureId);
    toast.success('Joined lecture');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading lectures...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lectures</h1>
        <button
          onClick={() => loadLectures()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lectures.map((lecture) => (
          <div
            key={lecture.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{lecture.title}</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  lecture.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : lecture.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {lecture.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-2">
              Instructor: {lecture.instructor}
            </p>
            <p className="text-gray-600 mb-2">
              Duration: {lecture.duration} minutes
            </p>
            <p className="text-gray-600 mb-4">
              Created: {lecture.createdAt ? formatDateTime(lecture.createdAt) : 'Unknown'}
            </p>

            {lecture.isLive && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">
                  Live ({lecture.viewerCount} viewers)
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => joinLecture(lecture.id.toString())}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Join
              </button>
              <button
                onClick={() => {/* Navigate to lecture details */}}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {lectures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No lectures found</p>
        </div>
      )}
    </div>
  );
};

export default LectureManager;