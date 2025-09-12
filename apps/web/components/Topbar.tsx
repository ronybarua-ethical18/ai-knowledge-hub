import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import { SharedButton } from "ui-design";

const navItems = [
  {
    title: "Find Jobs",
    href: "/",
  },
  {
    title: "Browse Companies",
    href: "/",
  },
];

export const Topbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 78);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? "backdrop-blur-md bg-[#F8F8FD]/70" : "bg-transparent"
      }`}
    >
      <div className="flex max-w-[1440px] mx-auto justify-between items-center px-[124px] ">
        <div className="flex justify-center items-center gap-12">
          <Link href="/" className="pt-[17px] pb-[21px]">
            <Image
              src="/images/logos/Logo.svg"
              alt="logo"
              width={160}
              height={36}
            />
          </Link>
          <div className="flex items-center space-x-4 py-6 ">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.title}
                className="text-[#515B6F] font-medium text-[16px]"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="">
            <SharedButton
              title="Login"
              className="bg-transparent text-[#4640DE] h-[50px]  font-semibold text-lg rounded-none shadow-none  px-6 "
            />
          </Link>
          <div className="w-[1px] h-12 bg-[#D6DDEB] " />
          <Link href="/signup" className="">
            <SharedButton
              title="Sign Up"
              className="bg-[#4640DE] hover:text-[#4640DE] hover:border-none h-[50px]  text-white font-semibold text-lg rounded-none px-6   shadow-none"
            />{" "}
          </Link>
        </div>
      </div>
    </header>
  );
};
