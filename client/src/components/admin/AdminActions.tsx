import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FileEdit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AdminActionsProps {
  item: any;
  module: string;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  disableDelete?: boolean;
  disableEdit?: boolean;
  customDeleteMessage?: string;
}

/**
 * A reusable component that renders admin edit and delete actions 
 * only visible to System Admin users
 */
export function AdminActions({
  item,
  module,
  onEdit,
  onDelete,
  disableDelete = false,
  disableEdit = false,
  customDeleteMessage,
}: AdminActionsProps) {
  const { user, role } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Normalize module name for display (singular form)
  const displayModule = module === "leads" ? "lead" : module.endsWith("s") ? module.slice(0, -1) : module;

  // Check if user is a System Admin (role level >= 5 or isSystemAdmin flag is true)
  const isSystemAdmin = (role?.level && role.level >= 5) || user?.isSystemAdmin === true;

  if (!isSystemAdmin) {
    return null;
  }

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
      toast({
        title: "Deleted successfully",
        description: `The ${module} has been deleted.`,
      });
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultDeleteMessage = `Are you sure you want to permanently delete this ${module}? This action cannot be undone.`;
  const deleteMessage = customDeleteMessage || defaultDeleteMessage;

  return (
    <>
      <div className="flex gap-1 admin-actions">
        {!disableEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-primary hover:text-primary/90 hover:bg-primary/10"
            title={`Edit ${module}`}
          >
            <FileEdit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
        
        {!disableDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            title={`Delete ${module}`}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>{deleteMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}