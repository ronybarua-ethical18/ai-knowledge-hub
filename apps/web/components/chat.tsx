"use client";

import React, { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Upload, Send, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { useFileUpload } from "../hooks/useFileUpload";
import { useUser } from "@clerk/nextjs";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

export default function ChatUI() {
  const { mutate: uploadFile, isPending: isUploading } = useFileUpload();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    // if (!user?.id) {
    //   toast.error('Please sign in to upload files');
    //   return;
    // }

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

    uploadFile(
      { file, userId: "" },
      {
        onSuccess: (data) => {
          toast.success("File uploaded! Processing in background...");

          const welcomeMessage: Message = {
            id: Date.now().toString(),
            content: `I've uploaded "${file.name}". Processing... You'll be able to ask questions once it's ready!`,
            role: "assistant",
          };
          setMessages([welcomeMessage]);
        },
      },
    );
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !uploadedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Based on your PDF, here's what I found: "${inputMessage}". This is a simulated response.`,
        role: "assistant",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] bg-background">
      {/* Left Side - Upload */}
      <div className="w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          {uploadedFile ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={removeFile}>
                <X className="w-4 h-4 mr-2" />
                Remove File
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">Upload PDF</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Choose File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat */}
      <div className="w-1/2 border-l border-border flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                uploadedFile
                  ? "Ask a question about your PDF..."
                  : "Upload a PDF first"
              }
              disabled={!uploadedFile || isLoading}
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !uploadedFile || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
