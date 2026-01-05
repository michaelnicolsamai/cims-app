"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
// Simple toast implementation
const toast = {
  success: (message: string) => alert(message),
  error: (message: string) => alert(message),
};
import Link from "next/link";
import { useRoutes } from "@/lib/hooks/use-routes";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
  readAt: string | null;
}

export function NotificationsView() {
  const routes = useRoutes();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const unreadOnly = filter === "unread";
      const res = await fetch(`/api/notifications?limit=100&unreadOnly=${unreadOnly}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds, markAsRead: true }),
      });

      if (res.ok) {
        toast.success("Notifications marked as read");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Notification deleted");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
        return "📦";
      case "PAYMENT_OVERDUE":
        return "💰";
      case "NEW_CUSTOMER":
        return "👤";
      case "BIG_SALE":
        return "🛒";
      case "CUSTOMER_CHURN_RISK":
        return "⚠️";
      case "SYSTEM_ALERT":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "PAYMENT_OVERDUE":
        return "bg-red-100 text-red-700 border-red-200";
      case "NEW_CUSTOMER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "BIG_SALE":
        return "bg-green-100 text-green-700 border-green-200";
      case "CUSTOMER_CHURN_RISK":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "SYSTEM_ALERT":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    if (notification.actionUrl) {
      // Handle internal routes
      const url = notification.actionUrl.startsWith("/")
        ? notification.actionUrl
        : routes.dashboard;
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all your system notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </Button>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && filter === "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500 text-center">
              {filter === "unread"
                ? "You have no unread notifications"
                : "You don't have any notifications yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getNotificationColor(notification.type)}`}
                        >
                          {notification.type.replace(/_/g, " ")}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(notification.createdAt), "PPp")}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead([notification.id]);
                        }}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

