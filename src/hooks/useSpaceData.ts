// src/hooks/useSpaceData.ts

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  getThreadsForSpace,
  getSpaceMemberCount,
  getThreadsCountForSpace,
  getSpaceMemberList,
  ThreadWithDetails,
  MemberProfile
} from '@/integrations/supabase/community.api';

// Hook for fetching Threads
export const useSpaceThreads = (spaceId: string) => {
    const { toast } = useToast();
    const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchThreads = useCallback(async () => {
        if (!spaceId) {
            setThreads([]);
            setIsLoadingThreads(false);
            return;
        }
        setIsLoadingThreads(true);
        try {
            const threadsData = await getThreadsForSpace(spaceId);
            setThreads(threadsData);
        } catch (error: any) {
            console.error("Failed to fetch space threads:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load discussions for this space.' });
            setThreads([]);
        } finally {
            setIsLoadingThreads(false);
        }
    }, [spaceId, toast]);

    useEffect(() => {
        fetchThreads();
    }, [spaceId, refreshTrigger, fetchThreads]);

    const refreshThreads = () => setRefreshTrigger(prev => prev + 1);

    return { threads, isLoadingThreads, refreshThreads };
};

// Hook for fetching Metrics
export const useSpaceMetrics = (spaceId: string) => {
    const [memberCount, setMemberCount] = useState<number | null>(null);
    const [threadCount, setThreadCount] = useState<number | null>(null);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!spaceId) {
                setIsLoadingMetrics(false);
                return;
            }
            setIsLoadingMetrics(true);
            try {
                const [members, threads] = await Promise.all([
                    getSpaceMemberCount(spaceId), 
                    getThreadsCountForSpace(spaceId)
                ]); 
                setMemberCount(members);
                setThreadCount(threads);
            } catch (e) {
                console.error("Failed to fetch space metrics:", e);
                setMemberCount(null);
                setThreadCount(null);
            } finally {
                setIsLoadingMetrics(false);
            }
        };
        fetchMetrics();
    }, [spaceId]);

    return { memberCount, threadCount, isLoadingMetrics };
};

// Hook for fetching the Member List
export const useSpaceMemberList = (spaceId: string) => {
    const [memberList, setMemberList] = useState<MemberProfile[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    useEffect(() => {
        const fetchList = async () => {
             if (!spaceId) {
                setIsLoadingList(false);
                return;
            }
            setIsLoadingList(true);
            try {
                const list = await getSpaceMemberList(spaceId); 
                setMemberList(list);
            } catch (e) {
                console.warn(`Access check: Failed to fetch full member list for ${spaceId}.`, e);
                setMemberList([]); 
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchList();
    }, [spaceId]);

    return { memberList, isLoadingList };
};
