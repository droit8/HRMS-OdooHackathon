import React, { useState, useEffect } from 'react';
import timeoffService from '../../services/timeoffService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import TimeOffRequestForm from './TimeOffRequestForm';
import { formatDate, getLeaveTypeLabel } from '../../utils/helpers';
import { HiPlus, HiCalendar } from 'react-icons/hi';

const TimeOffEmployee = () => {
  const [leaves, setLeaves] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await timeoffService.getMyLeaves();
      setLeaves(response.data.leaves);
      setAllocations(response.data.allocations);
    } catch (error) {
      console.error('Failed to fetch time off data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Time Off</h1>
        <button onClick={() => setShowRequestForm(true)} className="btn-primary flex items-center">
          <HiPlus className="w-4 h-4 mr-1" /> New
        </button>
      </div>

      {/* Allocation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AllocationCard
          title="Paid Time Off"
          total={allocations.paid_time_off?.total || 24}
          used={allocations.paid_time_off?.used || 0}
          remaining={allocations.paid_time_off?.remaining || 24}
          color="blue"
        />
        <AllocationCard
          title="Sick Leave"
          total={allocations.sick_leave?.total || 7}
          used={allocations.sick_leave?.used || 0}
          remaining={allocations.sick_leave?.remaining || 7}
          color="orange"
        />
        <AllocationCard
          title="Unpaid Leave"
          total="∞"
          used={allocations.unpaid_leave?.used || 0}
          remaining="∞"
          color="gray"
        />
      </div>

      {/* Leave Requests List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">My Leave Requests</h3>
        {leaves.length === 0 ? (
          <div className="text-center py-8">
            <HiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No leave requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {getLeaveTypeLabel(leave.leaveType)}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(leave.startDate)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(leave.endDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{leave.totalDays}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={leave.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {leave.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      <Modal
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        title="Time Off Request"
        size="md"
      >
        <TimeOffRequestForm
          onSuccess={() => {
            setShowRequestForm(false);
            fetchData();
          }}
          onCancel={() => setShowRequestForm(false)}
          allocations={allocations}
        />
      </Modal>
    </div>
  );
};

const AllocationCard = ({ title, total, used, remaining, color }) => {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-200 bg-orange-50',
    gray: 'border-gray-200 bg-gray-50'
  };
  const textColors = {
    blue: 'text-blue-700',
    orange: 'text-orange-700',
    gray: 'text-gray-700'
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <h4 className={`text-sm font-medium ${textColors[color]}`}>{title}</h4>
      <div className="mt-2">
        <span className={`text-2xl font-bold ${textColors[color]}`}>{remaining}</span>
        <span className="text-sm text-gray-500 ml-1">Days Available</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {used} used of {total} total
      </div>
    </div>
  );
};

export default TimeOffEmployee;