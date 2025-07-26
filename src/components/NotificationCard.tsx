import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Clock, 
  Bell,
  ExternalLink,
  ArrowRight
} from "lucide-react";

interface NotificationCardProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  onDismiss?: (id: string) => void;
  className?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  action,
  onDismiss,
  className = ""
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          titleColor: "text-green-800 dark:text-green-200",
          messageColor: "text-green-700 dark:text-green-300"
        };
      case "error":
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          titleColor: "text-red-800 dark:text-red-200",
          messageColor: "text-red-700 dark:text-red-300"
        };
      case "warning":
        return {
          icon: AlertCircle,
          iconColor: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-800",
          titleColor: "text-amber-800 dark:text-amber-200",
          messageColor: "text-amber-700 dark:text-amber-300"
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          titleColor: "text-blue-800 dark:text-blue-200",
          messageColor: "text-blue-700 dark:text-blue-300"
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border ${config.borderColor} ${config.bgColor} ${className} animate-in slide-in-from-right-2 duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={`font-semibold text-sm ${config.titleColor} mb-1`}>
                  {title}
                </h4>
                <p className={`text-sm ${config.messageColor} mb-2`}>
                  {message}
                </p>
                
                {/* Timestamp */}
                {timestamp && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{timestamp}</span>
                  </div>
                )}
              </div>
              
              {/* Dismiss Button */}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Action Button */}
            {action && (
              <div className="mt-3">
                <Button
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Notification list component
interface NotificationListProps {
  notifications: NotificationCardProps[];
  onDismiss?: (id: string) => void;
  maxHeight?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onDismiss,
  maxHeight = "400px"
}) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ maxHeight, overflowY: "auto" }}>
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          {...notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Quick notification components for common use cases
export const SuccessNotification: React.FC<{
  title: string;
  message: string;
  onDismiss?: () => void;
}> = ({ title, message, onDismiss }) => (
  <NotificationCard
    id="success"
    type="success"
    title={title}
    message={message}
    onDismiss={onDismiss ? () => onDismiss() : undefined}
  />
);

export const ErrorNotification: React.FC<{
  title: string;
  message: string;
  onDismiss?: () => void;
}> = ({ title, message, onDismiss }) => (
  <NotificationCard
    id="error"
    type="error"
    title={title}
    message={message}
    onDismiss={onDismiss ? () => onDismiss() : undefined}
  />
);

export const WarningNotification: React.FC<{
  title: string;
  message: string;
  onDismiss?: () => void;
}> = ({ title, message, onDismiss }) => (
  <NotificationCard
    id="warning"
    type="warning"
    title={title}
    message={message}
    onDismiss={onDismiss ? () => onDismiss() : undefined}
  />
);

export const InfoNotification: React.FC<{
  title: string;
  message: string;
  onDismiss?: () => void;
}> = ({ title, message, onDismiss }) => (
  <NotificationCard
    id="info"
    type="info"
    title={title}
    message={message}
    onDismiss={onDismiss ? () => onDismiss() : undefined}
  />
); 