import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Share2,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  Check,
  FileSignature,
} from 'lucide-react';
import { useLandelaNotifications, type LandelaNotification } from '@/hooks/useLandelaNotifications';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'memo_assigned':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'action_required':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'document_shared':
      return <Share2 className="h-4 w-4 text-teal-500" />;
    case 'approval_request':
      return <FileSignature className="h-4 w-4 text-orange-500" />;
    case 'deadline_reminder':
      return <Clock className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-l-red-500 bg-red-50/50';
    case 'high':
      return 'border-l-4 border-l-amber-500 bg-amber-50/50';
    case 'normal':
      return 'border-l-4 border-l-blue-500';
    case 'low':
      return 'border-l-4 border-l-gray-300';
    default:
      return '';
  }
};

interface NotificationItemProps {
  notification: LandelaNotification;
  onMarkAsRead: (id: string) => void;
  onClick: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
        getPriorityStyle(notification.priority)
      } ${!notification.is_read ? 'bg-primary/5' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.notification_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            {notification.sender_name && (
              <span>{notification.sender_name}</span>
            )}
            <span>•</span>
            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

interface LandelaNotificationsPanelProps {
  compact?: boolean;
}

export function LandelaNotificationsPanel({ compact = false }: LandelaNotificationsPanelProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, refresh } = useLandelaNotifications();

  const handleNotificationClick = (notification: LandelaNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.document_id) {
      navigate(`/landela?document=${notification.document_id}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={refresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Landela DMS
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs px-1.5">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No document notifications</p>
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[200px]' : 'h-[300px]'}>
            <div className="space-y-2 pr-2">
              <AnimatePresence>
                {notifications.slice(0, compact ? 5 : 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
        {notifications.length > (compact ? 5 : 10) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate('/landela')}
          >
            View all notifications
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
