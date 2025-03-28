import React from 'react';
import { Plus } from 'lucide-react';
import { Meeting } from '../types/crm';
import { AddMeetingModal } from './modals/AddMeetingModal';

interface MeetingsSectionProps {
  meetings: Meeting[];
  showAddMeeting: boolean;
  onShowAddMeeting: (show: boolean) => void;
  onAddMeeting: (e: React.FormEvent) => void;
  newMeeting: Meeting;
  onMeetingChange: (meeting: Partial<Meeting>) => void;
}

export const MeetingsSection: React.FC<MeetingsSectionProps> = ({
  meetings,
  showAddMeeting,
  onShowAddMeeting,
  onAddMeeting,
  newMeeting,
  onMeetingChange,
}) => {
  return (
    <>
      <div className="bg-white shadow rounded-lg p-6 col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Meetings</h2>
          <button
            onClick={() => onShowAddMeeting(true)}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Meeting
          </button>
        </div>

        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="border rounded-md p-3 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium">{meeting.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(meeting.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  meeting.status === 'completed' ? 'bg-success-50 text-success-700' :
                  meeting.status === 'cancelled' ? 'bg-danger-50 text-danger-700' :
                  'bg-warning-50 text-warning-700'
                }`}>
                  {meeting.status}
                </span>
              </div>
              {meeting.notes && (
                <p className="text-sm text-gray-600 mt-2">{meeting.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddMeeting && (
        <AddMeetingModal
          meeting={newMeeting}
          onClose={() => onShowAddMeeting(false)}
          onSubmit={onAddMeeting}
          onChange={onMeetingChange}
        />
      )}
    </>
  );
};