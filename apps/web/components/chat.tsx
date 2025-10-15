"use client";

import React, { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Upload, Send, FileText, X, Bot, User } from "lucide-react";
import toast from "react-hot-toast";
import { useFileUpload } from "../hooks/useFileUpload";
import { useAiChat } from "../features/ai/hooks/useAIChat";
import TopBar from "./TopBar";
import { useAuthContext } from "../contexts/AuthContext";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  references?: Array<{
    content: string;
    source?: string;
  }>;
}

export default function ChatUI() {
  const { mutate: uploadFile, isPending: isUploading } = useFileUpload();
  const { mutate: chatWithAI, isPending: isChatting } = useAiChat();
  const { currentWorkspace } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, DOCX, or TXT files only");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const workspaceId = currentWorkspace?.id || "f4f5c567-a78f-40eb-941a-bfa7d243ebce";

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
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");

    // Call AI chat API
    chatWithAI(
      { message: currentMessage, limit: 5 },
      {
        onSuccess: (data) => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            role: "assistant",
            references: data.references,
          };
          setMessages((prev) => [...prev, aiMessage]);
        },
        onError: (error) => {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "Sorry, I couldn't process your request. Please try again.",
            role: "assistant",
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      },
    );
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

          {/* File List */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Recent Files
            </h4>
            <div className="space-y-2">
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
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 border shadow-sm"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === "assistant" && (
                        <Bot className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      {message.role === "user" && (
                        <User className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Show AI references if available */}
                        {message.role === "assistant" && message.references && message.references.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-gray-500 font-medium">
                              References:
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {message.references.map((reference, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-gray-50 rounded border text-xs"
                                >
                                  <p className="text-gray-700 mb-1">
                                    {reference.content.length > 150
                                      ? `${reference.content.substring(0, 150)}...`
                                      : reference.content}
                                  </p>
                                  {reference.source && (
                                    <p className="text-blue-600 font-medium">
                                      Source: {reference.source}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">AI is searching documents...</span>
                    </div>
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
                  placeholder="Ask questions about your uploaded documents..."
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
                disabled={!inputMessage.trim() || isChatting}
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