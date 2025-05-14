
import { CheckCircle, Clock } from "lucide-react";

export function AutomaticSchedule() {
  return (
    <div className="flex items-center gap-4">
      <Clock className="text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">Automatic Weekly Summaries</p>
        <p className="text-xs text-muted-foreground">
          Runs every Sunday at midnight
        </p>
      </div>
      <CheckCircle className="ml-auto text-green-500" />
    </div>
  );
}
