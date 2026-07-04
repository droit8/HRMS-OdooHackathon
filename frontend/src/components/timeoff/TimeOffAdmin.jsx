import React, { useState, useEffect } from 'react';
import timeoffService from '../../services/timeoffService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { formatDate, getLeaveTypeLabel } from '../../utils/helpers';
import { HiSearch, HiCheck, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

const TimeOffAdmin = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('time_off'); // time_off | allocation
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await timeoffService.getAllLeaves(params);
      setLeaves(response.data.leaves);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await timeoffService.updateStatus(id, {
        status,
        adminComments: comment,
        rejectionReason: status === 'rejected' ? comment : ''
      });
      toast.success(`Leave ${status} successfully`);
      setShowModal(false);
      setComment('');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${status} leave`);
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (!search) return true;
    const name = `${leave.employee?.firstName} ${leave.employee?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="page-title">Time Off</h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('time_off')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'time_off' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Time Off
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'allocation' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Allocation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredLeaves.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No leave requests found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
                        {leave.employee?.firstName?.charAt(0)}{leave.employee?.lastName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(leave.startDate)}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(leave.endDate)}</td>
                  <td className="px-4 py-3 text-sm">{getLeaveTypeLabel(leave.leaveType)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{leave.totalDays}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={leave.status} />
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(leave._id, 'approved')}
                          className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          title="Approve"
                        >
                          <HiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowModal(true);
                          }}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Reject"
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Reject Leave Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to reject the leave request from{' '}
            <strong>{selectedLeave?.employee?.firstName} {selectedLeave?.employee?.lastName}</strong>?
          </p>
          <div>
            <label className="input-label">Reason (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field h-20 resize-none"
              placeholder="Enter rejection reason..."
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleStatusUpdate(selectedLeave._id, 'rejected')}
              className="btn-danger flex-1"
            >
              Reject
            </button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TimeOffAdmin;