// frontend/src/pages/swaps/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Tabs } from '../../src/components/common/Tabs';
import { SwapRequestCard } from '../../src/components/swap-requests/SwapRequestCard/SwapRequestCard';
import { CreateSwapRequest } from '../../src/components/swap-requests/CreateSwapRequest/CreateSwapRequest';
import { SwapApproval } from '../../src/components/swap-requests/SwapApproval/SwapApproval';
import { AvailableShifts } from '../../src/components/swap-requests/AvailableShifts/AvailableShifts';
import { Button } from '../../src/components/common/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { swapRequestsService } from '../../src/services/api/swap-requests.service';
import { SwapRequest } from '../../src/types/swap-request.types';

export default function SwapsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('my-requests');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await swapRequestsService.getSwapRequests();
      setRequests(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch swap requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (requestId: string, response: 'ACCEPT' | 'DECLINE') => {
    try {
      await swapRequestsService.respondToSwap(requestId, { response });
      await fetchRequests();
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  const handleApprove = async (requestId: string, reason?: string) => {
    try {
      await swapRequestsService.approveSwap(requestId, { action: 'APPROVE', reason });
      await fetchRequests();
      setIsApprovalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      await swapRequestsService.approveSwap(requestId, { action: 'REJECT', reason });
      await fetchRequests();
      setIsApprovalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await swapRequestsService.cancelSwapRequest(requestId);
      await fetchRequests();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handlePickup = async (shiftId: string) => {
    try {
      await swapRequestsService.pickupShift(shiftId);
      await fetchRequests();
    } catch (error) {
      console.error('Failed to pick up shift:', error);
    }
  };

  const filterRequests = (tab: string) => {
    if (!user || !Array.isArray(requests)) return [];
    switch (tab) {
      case 'my-requests':
        return requests.filter(r => r.requesterId === user.id);
      case 'pending-response':
        return requests.filter(r => r.responderId === user.id && r.status === 'PENDING');
      case 'pending-approval':
        return requests.filter(r => r.status === 'ACCEPTED');
      default:
        return requests;
    }
  };

  const renderRequestList = (tab: string) => {
    const filtered = filterRequests(tab);
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p>No requests found</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((request) => (
          <SwapRequestCard
            key={request.id}
            request={request}
            userRole={user?.role || ''}
            userId={user?.id || ''}
            onRespond={handleRespond}
            onApprove={(id) => {
              const req = requests.find(r => r.id === id);
              if (req) {
                setSelectedRequest(req);
                setIsApprovalOpen(true);
              }
            }}
            onCancel={handleCancel}
            onViewShift={(shiftId) => router.push(`/schedule/${shiftId}`)}
          />
        ))}
      </div>
    );
  };

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const tabs = [
    {
      id: 'my-requests',
      label: 'My Requests',
      content: renderRequestList('my-requests'),
    },
    {
      id: 'pending-response',
      label: 'Respond to Requests',
      content: renderRequestList('pending-response'),
    },
    ...(isManager ? [{
      id: 'pending-approval',
      label: 'Pending Approval',
      content: renderRequestList('pending-approval'),
    }] : []),
    {
      id: 'available-drops',
      label: 'Available Shifts',
      content: <AvailableShifts onPickup={handlePickup} />,
    },
  ];

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Swap Requests</h1>
          <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
            + New Request
          </Button>
        </div>

        <Tabs tabs={tabs} defaultTab="my-requests" onChange={setActiveTab} />

        <CreateSwapRequest
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          userId={user?.id || ''}
          onSuccess={fetchRequests}
        />

        {selectedRequest && (
          <SwapApproval
            isOpen={isApprovalOpen}
            onClose={() => {
              setIsApprovalOpen(false);
              setSelectedRequest(null);
            }}
            request={selectedRequest}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </Layout>
  );
}