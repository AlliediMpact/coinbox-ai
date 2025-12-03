'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supportTicketService, SupportTicket, TicketStats } from '@/lib/support-ticket-service';
import { useRouter } from 'next/navigation';

export default function AdminSupportTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check admin role
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchTickets();
    fetchStats();
  }, [user, router, filterStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let fetchedTickets: SupportTicket[];

      if (filterStatus === 'all') {
        fetchedTickets = await supportTicketService.getAllTickets();
      } else {
        fetchedTickets = await supportTicketService.getTicketsByStatus(filterStatus);
      }

      setTickets(fetchedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const ticketStats = await supportTicketService.getTicketStats();
      setStats(ticketStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    if (!user) return;

    try {
      await supportTicketService.assignTicket(ticketId, user.uid, user.displayName || user.email || 'Admin');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = await supportTicketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('Failed to assign ticket');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    try {
      await supportTicketService.updateTicketStatus(ticketId, status);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = await supportTicketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    try {
      await supportTicketService.updateTicketPriority(ticketId, priority);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = await supportTicketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority');
    }
  };

  const handleAddReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;

    try {
      await supportTicketService.addReply(
        selectedTicket.id,
        user.uid,
        user.displayName || user.email || 'Admin',
        replyMessage,
        true
      );
      
      const updated = await supportTicketService.getTicketById(selectedTicket.id);
      setSelectedTicket(updated);
      setReplyMessage('');
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    }
  };

  const handleResolveTicket = async () => {
    if (!user || !selectedTicket || !resolutionNote.trim()) return;

    try {
      await supportTicketService.resolveTicket(selectedTicket.id, user.uid, resolutionNote);
      fetchTickets();
      const updated = await supportTicketService.getTicketById(selectedTicket.id);
      setSelectedTicket(updated);
      setResolutionNote('');
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('Failed to resolve ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Support Ticket Management</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Tickets</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-600">Open</div>
            <div className="text-2xl font-bold text-blue-700">{stats.open}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="text-sm text-purple-600">In Progress</div>
            <div className="text-2xl font-bold text-purple-700">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">Resolved</div>
            <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-600">Urgent</div>
            <div className="text-2xl font-bold text-red-700">{stats.byPriority.urgent}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-2">
          {['all', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Tickets ({tickets.length})</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tickets found</div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{ticket.subject}</div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div>Category: {ticket.category}</div>
                    <div>{ticket.createdAt.toDate().toLocaleDateString()}</div>
                  </div>
                  {ticket.assignedToName && (
                    <div className="mt-2 text-xs text-purple-600">
                      Assigned to: {ticket.assignedToName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold mb-4">{selectedTicket.subject}</h2>
                <div className="flex gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {!selectedTicket.assignedTo && (
                    <button
                      onClick={() => handleAssignToMe(selectedTicket.id)}
                      className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Assign to Me
                    </button>
                  )}
                  
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as any)}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <strong>Category:</strong> {selectedTicket.category}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <strong>Created:</strong> {selectedTicket.createdAt.toDate().toLocaleString()}
                </div>
                <div className="text-sm mb-4">{selectedTicket.description}</div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Replies</h3>
                {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                  selectedTicket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`mb-3 p-3 rounded ${
                        reply.isAdmin ? 'bg-purple-50 border-l-4 border-purple-500' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="font-semibold">
                          {reply.userName} {reply.isAdmin && '(Admin)'}
                        </span>
                        <span>{reply.createdAt.toDate().toLocaleString()}</span>
                      </div>
                      <div className="text-sm">{reply.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No replies yet</div>
                )}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full p-2 border rounded mb-2"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddReply}
                      disabled={!replyMessage.trim()}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      Send Reply
                    </button>
                    {selectedTicket.status !== 'resolved' && (
                      <button
                        onClick={() => {
                          const note = prompt('Enter resolution note:');
                          if (note) {
                            setResolutionNote(note);
                            setTimeout(() => handleResolveTicket(), 100);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
