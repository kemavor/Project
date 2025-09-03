import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface DeletionSchedule {
  id: number;
  scheduled_date: string;
  deletion_type: 'hard' | 'soft';
  reason?: string;
  notify_before_deletion: boolean;
  notification_days_before?: number;
  created_at: string;
}

interface DataExport {
  id: number;
  export_type: 'full' | 'profile' | 'learning_data' | 'documents';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data_format: 'json' | 'csv' | 'pdf';
  include_sensitive_data: boolean;
  created_at: string;
  completed_at?: string;
  download_url?: string;
}

export const EnhancedAccountManagement: React.FC = () => {
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deletionSchedule, setDeletionSchedule] = useState<DeletionSchedule | null>(null);
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeletionSchedule();
    loadDataExports();
  }, []);

  const loadDeletionSchedule = async () => {
    try {
      const response = await apiClient.getDeletionSchedule();
      if (response.success && response.data) {
        setDeletionSchedule(response.data);
      }
    } catch (error) {
      console.error('Failed to load deletion schedule:', error);
    }
  };

  const loadDataExports = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll use a mock approach
      setDataExports([]);
    } catch (error) {
      console.error('Failed to load data exports:', error);
    }
  };

  const handleSoftDelete = async (reason?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.softDeleteAccount(reason);
      if (response.success) {
        toast.success('Account has been soft deleted. You can reactivate it within 30 days.');
        setIsDeletionModalOpen(false);
        // Redirect to login or show reactivation option
      } else {
        toast.error(response.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      const response = await apiClient.reactivateAccount();
      if (response.success) {
        toast.success('Account reactivated successfully!');
        setDeletionSchedule(null);
      } else {
        toast.error(response.message || 'Failed to reactivate account');
      }
    } catch (error) {
      toast.error('Failed to reactivate account');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleDeletion = async (data: {
    scheduled_date: string;
    deletion_type: 'hard' | 'soft';
    reason?: string;
    notify_before_deletion?: boolean;
    notification_days_before?: number;
  }) => {
    setLoading(true);
    try {
      const response = await apiClient.scheduleAccountDeletion(data);
      if (response.success) {
        toast.success('Account deletion scheduled successfully');
        setIsScheduleModalOpen(false);
        loadDeletionSchedule();
      } else {
        toast.error(response.message || 'Failed to schedule deletion');
      }
    } catch (error) {
      toast.error('Failed to schedule deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async (reason?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.cancelScheduledDeletion(reason);
      if (response.success) {
        toast.success('Scheduled deletion cancelled');
        setDeletionSchedule(null);
      } else {
        toast.error(response.message || 'Failed to cancel deletion');
      }
    } catch (error) {
      toast.error('Failed to cancel deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExport = async (data: {
    export_type: 'full' | 'profile' | 'learning_data' | 'documents';
    include_sensitive_data?: boolean;
    data_format?: 'json' | 'csv' | 'pdf';
  }) => {
    setLoading(true);
    try {
      const response = await apiClient.requestDataExport(data);
      if (response.success) {
        toast.success('Data export requested. You will be notified when ready.');
        setIsExportModalOpen(false);
        loadDataExports();
      } else {
        toast.error(response.message || 'Failed to request export');
      }
    } catch (error) {
      toast.error('Failed to request export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
        
        {/* Soft Delete Section */}
        <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Soft Delete Account</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Temporarily deactivate your account. You can reactivate it within 30 days.
          </p>
          <button
            onClick={() => setIsDeletionModalOpen(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
          >
            Soft Delete Account
          </button>
        </div>

        {/* Scheduled Deletion Section */}
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Schedule Account Deletion</h4>
          <p className="text-sm text-red-700 mb-3">
            Schedule permanent deletion of your account for a future date.
          </p>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Schedule Deletion
          </button>
        </div>

        {/* Data Export Section */}
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Export Your Data</h4>
          <p className="text-sm text-blue-700 mb-3">
            Request a copy of your data in various formats.
          </p>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Request Data Export
          </button>
        </div>

        {/* Current Deletion Schedule */}
        {deletionSchedule && (
          <div className="mb-6 p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Scheduled Deletion</h4>
            <p className="text-sm text-orange-700 mb-2">
              Your account is scheduled for {deletionSchedule.deletion_type} deletion on{' '}
              {new Date(deletionSchedule.scheduled_date).toLocaleDateString()}
            </p>
            {deletionSchedule.reason && (
              <p className="text-sm text-orange-600 mb-3">Reason: {deletionSchedule.reason}</p>
            )}
            <div className="space-x-2">
              <button
                onClick={() => handleCancelDeletion()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
              >
                Cancel Deletion
              </button>
              {deletionSchedule.deletion_type === 'soft' && (
                <button
                  onClick={handleReactivate}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Reactivate Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Soft Delete Modal */}
      {isDeletionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Soft Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will temporarily deactivate your account. You can reactivate it within 30 days.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Reason for deletion (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="deletion-reason"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsDeletionModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = (document.getElementById('deletion-reason') as HTMLInputElement)?.value;
                  handleSoftDelete(reason);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Deletion Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Account Deletion</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deletion Date</label>
                <input
                  type="date"
                  id="scheduled-date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deletion Type</label>
                <select
                  id="deletion-type"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="soft">Soft Delete (recoverable)</option>
                  <option value="hard">Hard Delete (permanent)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  id="schedule-reason"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const scheduledDate = (document.getElementById('scheduled-date') as HTMLInputElement)?.value;
                  const deletionType = (document.getElementById('deletion-type') as HTMLSelectElement)?.value as 'hard' | 'soft';
                  const reason = (document.getElementById('schedule-reason') as HTMLInputElement)?.value;
                  
                  if (!scheduledDate) {
                    toast.error('Please select a deletion date');
                    return;
                  }
                  
                  handleScheduleDeletion({
                    scheduled_date: scheduledDate,
                    deletion_type: deletionType,
                    reason: reason || undefined,
                    notify_before_deletion: true,
                    notification_days_before: 7
                  });
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Data Export</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Export Type</label>
                <select
                  id="export-type"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">Full Data Export</option>
                  <option value="profile">Profile Data Only</option>
                  <option value="learning_data">Learning Data Only</option>
                  <option value="documents">Documents Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  id="data-format"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-sensitive"
                  className="mr-2"
                />
                <label htmlFor="include-sensitive" className="text-sm text-gray-700">
                  Include sensitive data
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const exportType = (document.getElementById('export-type') as HTMLSelectElement)?.value as 'full' | 'profile' | 'learning_data' | 'documents';
                  const dataFormat = (document.getElementById('data-format') as HTMLSelectElement)?.value as 'json' | 'csv' | 'pdf';
                  const includeSensitive = (document.getElementById('include-sensitive') as HTMLInputElement)?.checked;
                  
                  handleRequestExport({
                    export_type: exportType,
                    data_format: dataFormat,
                    include_sensitive_data: includeSensitive
                  });
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Requesting...' : 'Request Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
