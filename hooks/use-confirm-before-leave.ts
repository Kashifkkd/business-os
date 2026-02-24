"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LEAVE_CONFIRM_STATE_KEY = "confirm-before-leave";

/**
 * Hook to warn or block when leaving with unsaved changes.
 * - Adds beforeunload for refresh/close tab.
 * - Pushes history state when dirty so browser back shows confirmation dialog.
 *
 * @param isDirty Whether the form (or page) has unsaved changes.
 * @returns { showLeaveDialog, confirmLeave, cancelLeave } – control the confirmation dialog.
 */
export function useConfirmBeforeLeave(isDirty: boolean) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const allowLeaveRef = useRef(false);
  const hasPushedStateRef = useRef(false);

  const confirmLeave = useCallback(() => {
    allowLeaveRef.current = true;
    setShowLeaveDialog(false);
    history.back();
  }, []);

  const cancelLeave = useCallback(() => {
    setShowLeaveDialog(false);
  }, []);

  // Warn on refresh or close tab
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Push state when dirty so we can intercept back button
  useEffect(() => {
    if (isDirty && !hasPushedStateRef.current) {
      hasPushedStateRef.current = true;
      history.pushState({ [LEAVE_CONFIRM_STATE_KEY]: true }, "");
    }
    if (!isDirty) {
      hasPushedStateRef.current = false;
    }
  }, [isDirty]);

  // Intercept back button
  useEffect(() => {
    const handlePopState = () => {
      if (allowLeaveRef.current || !isDirty) {
        allowLeaveRef.current = false;
        hasPushedStateRef.current = false;
        return;
      }
      // Stay on page: push state again and show dialog
      history.pushState({ [LEAVE_CONFIRM_STATE_KEY]: true }, "");
      setShowLeaveDialog(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  return { showLeaveDialog, confirmLeave, cancelLeave };
}
