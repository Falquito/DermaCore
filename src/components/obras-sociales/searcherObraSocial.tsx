import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SearcherProps {
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  disabled?: boolean;
}

export default function SearcherObraSocialComponent({
  setSearchTerm,
  setStatusFilter,
  searchTerm,
  disabled
}: SearcherProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white p-1 rounded-xl">
      
      {/* Search Input Area */}
      <div className="relative w-full sm:max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder="Buscar obra social..."
          className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
        />
        {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
                <X className="h-3 w-3" />
            </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select defaultValue="ALL" onValueChange={setStatusFilter} disabled={disabled}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white shadow-sm border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter className="h-3.5 w-3.5" />
              <SelectValue placeholder="Estado" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVA">Activas</SelectItem>
            <SelectItem value="INACTIVA">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}