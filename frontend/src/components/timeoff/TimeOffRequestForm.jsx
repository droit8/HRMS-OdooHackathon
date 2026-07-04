import React, { useState } from 'react';
import timeoffService from '../../services/timeoffService';
import toast from 'react-hot-toast';
import { HiUpload } from 'react-icons/hi';

const TimeOffRequestForm = ({ onSuccess, onCancel, allocations }) => {
  const [formData, setFormData] = useState({
    leaveType: 'paid_time_off',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select date range');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const data = { ...formData };
      if (attachment) {
        data.attachment = attachment;
      }
      await timeoffService.apply(data);
      toast.success('Leave request submitted!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Calculate days
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diff = Math.abs(new Date(formData.endDate) - new Date(formData.startDate));
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Leave Type */}
      <div>
        <label className="input-label">Time Off Type</label>
        <select
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="input-field"
        >
          <option value="paid_time_off">Paid Time Off ({allocations.paid_time_off?.remaining || 0} remaining)</option>
          <option value="sick_leave">Sick Leave ({allocations.sick_leave?.remaining || 0} remaining)</option>
          <option value="unpaid_leave">Unpaid Leave</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">From</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="input-label">To</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            className="input-field"
            required
          />
        </div>
      </div>

      {/* Days count */}
      {calculateDays() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          Total: <strong>{calculateDays()} day(s)</strong>
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="input-label">Reason</label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="input-field h-20 resize-none"
          placeholder="Optional reason for leave..."
        />
      </div>

      {/* Attachment (for sick leave) */}
      {formData.leaveType === 'sick_leave' && (
        <div>
          <label className="input-label">Attachment (Sick Leave Certificate)</label>
          <div className="flex items-center space-x-3">
            <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <HiUpload className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                {attachment ? attachment.name : 'Choose file'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex space-x-3 pt-4">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Discard
        </button>
      </div>
    </form>
  );
};

export default TimeOffRequestForm;