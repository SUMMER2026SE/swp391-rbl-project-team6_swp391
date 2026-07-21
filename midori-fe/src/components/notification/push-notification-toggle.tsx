import { useNotifications } from "@/lib/context/notification-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Toggle notification permission component.
 * Allows users to subscribe/unsubscribe to push notifications.
 */
export function PushNotificationToggle() {
  const { pushNotification } = useNotifications();
  const { isSupported, isSubscribed, isSubscribing, permission, subscribe, unsubscribe } =
    pushNotification;

  // Don't render if not supported
  if (!isSupported || permission === "unsupported") {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Push notifications disabled");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Push notifications enabled");
      }
    }
  };

  // Permission denied - show disabled state
  if (permission === "denied") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="relative opacity-50 cursor-not-allowed"
            aria-label="Notifications blocked"
          >
            <BellOff className="h-5 w-5 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Notifications blocked. Please enable in browser settings.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default prompt
  if (permission === "default") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isSubscribing}
            className="relative"
            aria-label="Enable notifications"
          >
            {isSubscribing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to enable push notifications</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Permission granted - show toggle
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          disabled={isSubscribing}
          className="relative"
          aria-label={isSubscribed ? "Disable notifications" : "Enable notifications"}
        >
          {isSubscribing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isSubscribed ? (
            <Bell className="h-5 w-5 fill-primary/20" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isSubscribed ? "Click to disable notifications" : "Click to enable notifications"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
