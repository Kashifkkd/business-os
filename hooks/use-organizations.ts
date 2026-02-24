"use client";

import { useOrganization } from "@/hooks/use-organization";

/** List of organizations; compatible with previous useOrganizations() (returns { data, isLoading, ... }). */
export function useOrganizations() {
  const { organizations, isLoading, isFetching, error, isError, refetchOrganizations } =
    useOrganization(undefined);
  return {
    data: organizations,
    isLoading,
    isFetching,
    error,
    isError,
    refetch: refetchOrganizations,
  };
}
