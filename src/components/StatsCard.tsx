import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon,
  BookOpen,
  Users,
  Target,
  Activity
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-blue-600",
  description,
  trend = "neutral",
  className = ""
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600 dark:text-green-400";
      case "decrease":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangePrefix = () => {
    switch (changeType) {
      case "increase":
        return "+";
      case "decrease":
        return "";
      default:
        return "";
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {change !== undefined && (
                  <span className={`text-sm font-medium ${getChangeColor()}`}>
                    {getChangePrefix()}{change}%
                  </span>
                )}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {value}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {title}
            </p>
            
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {description}
              </p>
            )}
          </div>
          
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
        </div>
      </CardContent>
    </Card>
  );
};

// Specialized stats cards for common use cases
export const CourseStatsCard: React.FC<{
  value: number;
  change?: number;
  title?: string;
}> = ({ value, change, title = "Total Courses" }) => (
  <StatsCard
    title={title}
    value={value}
    change={change}
    changeType={change && change > 0 ? "increase" : change && change < 0 ? "decrease" : "neutral"}
    icon={BookOpen}
    iconColor="text-blue-600"
    trend={change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"}
  />
);

export const StudentStatsCard: React.FC<{
  value: number;
  change?: number;
  title?: string;
}> = ({ value, change, title = "Enrolled Students" }) => (
  <StatsCard
    title={title}
    value={value}
    change={change}
    changeType={change && change > 0 ? "increase" : change && change < 0 ? "decrease" : "neutral"}
    icon={Users}
    iconColor="text-green-600"
    trend={change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"}
  />
);

export const ProgressStatsCard: React.FC<{
  value: number;
  change?: number;
  title?: string;
}> = ({ value, change, title = "Completion Rate" }) => (
  <StatsCard
    title={title}
    value={`${value}%`}
    change={change}
    changeType={change && change > 0 ? "increase" : change && change < 0 ? "decrease" : "neutral"}
    icon={Target}
    iconColor="text-purple-600"
    trend={change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"}
  />
);

export const ActivityStatsCard: React.FC<{
  value: number;
  change?: number;
  title?: string;
}> = ({ value, change, title = "Active Sessions" }) => (
  <StatsCard
    title={title}
    value={value}
    change={change}
    changeType={change && change > 0 ? "increase" : change && change < 0 ? "decrease" : "neutral"}
    icon={Activity}
    iconColor="text-orange-600"
    trend={change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"}
  />
); 