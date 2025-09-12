"use client";

import { usePosts } from "@/features/auth/hooks/usePosts";
import { Topbar } from "@/components/Topbar";
import { SharedButton } from "ui-design";
import HeroSection from "./hero-section";

export default function LandingPage() {
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts();

  if (postsLoading) return <div>Loading...</div>;
  if (postsError) return <div>Posts Error: {postsError.message}</div>;

  return (
    <>
      <div className=" max-w-[1440px] mx-auto">
        <Topbar />
        <HeroSection />

        <h1>React Query Test</h1>
        <h2>Posts ({posts?.length || 0})</h2>
        <div className="bg-red-200 border  p-4 rounded-md">
          {posts
            ?.slice(0, 7)
            .map((post: { title: string; body: string; id: string }) => (
              <div key={post.id}>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </div>
            ))}
        </div>
        <div className="bg-red-200 border  p-4 rounded-md">
          {posts
            ?.slice(0, 7)
            .map((post: { title: string; body: string; id: string }) => (
              <div key={post.id}>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </div>
            ))}
        </div>
        <div className="bg-red-200 border  p-4 rounded-md">
          {posts
            ?.slice(0, 7)
            .map((post: { title: string; body: string; id: string }) => (
              <div key={post.id}>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </div>
            ))}
        </div>
        <div className="bg-red-200 border  p-4 rounded-md">
          {posts
            ?.slice(0, 7)
            .map((post: { title: string; body: string; id: string }) => (
              <div key={post.id}>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </div>
            ))}
          <div className="bg-red-200 border  p-4 rounded-md">
            {posts
              ?.slice(0, 7)
              .map((post: { title: string; body: string; id: string }) => (
                <div key={post.id}>
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
      <SharedButton
        title="Button is working"
        className="bg-blue-400 text-white font-normal rounded-md hover:bg-blue-700"
      />
    </>
  );
}
