'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function SupportComponent() {
    const [ticketStatus, setTicketStatus] = useState('Open');

    const handleCreateTicket = () => {
        // Simulate the ticket creation process
        setTimeout(() => {
            setTicketStatus('Pending');
            setTimeout(() => {
                // Simulate success
                setTicketStatus('Resolved');
            }, 3000); // Simulate the duration of ticket resolution
        }, 1000); // Simulate delay before starting ticket creation
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Support Ticket</CardTitle>
                <CardDescription className="text-gray-500">Create a support ticket for assistance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <p>
                    <strong>Status:</strong> {ticketStatus}
                </p>
                {ticketStatus === 'Open' && (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleCreateTicket}>Create Ticket</Button>
                         </TooltipTrigger>
                        <TooltipContent>
                          Click to request assistance
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                {ticketStatus === 'Pending' && (
                    <p>Ticket is being processed...</p>
                )}
                {ticketStatus === 'Resolved' && (
                    <p>Your issue has been resolved.</p>
                )}
            </CardContent>
        </Card>
    );
}
