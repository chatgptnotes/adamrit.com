import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Scissors,
  ActivitySquare,
  Monitor,
  TestTube,
  FileSearch,
  Pill,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  BarChart3,
  CheckCircle2,
  User,
} from "lucide-react";
import Link from "next/link";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({
    dashboard: true,
    patient: false,
    masters: false,
    reports: false,
  });

  const toggleDropdown = (section: keyof typeof openDropdowns) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div
      className={`border-r h-full flex flex-col ${isCollapsed ? "w-[60px]" : "w-64"} transition-all duration-300 ease-in-out relative bg-white`}
    >
      <div className={`p-4 border-b flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
        <ActivitySquare className="h-6 w-6 text-green-600 flex-shrink-0" />
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold">Hope Hospital</h1>
            <div className="mt-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800 inline-block">
              Hospital Management System
            </div>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Dashboard Section */}
        <div className="mb-2">
          <button
            onClick={() => toggleDropdown('dashboard')}
            className={`w-full px-3 py-2 rounded-md transition-colors flex items-center justify-between hover:bg-blue-50 border border-transparent hover:border-blue-200 ${isCollapsed ? "justify-center" : ""} cursor-pointer`}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <LayoutDashboard className="h-4 w-4 flex-shrink-0 text-blue-600" />
              {!isCollapsed && <span className="font-medium text-gray-700">Dashboard</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center">
                {openDropdowns.dashboard ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
              </div>
            )}
          </button>
          {!isCollapsed && openDropdowns.dashboard && (
            <div className="ml-4 mt-1 space-y-1">
              <Link href="/?tab=today-ipd-dashboard">Today's IPD Dashboard</Link>
              <Link href="/?tab=today-opd-dashboard">Today's OPD Dashboard</Link>
            </div>
          )}
        </div>

        {/* Patient Management Section */}
        <div className="mb-2">
          <button
            onClick={() => toggleDropdown('patient')}
            className={`w-full px-3 py-2 rounded-md transition-colors flex items-center justify-between hover:bg-green-50 border border-transparent hover:border-green-200 ${isCollapsed ? "justify-center" : ""} cursor-pointer`}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <Users className="h-4 w-4 flex-shrink-0 text-green-600" />
              {!isCollapsed && <span className="font-medium text-gray-700">Patient Management</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center">
                {openDropdowns.patient ? <ChevronUp className="h-4 w-4 text-green-600" /> : <ChevronDown className="h-4 w-4 text-green-600" />}
              </div>
            )}
          </button>
          {!isCollapsed && openDropdowns.patient && (
            <div className="ml-4 mt-1 space-y-1">
              <Link href="/?tab=patient">Patient Management</Link>
              <Link href="/?tab=patient-dashboard">Patient Dashboard</Link>
            </div>
          )}
        </div>

        {/* Masters Section */}
        <div className="mb-2">
          <button
            onClick={() => toggleDropdown('masters')}
            className={`w-full px-3 py-2 rounded-md transition-colors flex items-center justify-between hover:bg-purple-50 border border-transparent hover:border-purple-200 ${isCollapsed ? "justify-center" : ""} cursor-pointer`}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <ClipboardList className="h-4 w-4 flex-shrink-0 text-purple-600" />
              {!isCollapsed && <span className="font-medium text-gray-700">Masters</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center">
                {openDropdowns.masters ? <ChevronUp className="h-4 w-4 text-purple-600" /> : <ChevronDown className="h-4 w-4 text-purple-600" />}
              </div>
            )}
          </button>
          {!isCollapsed && openDropdowns.masters && (
            <div className="ml-4 mt-1 space-y-1">
              <Link href="/?tab=diagnosis-master">Diagnosis Master</Link>
              <Link href="/?tab=cghs-surgery-master">CGHS Surgery Master</Link>
              <Link href="/?tab=yojna-surgery-master">Yojna Surgery Master</Link>
              <Link href="/?tab=private-surgery-master">Private Surgery Master</Link>
              <Link href="/complications">Complication Master</Link>
              <Link href="/?tab=radiology-master">Radiology Master</Link>
              <Link href="/?tab=lab-master">Lab Master</Link>
              <Link href="/?tab=other-investigations-master">Other Investigations</Link>
              <Link href="/?tab=medications-master">Medications Master</Link>
              <Link href="/?tab=medical-staff-master">Medical Staff</Link>
              <Link href="/?tab=doctor-master">Doctor Master</Link>
              <Link href="/?tab=user-list">User List</Link>
            </div>
          )}
        </div>

        {/* Reports & Admin Section */}
        <div className="mb-2">
          <button
            onClick={() => toggleDropdown('reports')}
            className={`w-full px-3 py-2 rounded-md transition-colors flex items-center justify-between hover:bg-orange-50 border border-transparent hover:border-orange-200 ${isCollapsed ? "justify-center" : ""} cursor-pointer`}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <BarChart3 className="h-4 w-4 flex-shrink-0 text-orange-600" />
              {!isCollapsed && <span className="font-medium text-gray-700">Reports & Admin</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center">
                {openDropdowns.reports ? <ChevronUp className="h-4 w-4 text-orange-600" /> : <ChevronDown className="h-4 w-4 text-orange-600" />}
              </div>
            )}
          </button>
          {!isCollapsed && openDropdowns.reports && (
            <div className="ml-4 mt-1 space-y-1">
              <Link href="/?tab=approvals">Approvals</Link>
              <Link href="/?tab=reports">Reports</Link>
            </div>
          )}
        </div>
      </nav>
      
      {/* Collapse/Expand Toggle Button */}
      <button
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </div>
  );
};

export default Sidebar; 