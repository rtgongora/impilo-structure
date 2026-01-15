import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  Archive,
  Paperclip,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useProfessionalEmails, type ProfessionalEmail, type EmailFolder } from '@/hooks/useProfessionalEmails';

interface EmailItemProps {
  email: ProfessionalEmail;
  onMarkAsRead: (id: string) => void;
  onToggleStar: (id: string) => void;
  onClick: () => void;
}

function EmailItem({ email, onMarkAsRead, onToggleStar, onClick }: EmailItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
        !email.is_read ? 'bg-primary/5 border-primary/20' : ''
      } ${email.is_important ? 'border-l-4 border-l-amber-500' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(email.id);
          }}
        >
          <Star
            className={`h-4 w-4 ${email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm truncate ${!email.is_read ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
              {email.from_name || email.from_address}
            </p>
            {!email.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
            {email.has_attachments && (
              <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className={`text-sm truncate ${!email.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {email.subject}
          </p>
          {email.body_text && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {email.body_text.slice(0, 100)}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );
}

interface ProfessionalEmailPanelProps {
  compact?: boolean;
  onOpenEmail?: (email: ProfessionalEmail) => void;
}

export function ProfessionalEmailPanel({ compact = false, onOpenEmail }: ProfessionalEmailPanelProps) {
  const [activeFolder, setActiveFolder] = useState<EmailFolder>('inbox');
  const { emails, unreadCount, loading, error, markAsRead, toggleStar, refresh } = useProfessionalEmails(activeFolder);

  const handleEmailClick = (email: ProfessionalEmail) => {
    if (!email.is_read) {
      markAsRead(email.id);
    }
    onOpenEmail?.(email);
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
          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
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
            <Mail className="h-4 w-4 text-primary" />
            Professional Email
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs px-1.5">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-0 px-4 pb-4">
        <Tabs value={activeFolder} onValueChange={(v) => setActiveFolder(v as EmailFolder)}>
          <TabsList className="grid w-full grid-cols-4 h-8 mb-3">
            <TabsTrigger value="inbox" className="text-xs">
              <Inbox className="h-3 w-3 mr-1" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs">
              <Send className="h-3 w-3 mr-1" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="archive" className="text-xs">
              <Archive className="h-3 w-3 mr-1" />
              Archive
            </TabsTrigger>
            <TabsTrigger value="trash" className="text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Trash
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeFolder} className="mt-0">
            {emails.length === 0 ? (
              <div className="text-center py-6">
                <Mail className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No emails in {activeFolder}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your ministry email to sync messages
                </p>
              </div>
            ) : (
              <ScrollArea className={compact ? 'h-[200px]' : 'h-[280px]'}>
                <div className="space-y-2 pr-2">
                  <AnimatePresence>
                    {emails.slice(0, compact ? 5 : 15).map((email) => (
                      <EmailItem
                        key={email.id}
                        email={email}
                        onMarkAsRead={markAsRead}
                        onToggleStar={toggleStar}
                        onClick={() => handleEmailClick(email)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
