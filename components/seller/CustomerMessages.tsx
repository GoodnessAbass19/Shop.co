// components/seller/CustomerMessages.tsx
import React from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "../ui/button";

export function CustomerMessages() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Customer Messages
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2 text-blue-600" /> Inbox
        </h3>
        <p className="text-gray-700">
          View and respond to messages from your customers.
        </p>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>New message from Alice (Product Inquiry)</span>
            <Button variant="ghost" size="sm">
              Reply
            </Button>
          </li>
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>Order #1005 - Shipping update request (Bob)</span>
            <Button variant="ghost" size="sm">
              Reply
            </Button>
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Send className="h-5 w-5 mr-2 text-green-600" /> Sent Messages
        </h3>
        <p className="text-gray-700">
          A record of messages you have sent to customers.
        </p>
      </div>
    </div>
  );
}
