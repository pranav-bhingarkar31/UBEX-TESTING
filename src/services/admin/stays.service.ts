import { DbService, StayInput } from "../../db/dbService";
import { SecurityService } from "../audit.service";

export type { StayInput };


export const AdminStaysService = {
  async getStays(includeArchived: boolean = true) {
    return await DbService.getStays(includeArchived);
  },

  async createStay(data: StayInput, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const newStay = await DbService.createStay(data);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "STAY_CREATE",
      description: `Stay property '${newStay.title}' (${newStay.id}) was created.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id: newStay.id, title: newStay.title }
    });

    return newStay;
  },

  async updateStay(id: string, data: Partial<StayInput & { rating: string }>, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedStay = await DbService.updateStay(id, data);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "STAY_UPDATE",
      description: `Stay property '${updatedStay.title}' (${id}) was updated.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, updateKeys: Object.keys(data) }
    });

    return updatedStay;
  },

  async toggleStayArchive(id: string, isArchived: boolean, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedStay = await DbService.updateStay(id, { isArchived });

    await SecurityService.logAudit({
      adminUserId,
      eventType: isArchived ? "STAY_ARCHIVE" : "STAY_RESTORE",
      description: `Stay property '${updatedStay.title}' (${id}) archive state set to ${isArchived}.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, isArchived }
    });

    return updatedStay;
  },

  async deleteStay(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const stay = await DbService.getStayById(id);
    if (!stay) {
      throw new Error(`Stay ${id} not found.`);
    }

    const title = stay.title;
    await DbService.deleteStay(id);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "STAY_DELETE",
      description: `Stay property '${title}' (${id}) was permanently deleted.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, title }
    });
  },

  async updateInventory(id: string, patch: { blockedDates?: string[]; maintenanceDates?: string[]; dynamicPriceOverride?: number; capacity?: number }, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedStay = await DbService.updateStay(id, patch);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "STAY_INVENTORY_UPDATE",
      description: `Inventory for Stay '${updatedStay.title}' (${id}) was modified.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, patch }
    });

    return updatedStay;
  }
};

