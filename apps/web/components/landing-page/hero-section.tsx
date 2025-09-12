import Image from "next/image";
import React, { useState } from "react";
import { SharedInput, SharedSelectInput, SharedButton } from "ui-design";
import toast from "react-hot-toast";
import { MapPin, Search } from "lucide-react";

const HeroSection = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");

  const locationOptions = [
    { value: "florence-italy", label: "Florence, Italy" },
    { value: "milan-italy", label: "Milan, Italy" },
    { value: "rome-italy", label: "Rome, Italy" },
    { value: "venice-italy", label: "Venice, Italy" },
    { value: "naples-italy", label: "Naples, Italy" },
    { value: "turin-italy", label: "Turin, Italy" },
    { value: "bologna-italy", label: "Bologna, Italy" },
    { value: "genoa-italy", label: "Genoa, Italy" },
  ];

  const handleSearch = () => {
    if (!jobTitle.trim() && !location) {
      toast.error("Please enter a job title or select a location", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#FEE2E2",
          color: "#DC2626",
          border: "1px solid #FCA5A5",
        },
      });
      return;
    }

    const selectedLocation = locationOptions.find(
      (option) => option.value === location,
    );
    const locationLabel = selectedLocation ? selectedLocation.label : location;

    toast.success(
      <div>
        <div className="font-semibold mb-1">Searching for jobs...</div>
        <div className="text-sm opacity-90">
          {jobTitle.trim() && (
            <div>
              Job: <span className="font-medium">{jobTitle}</span>
            </div>
          )}
          {locationLabel && (
            <div>
              Location: <span className="font-medium">{locationLabel}</span>
            </div>
          )}
        </div>
      </div>,
      {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#DCFCE7",
          color: "#16A34A",
          border: "1px solid #86EFAC",
          minWidth: "300px",
        },
      },
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative w-full h-[794px] bg-[#F8F8FD] mt-[-78px]">
      <div
        className="absolute top-0 right-0 w-[860px] h-full bg-cover bg-no-repeat bg-right"
        style={{
          backgroundImage: "url(/images/background/bg-hero-section.png)",
          backgroundSize: "115% 100%",
        }}
      >
        <Image
          src="/images/hero-person.png"
          alt="Hero person illustration"
          width={625}
          height={707}
          className="absolute bottom-0 right-0 h-[707px] w-[625px]"
          priority
        />
      </div>
      <div className="h-full pt-[78px] pl-[124px]">
        <div className="flex flex-col justify-center h-full">
          <h1 className="w-[533px] text-[72px] leading-[110%] font-semibold text-gray-900 mb-4 font-clash-display mb-[13px]">
            Discover more than{" "}
            <span className="text-[#26A4FF]">5000+ Jobs</span>
          </h1>
          <Image
            src="/images/sketched-line.png"
            alt="hero-section-icon"
            width={455}
            height={32}
            className="h-[32px] w-[455px] mb-4"
          />
          <p className="w-[521px] my-2 text-[20px] leading-[150%] text-[#515B6F] opacity-70">
            Great platform for the job seeker that searching for new career
            heights and passionate about startups.
          </p>

          <div className="flex items-center  my-4 bg-white p-4 w-[852px] z-10   shadow-[0 79px 128px 0 rgba(192, 192, 192, 0.09), 0 28.836px 46.722px 0 rgba(192, 192, 192, 0.06), 0 13.999px 22.683px 0 rgba(192, 192, 192, 0.05), 0 6.863px 11.119px 0 rgba(192, 192, 192, 0.04), 0 2.714px 4.397px 0 rgba(192, 192, 192, 0.03)]">
            <div className="flex items-center flex-1 px-4  mr-2">
              <Search className="w-5 h-5 text-[#25324B] mr-4" />
              <SharedInput
                placeholder="Job title or keyword"
                value={jobTitle}
                onChange={setJobTitle}
                className="bg-transparent h-[57px] border-0 border-b border-b-[#D6DDEB] shadow-none rounded-none px-0 outline-none text-lg md:text-lg text-gray-600 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-gray-400 placeholder:text-[#7C8493] placeholder:text-lg placeholder:opacity-[0.5]"
                onKeyPress={handleKeyPress}
              />
            </div>

            <div className="flex items-center flex-1 px-4 mr-2">
              <MapPin className="w-5 h-5 text-[#25324B] mr-4" />
              <SharedSelectInput
                placeholder="Florence, Italy"
                value={location}
                onChange={setLocation}
                options={locationOptions}
                className="bg-transparent border-0 border-b border-b-[#D6DDEB] shadow-none rounded-none px-0 py-7 outline-none text-lg text-gray-600 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-gray-400 w-full"
                valueClassName="text-[#7C8493] text-lg opacity-[0.5]"
              />
            </div>

            {/* Search Button */}
            <SharedButton
              title="Search my job"
              onClick={handleSearch}
              className="bg-[#4640DE] rounded-none hover:bg-[#3A35C7] text-[18px] text-white px-[27px] h-[57px] font-bold transition-colors duration-200"
            />
          </div>

          <p className="w-[521px]  font-semibold text-lg leading-[150%] text-[#202430] opacity-70">
            Popular : UI Designer, UX Researcher, Android, Admin{" "}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
