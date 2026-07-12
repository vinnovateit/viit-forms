"use client";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Toast from "../components/Toast";

export default function UpdateRoomPage() {
  const [regNumber, setRegNumber] = useState("");
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" as any });

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/members?regNumber=${regNumber}`);
      const result = await res.json();
      if (result.success) {
        setFormData(result.data);
      } else {
        setToast({ show: true, message: result.error || "Not found", type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Error connecting to server", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNumber, ...formData }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ show: true, message: "Profile updated successfully!", type: "success" });
      } else {
        setToast({ show: true, message: result.error, type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Update failed", type: "error" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 md:p-16">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      {/* Contextual Header */}
      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-white">
          {formData ? "Updating Profile" : "Member Lookup"}
        </h1>
        <p className="text-neutral-400 mt-2">
          {formData ? `Editing details for: ${regNumber}` : "Enter a registration number to modify existing records."}
        </p>
      </div>

      {/* Inline Lookup Section */}
      {!formData && (
        <div className="flex items-end gap-4 w-full">
          <div className="flex-grow">
            <InputField 
              id="search" 
              label="Registration Number" 
              value={regNumber} 
              onChange={setRegNumber} 
              placeholder="e.g. 25BCE0001" 
            />
          </div>
          <button 
            onClick={handleFetch} 
            disabled={isLoading || !regNumber}
            className="h-[50px] px-6 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Fetching..." : "Fetch Details"}
          </button>
        </div>
      )}

      {/* Editable Form */}
      {formData && (
        <div className="space-y-6">
          <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <InputField 
              label="Hostel Block" 
              value={formData.personalInfo?.hostelBlock || ""} 
              onChange={(v) => setFormData({...formData, personalInfo: {...formData.personalInfo, hostelBlock: v}})} 
            />
            <InputField 
              label="Hostel Room" 
              value={formData.personalInfo?.hostelRoom || ""} 
              onChange={(v) => setFormData({...formData, personalInfo: {...formData.personalInfo, hostelRoom: v}})} 
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setFormData(null)} 
              className="flex-1 py-4 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdate} 
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}