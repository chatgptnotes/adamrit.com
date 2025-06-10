"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  // CardDescription, // Agar use nahi ho raha toh hata sakte hain
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { PlusCircle, Pencil, Trash2, Search, Upload, AlertCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { createClient } from '@supabase/supabase-js'
import UserAddForm from "@/components/user-add-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Base Surgery type definition
interface BaseSurgery {
  id: string;
  name: string;
  approved: boolean;
  packageAmount: number;
  description?: string;
  created_at?: string;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}

// CGHS Surgery type
interface CGHSSurgery extends BaseSurgery {
  cghsCode: string;
  surgeryType: 'cghs';
}

// Yojna Surgery type
interface YojnaSurgery extends BaseSurgery {
  yojnaCode: string;
  yojnaName: string;
  surgeryType: 'yojna';
}

// Private Surgery type
interface PrivateSurgery extends BaseSurgery {
  hospitalCode?: string;
  surgeryType: 'private';
}

// Combined type for all surgeries
export type Surgery = CGHSSurgery | YojnaSurgery | PrivateSurgery;

// Common complications that can be used for surgeries
const availableComplications = [
  { id: "c1", name: "Infection", riskLevel: "High" },
  { id: "c2", name: "Bleeding", riskLevel: "Medium" },
  { id: "c3", name: "Allergic Reaction", riskLevel: "Medium" },
  { id: "c4", name: "Blood Clot", riskLevel: "High" },
  { id: "c5", name: "Pneumonia", riskLevel: "Medium" },
  { id: "c6", name: "Wound Dehiscence", riskLevel: "Medium" },
  { id: "c7", name: "Surgical Site Infection", riskLevel: "High" },
  { id: "c8", name: "Nerve Damage", riskLevel: "High" },
  { id: "c9", name: "Vascular Injury", riskLevel: "High" },
  { id: "c10", name: "Anastomotic Leak", riskLevel: "High" },
  { id: "c11", name: "Post-Op Respiratory Failure", riskLevel: "High" },
  { id: "c12", name: "Pulmonary Embolism", riskLevel: "High" },
  { id: "c13", name: "Deep Vein Thrombosis", riskLevel: "Medium" },
  { id: "c14", name: "Urinary Tract Infection", riskLevel: "Low" },
  { id: "c15", name: "Anesthesia Reaction", riskLevel: "High" },
  { id: "c16", name: "Post-Op Nausea/Vomiting", riskLevel: "Low" },
  { id: "c17", name: "Intestinal Obstruction", riskLevel: "Medium" },
  { id: "c18", name: "Urinary Retention", riskLevel: "Medium" },
  { id: "c19", name: "Incisional Hernia", riskLevel: "Medium" },
  { id: "c20", name: "Hematoma", riskLevel: "Medium" }
];

// Supabase client initialize karein
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function SurgeryMaster() {
  // State for different surgery types
  const [cghsSurgeries, setCGHSSurgeries] = useState<CGHSSurgery[]>([]);
  const [yojnaSurgeries, setYojnaSurgeries] = useState<YojnaSurgery[]>([]);
  const [privateSurgeries, setPrivateSurgeries] = useState<PrivateSurgery[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("cghs");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentSurgery, setCurrentSurgery] = useState<Surgery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSurgeries();
  }, []);

  async function fetchSurgeries() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('surgeries')
      .select('id, name, description, package_amount, created_at, approved, surgery_type, cghs_code, yojna_code, yojna_name, hospital_code, complication1, complication2, complication3, complication4')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching surgeries:", error);
      toast({
        title: "Error",
        description: "Could not fetch surgeries from the database.",
        variant: "destructive",
      });
      setCGHSSurgeries([]);
      setYojnaSurgeries([]);
      setPrivateSurgeries([]);
    } else if (data) {
      // Process and sort surgeries by type
      const cghs: CGHSSurgery[] = [];
      const yojna: YojnaSurgery[] = [];
      const private_: PrivateSurgery[] = [];

      data.forEach(s => {
        const baseSurgery = {
          id: s.id,
          name: s.name,
          description: s.description,
          packageAmount: Number(s.package_amount),
          created_at: s.created_at,
          approved: s.approved,
          complication1: s.complication1 || "none",
          complication2: s.complication2 || "none",
          complication3: s.complication3 || "none", 
          complication4: s.complication4 || "none"
        };

        if (s.surgery_type === 'cghs') {
          cghs.push({
            ...baseSurgery,
            cghsCode: s.cghs_code || "",
            surgeryType: 'cghs'
          });
        } else if (s.surgery_type === 'yojna') {
          yojna.push({
            ...baseSurgery,
            yojnaCode: s.yojna_code || "",
            yojnaName: s.yojna_name || "",
            surgeryType: 'yojna'
          });
        } else {
          private_.push({
            ...baseSurgery,
            hospitalCode: s.hospital_code,
            surgeryType: 'private'
          });
        }
      });

      setCGHSSurgeries(cghs);
      setYojnaSurgeries(yojna);
      setPrivateSurgeries(private_);
    }
    setIsLoading(false);
  }

  // Get the active surgery list based on selected tab
  const getActiveSurgeries = () => {
    switch(activeTab) {
      case "cghs": return cghsSurgeries;
      case "yojna": return yojnaSurgeries;
      case "private": return privateSurgeries;
      default: return cghsSurgeries;
    }
  };

  // Filter surgeries based on search term
  const filteredSurgeries = getActiveSurgeries().filter(surgery => 
    surgery.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSurgery = () => {
    // Create default surgery based on active tab
    if (activeTab === "cghs") {
      setCurrentSurgery({
        id: "", 
        name: "",
        approved: false, 
        packageAmount: 0,
        cghsCode: "",
        surgeryType: 'cghs',
        complication1: "none",
        complication2: "none",
        complication3: "none",
        complication4: "none"
      });
    } else if (activeTab === "yojna") {
      setCurrentSurgery({
        id: "", 
        name: "",
        approved: false, 
        packageAmount: 0,
        yojnaCode: "",
        yojnaName: "",
        surgeryType: 'yojna',
        complication1: "none",
        complication2: "none",
        complication3: "none",
        complication4: "none"
      });
    } else {
      setCurrentSurgery({
        id: "", 
        name: "",
        approved: false, 
        packageAmount: 0,
        hospitalCode: "",
        surgeryType: 'private',
        complication1: "none",
        complication2: "none",
        complication3: "none",
        complication4: "none"
      });
    }
    setIsAddDialogOpen(true);
  };

  const handleEditSurgery = (surgery: Surgery) => {
    setCurrentSurgery({...surgery});
    setIsEditDialogOpen(true);
  };

  const handleDeleteSurgery = async (id: string) => {
    const { error } = await supabase
      .from('surgeries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting surgery:", error);
      toast({
        title: "Error",
        description: "Could not delete the surgery.",
        variant: "destructive",
      });
    } else {
      // Update the appropriate state based on surgery type
      if (activeTab === "cghs") {
        setCGHSSurgeries(prevSurgeries => prevSurgeries.filter(surgery => surgery.id !== id));
      } else if (activeTab === "yojna") {
        setYojnaSurgeries(prevSurgeries => prevSurgeries.filter(surgery => surgery.id !== id));
      } else {
        setPrivateSurgeries(prevSurgeries => prevSurgeries.filter(surgery => surgery.id !== id));
      }
      
      toast({
        title: "Surgery removed",
        description: "The surgery has been removed successfully."
      });
    }
  };

  const handleSaveNewSurgery = async () => {
    if (!currentSurgery) return;
    
    const { name, packageAmount, description, approved, complication1, complication2, complication3, complication4 } = currentSurgery;
    
    if (!name.trim() || packageAmount <= 0) {
      toast({
        title: "Missing information",
        description: "Please enter a surgery name and valid package amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare common fields
    let surgeryToInsert: any = { 
      name: name.trim(), 
      package_amount: packageAmount, 
      description, 
      approved,
      surgery_type: currentSurgery.surgeryType,
      complication1,
      complication2,
      complication3,
      complication4
    };

    // Add type-specific fields
    if (currentSurgery.surgeryType === 'cghs') {
      surgeryToInsert.cghs_code = (currentSurgery as CGHSSurgery).cghsCode;
    } else if (currentSurgery.surgeryType === 'yojna') {
      surgeryToInsert.yojna_code = (currentSurgery as YojnaSurgery).yojnaCode;
      surgeryToInsert.yojna_name = (currentSurgery as YojnaSurgery).yojnaName;
    } else if (currentSurgery.surgeryType === 'private') {
      surgeryToInsert.hospital_code = (currentSurgery as PrivateSurgery).hospitalCode;
    }

    const { data, error } = await supabase
      .from('surgeries')
      .insert([surgeryToInsert])
      .select('*')
      .single();

    if (error) {
      console.error("Error adding surgery:", error);
      toast({
        title: "Error",
        description: `Could not add the surgery: ${error.message}`,
        variant: "destructive",
      });
    } else if (data) {
      // Process the returned data
      const baseSurgery = {
        id: data.id,
        name: data.name,
        description: data.description,
        packageAmount: Number(data.package_amount),
        created_at: data.created_at,
        approved: data.approved,
        complication1: data.complication1 || "none",
        complication2: data.complication2 || "none",
        complication3: data.complication3 || "none",
        complication4: data.complication4 || "none"
      };

      // Update the appropriate state
      if (data.surgery_type === 'cghs') {
        const newSurgery: CGHSSurgery = {
          ...baseSurgery,
          cghsCode: data.cghs_code || "",
          surgeryType: 'cghs'
        };
        setCGHSSurgeries(prev => [...prev, newSurgery].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (data.surgery_type === 'yojna') {
        const newSurgery: YojnaSurgery = {
          ...baseSurgery,
          yojnaCode: data.yojna_code || "",
          yojnaName: data.yojna_name || "",
          surgeryType: 'yojna'
        };
        setYojnaSurgeries(prev => [...prev, newSurgery].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const newSurgery: PrivateSurgery = {
          ...baseSurgery,
          hospitalCode: data.hospital_code,
          surgeryType: 'private'
        };
        setPrivateSurgeries(prev => [...prev, newSurgery].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setIsAddDialogOpen(false);
      setCurrentSurgery(null);
      toast({
        title: "Surgery added",
        description: "The new surgery has been added successfully."
      });
    }
  };

  const handleUpdateSurgery = async () => {
    if (!currentSurgery || !currentSurgery.id) return;
    
    const { id, name, packageAmount, description, approved, complication1, complication2, complication3, complication4 } = currentSurgery;
    
    if (!name.trim() || packageAmount <= 0) {
      toast({
        title: "Missing information",
        description: "Please enter a surgery name and valid package amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare common fields
    let updateData: any = { 
      name: name.trim(),
      package_amount: packageAmount,
      description,
      approved,
      surgery_type: currentSurgery.surgeryType,
      complication1,
      complication2,
      complication3,
      complication4
    };

    // Add type-specific fields
    if (currentSurgery.surgeryType === 'cghs') {
      updateData.cghs_code = (currentSurgery as CGHSSurgery).cghsCode;
    } else if (currentSurgery.surgeryType === 'yojna') {
      updateData.yojna_code = (currentSurgery as YojnaSurgery).yojnaCode;
      updateData.yojna_name = (currentSurgery as YojnaSurgery).yojnaName;
    } else if (currentSurgery.surgeryType === 'private') {
      updateData.hospital_code = (currentSurgery as PrivateSurgery).hospitalCode;
    }

    const { data, error } = await supabase
      .from('surgeries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating surgery:", error);
      toast({
        title: "Error",
        description: `Could not update the surgery: ${error.message}`,
        variant: "destructive",
      });
    } else if (data) {
      // Process the returned data
      const baseSurgery = {
        id: data.id,
        name: data.name,
        description: data.description,
        packageAmount: Number(data.package_amount),
        created_at: data.created_at,
        approved: data.approved,
        complication1: data.complication1 || "none",
        complication2: data.complication2 || "none",
        complication3: data.complication3 || "none",
        complication4: data.complication4 || "none"
      };

      // Update the appropriate state
      if (data.surgery_type === 'cghs') {
        const updatedSurgery: CGHSSurgery = {
          ...baseSurgery,
          cghsCode: data.cghs_code || "",
          surgeryType: 'cghs'
        };
        setCGHSSurgeries(prev => 
          prev.map(surgery => surgery.id === id ? updatedSurgery : surgery)
          .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else if (data.surgery_type === 'yojna') {
        const updatedSurgery: YojnaSurgery = {
          ...baseSurgery,
          yojnaCode: data.yojna_code || "",
          yojnaName: data.yojna_name || "",
          surgeryType: 'yojna'
        };
        setYojnaSurgeries(prev => 
          prev.map(surgery => surgery.id === id ? updatedSurgery : surgery)
          .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const updatedSurgery: PrivateSurgery = {
          ...baseSurgery,
          hospitalCode: data.hospital_code,
          surgeryType: 'private'
        };
        setPrivateSurgeries(prev => 
          prev.map(surgery => surgery.id === id ? updatedSurgery : surgery)
          .sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      setIsEditDialogOpen(false);
      setCurrentSurgery(null);
      toast({
        title: "Surgery updated",
        description: "The surgery has been updated successfully."
      });
    }
  };

  // CSV parsing function
  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const surgeries = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 2) continue;

      const surgery: any = {};
      headers.forEach((header, index) => {
        if (values[index]) {
          surgery[header] = values[index].trim();
        }
      });

      // Validate required fields based on active tab
      if (activeTab === "cghs") {
        if (surgery.name && surgery.cghs_code && surgery.package_amount) {
          surgeries.push({
            name: surgery.name,
            cghsCode: surgery.cghs_code,
            packageAmount: Number(surgery.package_amount) || 0,
            description: surgery.description || "",
            approved: (surgery.approved || "").toLowerCase() === 'true',
            complication1: surgery.complication1 || "none",
            complication2: surgery.complication2 || "none",
            complication3: surgery.complication3 || "none",
            complication4: surgery.complication4 || "none",
            surgeryType: 'cghs' as const
          });
        }
      } else if (activeTab === "yojna") {
        if (surgery.name && surgery.yojna_code && surgery.package_amount) {
          surgeries.push({
            name: surgery.name,
            yojnaCode: surgery.yojna_code,
            yojnaName: surgery.yojna_name || "",
            packageAmount: Number(surgery.package_amount) || 0,
            description: surgery.description || "",
            approved: (surgery.approved || "").toLowerCase() === 'true',
            complication1: surgery.complication1 || "none",
            complication2: surgery.complication2 || "none",
            complication3: surgery.complication3 || "none",
            complication4: surgery.complication4 || "none",
            surgeryType: 'yojna' as const
          });
        }
      } else if (activeTab === "private") {
        if (surgery.name && surgery.package_amount) {
          surgeries.push({
            name: surgery.name,
            hospitalCode: surgery.hospital_code || "",
            packageAmount: Number(surgery.package_amount) || 0,
            description: surgery.description || "",
            approved: (surgery.approved || "").toLowerCase() === 'true',
            complication1: surgery.complication1 || "none",
            complication2: surgery.complication2 || "none",
            complication3: surgery.complication3 || "none",
            complication4: surgery.complication4 || "none",
            surgeryType: 'private' as const
          });
        }
      }
    }

    return surgeries;
  };

  const handleImportClick = () => {
    setImportError(null);
    setIsImportDialogOpen(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvData = e.target?.result as string;
        const importedData = parseCSV(csvData);
        
        if (importedData.length === 0) {
          setImportError("No valid data found in the CSV file");
          return;
        }

        // Insert surgeries into database
        const surgeriesToInsert = importedData.map((surgery: any) => {
          const baseData = {
            name: surgery.name,
            description: surgery.description,
            package_amount: surgery.packageAmount,
            approved: surgery.approved,
            surgery_type: surgery.surgeryType,
            complication1: surgery.complication1,
            complication2: surgery.complication2,
            complication3: surgery.complication3,
            complication4: surgery.complication4
          };

          if (surgery.surgeryType === 'cghs') {
            return { ...baseData, cghs_code: surgery.cghsCode };
          } else if (surgery.surgeryType === 'yojna') {
            return { 
              ...baseData, 
              yojna_code: surgery.yojnaCode,
              yojna_name: surgery.yojnaName 
            };
          } else {
            return { ...baseData, hospital_code: surgery.hospitalCode };
          }
        });

        const { data, error } = await supabase
          .from('surgeries')
          .insert(surgeriesToInsert)
          .select();

        if (error) {
          setImportError(`Failed to import surgeries: ${error.message}`);
          return;
        }

        if (data) {
          // Update the appropriate state
          if (activeTab === "cghs") {
            const newSurgeries = data.map(s => ({
              id: s.id,
              name: s.name,
              description: s.description,
              packageAmount: Number(s.package_amount),
              created_at: s.created_at,
              approved: s.approved,
              cghsCode: s.cghs_code || "",
              surgeryType: 'cghs' as const,
              complication1: s.complication1 || "none",
              complication2: s.complication2 || "none",
              complication3: s.complication3 || "none",
              complication4: s.complication4 || "none"
            }));
            setCGHSSurgeries(prev => [...prev, ...newSurgeries].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (activeTab === "yojna") {
            const newSurgeries = data.map(s => ({
              id: s.id,
              name: s.name,
              description: s.description,
              packageAmount: Number(s.package_amount),
              created_at: s.created_at,
              approved: s.approved,
              yojnaCode: s.yojna_code || "",
              yojnaName: s.yojna_name || "",
              surgeryType: 'yojna' as const,
              complication1: s.complication1 || "none",
              complication2: s.complication2 || "none",
              complication3: s.complication3 || "none",
              complication4: s.complication4 || "none"
            }));
            setYojnaSurgeries(prev => [...prev, ...newSurgeries].sort((a, b) => a.name.localeCompare(b.name)));
          } else {
            const newSurgeries = data.map(s => ({
              id: s.id,
              name: s.name,
              description: s.description,
              packageAmount: Number(s.package_amount),
              created_at: s.created_at,
              approved: s.approved,
              hospitalCode: s.hospital_code,
              surgeryType: 'private' as const,
              complication1: s.complication1 || "none",
              complication2: s.complication2 || "none",
              complication3: s.complication3 || "none",
              complication4: s.complication4 || "none"
            }));
            setPrivateSurgeries(prev => [...prev, ...newSurgeries].sort((a, b) => a.name.localeCompare(b.name)));
          }
        }

        setIsImportDialogOpen(false);
        
        toast({
          title: "Import Successful",
          description: `${importedData.length} surgeries were imported to ${activeTab.toUpperCase()}.`,
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Import error:", error);
        setImportError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read the file");
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><div>Loading surgeries...</div></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Surgery Master List</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search surgeries..."
              className="w-full sm:w-[280px] pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleImportClick}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          
          <Button onClick={handleAddSurgery} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Surgery
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="cghs" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cghs">CGHS Surgery Master</TabsTrigger>
          <TabsTrigger value="yojna">Yojna Surgery Master</TabsTrigger>
          <TabsTrigger value="private">Private Surgery Master</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cghs">
          <Card>
            <CardHeader>
              <CardTitle>CGHS Surgeries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Surgery Name</TableHead>
                    <TableHead>CGHS Code</TableHead>
                    <TableHead>Package (₹)</TableHead>
                    <TableHead className="w-[20%]">Description</TableHead>
                    <TableHead>Complications</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurgeries.length > 0 ? (
                    filteredSurgeries.map((surgery) => (
                      <TableRow key={surgery.id}>
                        <TableCell className="font-medium">{surgery.name}</TableCell>
                        <TableCell>
                          {(surgery as CGHSSurgery).cghsCode || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {surgery.packageAmount ? `₹${surgery.packageAmount.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={surgery.description}>
                          {surgery.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {surgery.complication1 !== "none" && (
                              <span className="block mb-1 py-0.5 px-2 bg-amber-100 rounded-full">{surgery.complication1}</span>
                            )}
                            {surgery.complication2 !== "none" && (
                              <span className="block mb-1 py-0.5 px-2 bg-amber-100 rounded-full">{surgery.complication2}</span>
                            )}
                            {(surgery.complication3 !== "none" || surgery.complication4 !== "none") && (
                              <span className="block py-0.5 px-2 bg-gray-100 rounded-full">{(surgery.complication3 !== "none" ? 1 : 0) + (surgery.complication4 !== "none" ? 1 : 0)} more</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {surgery.approved ? 
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Yes</span> : 
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">No</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditSurgery(surgery)}
                              title="Edit Surgery"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSurgery(surgery.id)}
                              title="Delete Surgery"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? "No CGHS surgeries found for your search." : "No CGHS surgeries available. Add a new one to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yojna">
          <Card>
            <CardHeader>
              <CardTitle>Yojna Surgeries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Surgery Name</TableHead>
                    <TableHead>Yojna Name</TableHead>
                    <TableHead>Yojna Code</TableHead>
                    <TableHead>Package (₹)</TableHead>
                    <TableHead className="w-[20%]">Complications</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurgeries.length > 0 ? (
                    filteredSurgeries.map((surgery) => (
                      <TableRow key={surgery.id}>
                        <TableCell className="font-medium">{surgery.name}</TableCell>
                        <TableCell>{(surgery as YojnaSurgery).yojnaName || "N/A"}</TableCell>
                        <TableCell>{(surgery as YojnaSurgery).yojnaCode || "N/A"}</TableCell>
                        <TableCell className="font-medium">
                          {surgery.packageAmount ? `₹${surgery.packageAmount.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {surgery.complication1 !== "none" && (
                              <span className="block mb-1 py-0.5 px-2 bg-amber-100 rounded-full">{surgery.complication1}</span>
                            )}
                            {surgery.complication2 !== "none" && (
                              <span className="block mb-1 py-0.5 px-2 bg-amber-100 rounded-full">{surgery.complication2}</span>
                            )}
                            {(surgery.complication3 !== "none" || surgery.complication4 !== "none") && (
                              <span className="block py-0.5 px-2 bg-gray-100 rounded-full">{(surgery.complication3 !== "none" ? 1 : 0) + (surgery.complication4 !== "none" ? 1 : 0)} more</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {surgery.approved ? 
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Yes</span> : 
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">No</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditSurgery(surgery)}
                              title="Edit Surgery"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSurgery(surgery.id)}
                              title="Delete Surgery"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? "No Yojna surgeries found for your search." : "No Yojna surgeries available. Add a new one to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private">
          <Card>
            <CardHeader>
              <CardTitle>Private Surgeries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Surgery Name</TableHead>
                    <TableHead>Hospital Code</TableHead>
                    <TableHead>Package (₹)</TableHead>
                    <TableHead className="w-[25%]">Description</TableHead>
                    <TableHead>Complications</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurgeries.length > 0 ? (
                    filteredSurgeries.map((surgery) => (
                      <TableRow key={surgery.id}>
                        <TableCell className="font-medium">{surgery.name}</TableCell>
                        <TableCell>{(surgery as PrivateSurgery).hospitalCode || "N/A"}</TableCell>
                        <TableCell className="font-medium">
                          {surgery.packageAmount ? `₹${surgery.packageAmount.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={surgery.description}>
                          {surgery.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {surgery.complication1 !== "none" && (
                              <span className="block mb-1 py-0.5 px-2 bg-amber-100 rounded-full">{surgery.complication1}</span>
                            )}
                            {surgery.complication2 !== "none" && (
                              <span className="block mb-1 py-0.5 px-2 bg-amber-100 rounded-full">{surgery.complication2}</span>
                            )}
                            {(surgery.complication3 !== "none" || surgery.complication4 !== "none") && (
                              <span className="block py-0.5 px-2 bg-gray-100 rounded-full">{(surgery.complication3 !== "none" ? 1 : 0) + (surgery.complication4 !== "none" ? 1 : 0)} more</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {surgery.approved ? 
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Yes</span> : 
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">No</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditSurgery(surgery)}
                              title="Edit Surgery"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSurgery(surgery.id)}
                              title="Delete Surgery"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? "No private surgeries found for your search." : "No private surgeries available. Add a new one to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Surgery Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setCurrentSurgery(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isAddDialogOpen ? `Add New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Surgery` : "Edit Surgery"}
            </DialogTitle>
            <DialogDescription>
              {isAddDialogOpen 
                ? "Enter details for the new surgery. All fields marked with * are required."
                : `Update details for "${currentSurgery?.name || "this surgery"}".`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            {/* Common fields for all surgery types */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-surgery-name" className="text-right col-span-1">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input id="modal-surgery-name" placeholder="e.g., Appendectomy" className="col-span-3"
                value={currentSurgery?.name || ""}
                onChange={(e) => setCurrentSurgery(prev => prev ? {...prev, name: e.target.value} : null)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-package-amount" className="text-right col-span-1">
                Package (₹) <span className="text-red-500">*</span>
              </Label>
              <Input id="modal-package-amount" type="number" placeholder="e.g., 35000" className="col-span-3"
                value={currentSurgery?.packageAmount || ""}
                onChange={(e) => setCurrentSurgery(prev => prev ? {...prev, packageAmount: Number(e.target.value) || 0} : null)}
              />
            </div>
            
            {/* CGHS specific fields */}
            {currentSurgery?.surgeryType === 'cghs' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modal-cghs-code" className="text-right col-span-1">
                  CGHS Code <span className="text-red-500">*</span>
                </Label>
                <Input id="modal-cghs-code" placeholder="e.g., CGHS-001" className="col-span-3"
                  value={(currentSurgery as CGHSSurgery).cghsCode || ""}
                  onChange={(e) => setCurrentSurgery(prev => prev ? 
                    {...prev, cghsCode: e.target.value} as CGHSSurgery : null)}
                />
              </div>
            )}
            
            {/* Yojna specific fields */}
            {currentSurgery?.surgeryType === 'yojna' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="modal-yojna-name" className="text-right col-span-1">
                    Yojna Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="modal-yojna-name" placeholder="e.g., Ayushman Bharat" className="col-span-3"
                    value={(currentSurgery as YojnaSurgery).yojnaName || ""}
                    onChange={(e) => setCurrentSurgery(prev => prev ? 
                      {...prev, yojnaName: e.target.value} as YojnaSurgery : null)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="modal-yojna-code" className="text-right col-span-1">
                    Yojna Code <span className="text-red-500">*</span>
                  </Label>
                  <Input id="modal-yojna-code" placeholder="e.g., AB-001" className="col-span-3"
                    value={(currentSurgery as YojnaSurgery).yojnaCode || ""}
                    onChange={(e) => setCurrentSurgery(prev => prev ? 
                      {...prev, yojnaCode: e.target.value} as YojnaSurgery : null)}
                  />
                </div>
              </>
            )}
            
            {/* Private specific fields */}
            {currentSurgery?.surgeryType === 'private' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modal-hospital-code" className="text-right col-span-1">
                  Hospital Code
                </Label>
                <Input id="modal-hospital-code" placeholder="e.g., HOSP-001" className="col-span-3"
                  value={(currentSurgery as PrivateSurgery).hospitalCode || ""}
                  onChange={(e) => setCurrentSurgery(prev => prev ? 
                    {...prev, hospitalCode: e.target.value} as PrivateSurgery : null)}
                />
              </div>
            )}
            
            {/* Description field - common */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="modal-description" className="text-right col-span-1 pt-2">Description</Label>
              <textarea id="modal-description" placeholder="Brief description of the surgery" className="col-span-3 min-h-[80px] p-2 border rounded-md text-sm"
                value={currentSurgery?.description || ""}
                onChange={(e) => setCurrentSurgery(prev => prev ? {...prev, description: e.target.value} : null)}
              />
            </div>

            {/* Complications section */}
            <div className="col-span-4 pt-2 border-t mt-2">
              <h4 className="text-md font-medium mb-2">Common Complications</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Select up to 4 common complications associated with this surgery
              </p>
            </div>

            {/* Complication 1 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-complication1" className="text-right col-span-1">
                Complication 1
              </Label>
              <Select 
                value={currentSurgery?.complication1 || "none"} 
                onValueChange={(value) => setCurrentSurgery(prev => prev ? {...prev, complication1: value} : null)}
              >
                <SelectTrigger id="modal-complication1" className="col-span-3">
                  <SelectValue placeholder="Select a complication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableComplications.map((complication) => (
                    <SelectItem key={complication.id} value={complication.name}>
                      {complication.name} ({complication.riskLevel} risk)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Complication 2 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-complication2" className="text-right col-span-1">
                Complication 2
              </Label>
              <Select 
                value={currentSurgery?.complication2 || "none"} 
                onValueChange={(value) => setCurrentSurgery(prev => prev ? {...prev, complication2: value} : null)}
              >
                <SelectTrigger id="modal-complication2" className="col-span-3">
                  <SelectValue placeholder="Select a complication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableComplications.map((complication) => (
                    <SelectItem key={complication.id} value={complication.name}>
                      {complication.name} ({complication.riskLevel} risk)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Complication 3 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-complication3" className="text-right col-span-1">
                Complication 3
              </Label>
              <Select 
                value={currentSurgery?.complication3 || "none"} 
                onValueChange={(value) => setCurrentSurgery(prev => prev ? {...prev, complication3: value} : null)}
              >
                <SelectTrigger id="modal-complication3" className="col-span-3">
                  <SelectValue placeholder="Select a complication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableComplications.map((complication) => (
                    <SelectItem key={complication.id} value={complication.name}>
                      {complication.name} ({complication.riskLevel} risk)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Complication 4 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-complication4" className="text-right col-span-1">
                Complication 4
              </Label>
              <Select 
                value={currentSurgery?.complication4 || "none"} 
                onValueChange={(value) => setCurrentSurgery(prev => prev ? {...prev, complication4: value} : null)}
              >
                <SelectTrigger id="modal-complication4" className="col-span-3">
                  <SelectValue placeholder="Select a complication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableComplications.map((complication) => (
                    <SelectItem key={complication.id} value={complication.name}>
                      {complication.name} ({complication.riskLevel} risk)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approval status field - common */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-approved" className="text-right col-span-1">Approved</Label>
              <div className="col-span-3 flex items-center">
                <input type="checkbox" id="modal-approved" className="h-4 w-4 accent-blue-600"
                  checked={currentSurgery?.approved || false}
                  onChange={(e) => setCurrentSurgery(prev => prev ? {...prev, approved: e.target.checked} : null)}
                />
                <span className="ml-2 text-sm">{currentSurgery?.approved ? "Yes, this surgery is approved" : "No, approval pending"}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setCurrentSurgery(null);
            }}>
              Cancel
            </Button>
            <Button onClick={isAddDialogOpen ? handleSaveNewSurgery : handleUpdateSurgery}>
              {isAddDialogOpen ? "Add Surgery" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import {activeTab.toUpperCase()} Surgeries</DialogTitle>
            <DialogDescription>
              Upload a CSV file with {activeTab} surgeries to import. The CSV file should have the required columns for {activeTab} surgery type.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {importError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload-surgery"
              />
              <label 
                htmlFor="csv-upload-surgery"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload a CSV file</p>
                <p className="text-xs text-muted-foreground">
                  Upload {activeTab} surgeries with the required format
                </p>
              </label>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <h4 className="font-medium mb-2">CSV Format for {activeTab.toUpperCase()}:</h4>
              {activeTab === "cghs" && (
                <pre className="text-xs overflow-x-auto">
                  name,cghs_code,package_amount,description,approved,complication1,complication2,complication3,complication4<br/>
                  Appendectomy,CGHS-001,25000,Removal of appendix,true,Infection,Bleeding,none,none<br/>
                  Gallbladder Surgery,CGHS-002,45000,Laparoscopic cholecystectomy,true,Infection,Bleeding,Bile Leak,none
                </pre>
              )}
              {activeTab === "yojna" && (
                <pre className="text-xs overflow-x-auto">
                  name,yojna_name,yojna_code,package_amount,description,approved,complication1,complication2,complication3,complication4<br/>
                  Heart Surgery,Ayushman Bharat,AB-001,150000,Cardiac bypass surgery,true,Infection,Bleeding,Heart Failure,none<br/>
                  Kidney Surgery,PMJAY,PM-002,85000,Kidney transplant,true,Infection,Rejection,Bleeding,none
                </pre>
              )}
              {activeTab === "private" && (
                <pre className="text-xs overflow-x-auto">
                  name,hospital_code,package_amount,description,approved,complication1,complication2,complication3,complication4<br/>
                  Cosmetic Surgery,HOSP-001,75000,Plastic surgery procedure,true,Infection,Scarring,none,none<br/>
                  Dental Implant,HOSP-002,15000,Single tooth implant,true,Infection,Implant Failure,none,none
                </pre>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Note:</strong> approved should be 'true' or 'false', complication fields can be 'none' if not applicable
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}