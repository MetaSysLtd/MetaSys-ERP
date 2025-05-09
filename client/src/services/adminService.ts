import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Socket } from "socket.io-client";

/**
 * Admin Service for global editing and deletion of any entity
 */
class AdminService {
  private socket: Socket | null = null;

  /**
   * Set the socket instance for real-time updates
   */
  setSocket(socket: Socket) {
    this.socket = socket;
  }

  /**
   * Get entity details by ID from any module
   */
  async getEntityById(module: string, id: number | string): Promise<any> {
    try {
      const res = await apiRequest("GET", `/api/admin/${module}/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch ${module}`);
      }
      return await res.json();
    } catch (error: any) {
      console.error(`Error fetching ${module}:`, error);
      throw error;
    }
  }

  /**
   * Update any entity as an admin
   */
  async updateEntity(module: string, id: number | string, data: any): Promise<any> {
    try {
      const res = await apiRequest("PUT", `/api/admin/${module}/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update ${module}`);
      }

      const updatedEntity = await res.json();
      
      // Emit socket event if socket is available
      if (this.socket) {
        this.socket.emit("admin:entity:updated", {
          module,
          id,
          data: updatedEntity
        });
      }
      
      return updatedEntity;
    } catch (error: any) {
      console.error(`Error updating ${module}:`, error);
      throw error;
    }
  }

  /**
   * Delete any entity as an admin
   */
  async deleteEntity(module: string, id: number | string): Promise<boolean> {
    try {
      const res = await apiRequest("DELETE", `/api/admin/${module}/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete ${module}`);
      }

      // Emit socket event if socket is available
      if (this.socket) {
        this.socket.emit("admin:entity:deleted", {
          module,
          id
        });
      }
      
      return true;
    } catch (error: any) {
      console.error(`Error deleting ${module}:`, error);
      throw error;
    }
  }

  /**
   * Get module field configuration for edit forms
   */
  async getModuleFieldConfig(module: string): Promise<any> {
    try {
      const res = await apiRequest("GET", `/api/admin/${module}/fields`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get field configuration for ${module}`);
      }
      return await res.json();
    } catch (error: any) {
      console.error(`Error fetching field config for ${module}:`, error);
      throw error;
    }
  }
}

export const adminService = new AdminService();

// Helper functions to initialize socket connection in any components that need it
export const initAdminServiceSocket = (socket: Socket) => {
  adminService.setSocket(socket);
};