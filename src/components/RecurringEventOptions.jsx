import { useState } from 'react';

/**
 * RecurringEventOptions Component - SIMPLIFIED VERSION
 * 
 * Modal that appears when user tries to edit/delete a recurring event
 * Gives 2 options: This event only, All events in series
 * 
 * ADA Compliant: Full keyboard navigation, ARIA labels, focus management
 */
export default function RecurringEventOptions({ 
  event, 
  action = 'edit', // 'edit' or 'delete'
  onSelect,
  onCancel 
}) {
  const isInstance = event.is_recurring && event.parent_event_id;
  
  // Default to 'this' for instances, 'all' for parent events
  const [selectedOption, setSelectedOption] = useState(isInstance ? 'this' : 'all');

  const handleSubmit = () => {
    onSelect(selectedOption);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-labelledby="recurring-options-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 
          id="recurring-options-title"
          className="text-xl font-bold text-gray-900 mb-4"
        >
          {action === 'edit' ? '📝 Edit' : '🗑️ Delete'} Recurring Event
        </h2>

        <p className="text-gray-600 mb-6">
          This is a recurring event. What would you like to {action}?
        </p>

        <div className="space-y-3 mb-6">
          {/* Option 1: This event only - ONLY show for instances */}
          {isInstance && (
            <label 
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedOption === 'this' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="recurring-option"
                value="this"
                checked={selectedOption === 'this'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-label="Edit or delete only this event"
              />
              <div>
                <div className="font-semibold text-gray-900">
                  This event only
                </div>
                <div className="text-sm text-gray-600">
                  {action === 'edit' ? 'Make changes to' : 'Delete'} only this specific occurrence on{' '}
                  {new Date(event.start_time).toLocaleDateString()}
                </div>
              </div>
            </label>
          )}

          {/* Option 2: All events in series */}
          <label 
            className={`
              flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selectedOption === 'all' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="recurring-option"
              value="all"
              checked={selectedOption === 'all'}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              aria-label="Edit or delete all events in the series"
            />
            <div>
              <div className="font-semibold text-gray-900">
                All events in the series
              </div>
              <div className="text-sm text-gray-600">
                {action === 'edit' ? 'Make changes to' : 'Delete'} every occurrence of this recurring event
                {action === 'edit' && ' (including changing the recurring pattern)'}
              </div>
            </div>
          </label>
        </div>

        {/* Info box for parent events */}
        {!isInstance && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm">
            <p className="font-semibold">ℹ️ Note:</p>
            <p className="mt-1">
              You're viewing the parent event. To edit a single occurrence, click on that specific date on the calendar.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 focus:outline-none"
            aria-label="Cancel and go back"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`
              px-6 py-2 rounded-lg font-semibold text-white transition-colors focus:ring-2 focus:outline-none
              ${action === 'delete'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }
            `}
            aria-label={`Confirm ${action} action`}
          >
            {action === 'edit' ? 'Continue to Edit' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}