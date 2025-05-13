
import { Button } from "@/components/ui/button";
import { Edit, Download } from "lucide-react";

interface KnowledgeDetailProps {
  entry: any;
  onEdit: () => void;
}

export function KnowledgeDetail({ entry, onEdit }: KnowledgeDetailProps) {
  if (!entry) return null;

  const downloadEntryAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entry, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `knowledge-entry-${entry.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {entry.content?.title || 'Untitled'}
          </h3>
          <p className="text-sm text-muted-foreground">
            ID: {entry.id}
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={onEdit} size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={downloadEntryAsJson} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <p className="text-sm font-medium">Document Type</p>
          <p className="text-sm">{entry.document_type}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Scope</p>
          <p className="text-sm">{entry.scope}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Created</p>
          <p className="text-sm">{new Date(entry.created_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Updated</p>
          <p className="text-sm">{new Date(entry.updated_at).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold mb-2">Summary</h3>
        <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
          {entry.content?.summary || 'No summary available'}
        </div>
      </div>

      {entry.content?.source && (
        <div>
          <h3 className="text-md font-semibold mb-2">Source</h3>
          <p className="text-sm">{entry.content.source}</p>
        </div>
      )}

      {entry.content?.original_content && (
        <div>
          <h3 className="text-md font-semibold mb-2">Original Content</h3>
          <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
            {entry.content.original_content}
          </div>
        </div>
      )}
    </div>
  );
}
