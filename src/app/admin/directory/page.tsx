"use client";
import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Type definitions based on your Mongoose schema structure
interface Member {
  _id: string;
  status: string;
  personalInfo: {
    regNumber: string;
    name?: string;
    vitEmail: string;
    phoneNumber?: string;
    hostelBlock?: string;
    hostelRoom?: string;
    cgpa?: number;
    [key: string]: unknown;
  };
  domainInfo: {
    domain: string;
    [key: string]: unknown;
  };
}

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Fetching with a high limit to get all members for export/search
        const res = await fetch("/api/members?limit=1000");
        const result = await res.json();
        if (result.success && result.data) {
          setMembers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Client-side search filtering
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowerQuery = searchQuery.toLowerCase();
    
    return members.filter((m) => {
      const reg = m.personalInfo?.regNumber?.toLowerCase() || "";
      const email = m.personalInfo?.vitEmail?.toLowerCase() || "";
      const domain = m.domainInfo?.domain?.toLowerCase() || "";
      // Add name here if you have a name field: const name = m.personalInfo?.name?.toLowerCase() || "";
      
      return reg.includes(lowerQuery) || email.includes(lowerQuery) || domain.includes(lowerQuery);
    });
  }, [members, searchQuery]);

  // --- EXPORT TO EXCEL ---
  const exportToExcel = () => {
    // 1. Flatten the nested data for the spreadsheet
    const exportData = filteredMembers.map((m) => ({
      "Reg Number": m.personalInfo?.regNumber || "—",
      "VIT Email": m.personalInfo?.vitEmail || "—",
      "Phone": m.personalInfo?.phoneNumber || "—",
      "Domain": m.domainInfo?.domain || "—",
      "Hostel Block": m.personalInfo?.hostelBlock || "—",
      "Room": m.personalInfo?.hostelRoom || "—",
      "CGPA": m.personalInfo?.cgpa || "—",
      "Status": m.status || "—",
    }));

    // 2. Create workbook and save
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "Club_Members_Data.xlsx");
  };

  // --- EXPORT TO PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.text("Club Members Directory", 14, 15);

    // Prepare table headers and rows
    const tableColumn = ["Reg No.", "Email", "Domain", "Hostel", "CGPA", "Status"];
    const tableRows = filteredMembers.map((m) => [
      m.personalInfo?.regNumber || "—",
      m.personalInfo?.vitEmail || "—",
      m.domainInfo?.domain || "—",
      `${m.personalInfo?.hostelBlock || ""} ${m.personalInfo?.hostelRoom || ""}`.trim() || "—",
      m.personalInfo?.cgpa?.toString() || "—",
      m.status || "—"
    ]);

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 40, 40] },
    });

    doc.save("Club_Members_Directory.pdf");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Members Directory</h1>
          <p className="text-neutral-400 mt-2">
            View, search, and export club member data. ({filteredMembers.length} records found)
          </p>
        </div>
        
        {/* Actions Menu */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            disabled={filteredMembers.length === 0}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Download Excel
          </button>
          <button 
            onClick={exportToPDF}
            disabled={filteredMembers.length === 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Reg No, Email, or Domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {/* Data Table */}
      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-800 text-xs uppercase text-neutral-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Reg Number</th>
                <th className="px-6 py-4">VIT Email</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Hostel</th>
                <th className="px-6 py-4">CGPA</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                    Loading members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member._id} className="border-b border-white/5 hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{member.personalInfo?.regNumber}</td>
                    <td className="px-6 py-4">{member.personalInfo?.vitEmail}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-800 rounded-md text-xs border border-white/10">
                        {member.domainInfo?.domain || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.personalInfo?.hostelBlock ? `${member.personalInfo.hostelBlock} ${member.personalInfo.hostelRoom}` : "—"}
                    </td>
                    <td className="px-6 py-4">{member.personalInfo?.cgpa || "—"}</td>
                    <td className="px-6 py-4 capitalize">{member.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}