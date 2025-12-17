// Define the structure for a single timeline step
interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isLast: boolean;
}

/**
 * Renders a single step in the delivery timeline.
 */
const TimelineStep: React.FC<TimelineStepProps> = ({
  icon,
  title,
  status,
  isCurrent,
  isCompleted,
  isLast,
}) => {
  // Determine the color based on status
  const iconBgColor = isCompleted
    ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-100"
    : isCurrent
    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-100"
    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
  const iconStrokeColor = isCompleted
    ? "border-green-600 dark:border-green-400"
    : isCurrent
    ? "border-indigo-600 dark:border-indigo-400"
    : "border-gray-400 dark:border-gray-500";
  const textColor = isCompleted
    ? "text-green-800 dark:text-green-100"
    : "text-gray-800 dark:text-gray-100";
  const statusColor = isCompleted
    ? "text-green-600 dark:text-green-400"
    : isCurrent
    ? "text-indigo-600 dark:text-indigo-400"
    : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex relative pb-8">
      {/* Vertical Line Connector (Hidden for the last item) */}
      {!isLast && (
        <div
          className={`absolute top-0 left-4 w-0.5 h-full ${
            isCompleted ? "bg-green-300" : "bg-gray-200"
          }`}
          aria-hidden="true"
        />
      )}

      {/* Icon and Connector Dot */}
      <div className="flex flex-col justify-center items-center mr-4 z-10">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${iconBgColor} ${iconStrokeColor} shadow-sm`}
          // The dot/icon border is the visual indicator
        >
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="pt-1 flex-grow">
        <h3 className={`font-semibold text-base mb-0.5 ${textColor}`}>
          {title}
        </h3>
        <p className={`text-sm ${statusColor}`}>
          {!isCompleted ? `${status}` : "Completed"}
        </p>
      </div>
    </div>
  );
};

export default TimelineStep;
