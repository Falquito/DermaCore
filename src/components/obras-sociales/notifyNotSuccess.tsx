import { Frown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export default function NotifyNotSuccessComponent({
  open,
  title,
  description
}: {
  open: boolean;
  title: string;
  description: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md animate-in fade-in slide-in-from-top-5 duration-300">
      
      <Alert className="bg-white border-red-500 shadow-2xl flex items-start gap-3">
        <div className="mt-1">
          <Frown className="h-5 w-5 text-red-600" />

        </div>
        
        <div className="flex-1">
          <AlertTitle className="text-zinc-700 font-semibold mb-1">
            {title}
          </AlertTitle>
          <AlertDescription className="text-red-600">
            {description}
          </AlertDescription>
        </div>
      </Alert>

    </div>
  );
}