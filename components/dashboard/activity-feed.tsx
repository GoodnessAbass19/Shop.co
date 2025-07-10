import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Activity = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4" aria-label="Recent activity feed">
          {activities.length === 0 ? (
            <li className="text-gray-500 text-sm">No recent activity.</li>
          ) : (
            activities.map((act) => (
              <li key={act.id} className="text-sm text-gray-800">
                <div>
                  {/* Optionally, show a badge or icon for act.type */}
                  <span className="font-medium">{act.message}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(act.timestamp).toLocaleString()}
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
