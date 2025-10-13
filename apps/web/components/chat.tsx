"use client";

import React, { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Upload, Send, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { useFileUpload } from "../hooks/useFileUpload";
import TopBar from "./TopBar";
import { useAuthContext } from "../contexts/AuthContext";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

export default function ChatUI() {
  const { mutate: uploadFile, isPending: isUploading } = useFileUpload();
  const { currentWorkspace } = useAuthContext(); // Get current workspace
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, DOCX, or TXT files only");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    // Get the first workspace ID from user's workspaces
    // For now, we'll need to get this from the auth response
    // You might need to store workspaces in localStorage or context
    const workspaceId =
      currentWorkspace?.id || "f4f5c567-a78f-40eb-941a-bfa7d243ebce"; // Use the actual workspace ID from login response

    uploadFile(
      { file, workspaceId },
      {
        onSuccess: (data) => {
          toast.success("File uploaded successfully!");
          setUploadedFile(file);
        },
        onError: (error) => {
          toast.error("Failed to upload file");
          console.error("Upload error:", error);
        },
      },
    );
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedFile) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I received your message. This is a simulated response.",
        role: "assistant",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content - Sidebar Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Upload Section */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Documents
          </h3>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Upload PDF, DOCX, or TXT files
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Maximum file size: 10MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>

          {/* Uploaded File Display */}
          {uploadedFile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-blue-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeUploadedFile}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* File List (if you want to show multiple files) */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Recent Files
            </h4>
            <div className="space-y-2">
              {/* You can add a list of recent files here */}
              <p className="text-xs text-gray-500">No recent files</p>
            </div>
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to AI Knowledge Hub
                </h2>
                <p className="text-gray-600">
                  Start a conversation or upload a document to get started.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 border"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="pr-12"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() && !uploadedFile}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
