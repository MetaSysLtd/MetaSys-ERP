import { apiRequest } from "@/lib/queryClient";

/**
 * Admin service for global admin operations
 * Handles CRUD operations for any entity type in the system
 */
class AdminService {
  /**
   * Get an entity by module and id
   * @param module The module/entity type
   * @param id The entity id
   * @returns The entity data
   */
  async getEntity(module: string, id: string | number): Promise<any> {
    const response = await apiRequest("GET", `/api/admin/${module}/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to get ${module}`);
    }
    return await response.json();
  }

  /**
   * Create a new entity
   * @param module The module/entity type
   * @param data The entity data
   * @returns The created entity
   */
  async createEntity(module: string, data: any): Promise<any> {
    const response = await apiRequest("POST", `/api/admin/${module}`, data);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to create ${module}`);
    }
    return await response.json();
  }

  /**
   * Update an existing entity
   * @param module The module/entity type 
   * @param data The entity data with id
   * @returns The updated entity
   */
  async updateEntity(module: string, data: any): Promise<any> {
    const response = await apiRequest("PUT", `/api/admin/${module}/${data.id}`, data);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update ${module}`);
    }
    return await response.json();
  }

  /**
   * Delete an entity
   * @param module The module/entity type
   * @param id The entity id
   * @returns Success status
   */
  async deleteEntity(module: string, id: string | number): Promise<boolean> {
    const response = await apiRequest("DELETE", `/api/admin/${module}/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to delete ${module}`);
    }
    return true;
  }

  /**
   * Get audit trail for an entity
   * @param module The module/entity type
   * @param id The entity id 
   * @returns List of audit events
   */
  async getAuditTrail(module: string, id: string | number): Promise<any[]> {
    const response = await apiRequest("GET", `/api/admin/audit/${module}/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to get audit trail for ${module}`);
    }
    return await response.json();
  }
}

export const adminService = new AdminService();