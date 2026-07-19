"use client";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Toast from "../components/Toast";

// We use an index signature so we can dynamically map over any read-only fields 
// (like vitEmail, phone, etc.) that the API returns.
interface PersonalInfo {
  hostelBlock: string;
  hostelRoom: string;
  cgpa: number | string;
  [key: string]: any; 
}

interface FormData {
  personalInfo: PersonalInfo;
}

type ToastType = "info" | "error" | "success";

export default function UpdateRoomPage() {
  const [regNumber, setRegNumber] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" as ToastType });

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/members?regNumber=${regNumber}`);
      const result = await res.json();
      if (result.success && result.data) {
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
    if (!formData) return;
    
    // Construct a targeted payload with ONLY the fields we want to change
    const payload = {
      regNumber,
      personalInfo: {
        hostelBlock: formData.personalInfo.hostelBlock,
        hostelRoom: formData.personalInfo.hostelRoom,
        cgpa: Number(formData.personalInfo.cgpa) // Ensure CGPA is sent as a number
      }
    };

    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      if (result.success) {
        setToast({ show: true, message: "Profile updated successfully!", type: "success" });
        setFormData(null); // Reset form on success
        setRegNumber("");
      } else {
        setToast({ show: true, message: result.error, type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Update failed", type: "error" });
    }
  };

  // Helper to format camelCase keys to Title Case (e.g., vitEmail -> Vit Email)
  const formatLabel = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
  };

  return (
    <div className="max-w-3xl mx-auto p-8 md:p-16">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-white">
          {formData ? "Update Details" : "Member Lookup"}
        </h1>
        <p className="text-neutral-400 mt-2">
          {formData 
            ? `Editing details for: ${regNumber}` 
            : "Enter a registration number to modify existing records."}
        </p>
      </div>

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

      {formData && (
        <div className="space-y-8">
          {/* Read-Only Existing Data Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Current Profile Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.personalInfo).map(([key, value]) => {
                // Skip the fields we are actively editing, and skip internal Mongo IDs
                if (['hostelBlock', 'hostelRoom', 'cgpa', '_id'].includes(key)) return null;
                
                return (
                  <div key={key} className="bg-neutral-900/40 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-neutral-500 font-medium mb-1">
                      {formatLabel(key)}
                    </p>
                    <p className="text-white text-sm truncate">
                      {value !== undefined && value !== null ? String(value) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editable Fields Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Fields to Update</h2>
            <div className="bg-neutral-900/80 p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  id="hostelBlock"
                  label="Hostel Block"
                  value={formData.personalInfo?.hostelBlock || ""}
                  onChange={(v) => setFormData({ 
                    ...formData, 
                    personalInfo: { ...formData.personalInfo, hostelBlock: v } 
                  })} 
                />
                <InputField 
                  id="hostelRoom"
                  label="Hostel Room"
                  value={formData.personalInfo?.hostelRoom || ""}
                  onChange={(v) => setFormData({ 
                    ...formData, 
                    personalInfo: { ...formData.personalInfo, hostelRoom: v } 
                  })} 
                />
              </div>
              
              <InputField 
                id="cgpa"
                label="CGPA"
                type="number"
                step="0.01"
                max="10"
                value={formData.personalInfo?.cgpa?.toString() || ""}
                onChange={(v) => setFormData({ 
                  ...formData, 
                  personalInfo: { ...formData.personalInfo, cgpa: v } 
                })} 
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button 
              onClick={() => setFormData(null)} 
              className="flex-1 py-4 text-neutral-400 hover:text-white transition-colors font-medium"
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