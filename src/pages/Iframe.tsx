import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Iframe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlParam = params.get("url");
    const titleParam = params.get("title");
    
    if (urlParam) {
      setUrl(urlParam);
    }
    
    if (titleParam) {
      setTitle(titleParam);
    }
  }, [location]);
  
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden mr-2" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {url ? (
            <iframe
              src={url}
              className="w-full h-full border-none"
              title={title}
              sandbox="allow-same-origin allow-scripts allow-forms"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>No URL provided</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </div>
  );
};

export default Iframe;
