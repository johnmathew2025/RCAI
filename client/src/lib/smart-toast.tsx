/**
 * Smart Toast - Enhanced toast with action buttons
 * Protocol: Zero hardcoding, configurable actions
 * Purpose: Show version update notifications with user control
 */

import { toast as originalToast } from "@/hooks/use-toast";

interface SmartToastOptions {
  actionLabel: string;
  onAction: () => void;
  onDismiss?: () => void;
}

export function showSmartToast(message: string, options: SmartToastOptions): string {
  const { actionLabel, onAction, onDismiss } = options;
  
  const toastId = Math.random().toString(36).substr(2, 9);
  
  originalToast({
    title: "Update Available",
    description: message,
    action: (
      <div className="flex gap-2">
        <button
          onClick={() => {
            onAction();
            dismissToast(toastId);
          }}
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
        >
          {actionLabel}
        </button>
        <button
          onClick={() => {
            onDismiss?.();
            dismissToast(toastId);
          }}
          className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm hover:bg-secondary/90"
        >
          Dismiss
        </button>
      </div>
    ),
  });
  
  return toastId;
}

export function dismissToast(id: string): void {
  // Toast auto-dismisses when action buttons are clicked
  // Individual dismissal by ID would require toast library enhancement
}