import { DbService, ExperienceInput } from "../../db/dbService";
import { SecurityService } from "../audit.service";

export type { ExperienceInput };


export const AdminExperiencesService = {
  async getExperiences(includeArchived: boolean = true) {
    return await DbService.getExperiences(includeArchived);
  },

  async createExperience(data: ExperienceInput, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const newExp = await DbService.createExperience(data);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "EXPERIENCE_CREATE",
      description: `Experience '${newExp.title}' (${newExp.id}) was created.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id: newExp.id, title: newExp.title }
    });

    return newExp;
  },

  async updateExperience(id: string, data: Partial<ExperienceInput>, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedExp = await DbService.updateExperience(id, data);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "EXPERIENCE_UPDATE",
      description: `Experience '${updatedExp.title}' (${id}) was updated.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, updateKeys: Object.keys(data) }
    });

    return updatedExp;
  },

  async toggleExperienceArchive(id: string, isArchived: boolean, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedExp = await DbService.updateExperience(id, { isArchived });

    await SecurityService.logAudit({
      adminUserId,
      eventType: isArchived ? "EXPERIENCE_ARCHIVE" : "EXPERIENCE_RESTORE",
      description: `Experience '${updatedExp.title}' (${id}) archive state set to ${isArchived}.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, isArchived }
    });

    return updatedExp;
  },

  async deleteExperience(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const exp = await DbService.getExperienceById(id);
    if (!exp) {
      throw new Error(`Experience ${id} not found.`);
    }

    const title = exp.title;
    await DbService.deleteExperience(id);

    await SecurityService.logAudit({
      adminUserId,
      eventType: "EXPERIENCE_DELETE",
      description: `Experience '${title}' (${id}) was permanently deleted.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, title }
    });
  },

  async updateSchedulingAndCapacity(id: string, scheduledDates: string[], capacity: number, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedExp = await DbService.updateExperience(id, { scheduledDates, capacity });

    await SecurityService.logAudit({
      adminUserId,
      eventType: "EXPERIENCE_SCHEDULING_UPDATE",
      description: `Experience '${updatedExp.title}' (${id}) scheduling/capacity was updated. Capacity: ${capacity}.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, scheduledDates, capacity }
    });

    return updatedExp;
  },

  async getExperienceAnalytics(id: string, permissionNames: string[], adminUserId: string, ipAddress?: string, userAgent?: string) {
    // Audit check on entry
    if (!permissionNames.includes("analytics:view")) {
      throw new Error("Access Denied: Permission 'analytics:view' is required to access Experience Analytics.");
    }

    const bookings = await DbService.getBookings();
    const expBookings = bookings.filter((b: any) => b.cartExperiences?.some((ce: any) => ce.id === id));
    
    const totalBookedGuests = expBookings.reduce((sum: number, b: any) => {
      const expItem = b.cartExperiences.find((ce: any) => ce.id === id);
      return sum + (Number(expItem?.guests) || 1);
    }, 0);

    const totalRevenue = expBookings.reduce((sum: number, b: any) => {
      const expItem = b.cartExperiences.find((ce: any) => ce.id === id);
      return sum + (Number(expItem?.priceValue * (expItem?.guests || 1)) || 0);
    }, 0);

    return {
      experienceId: id,
      totalBookings: expBookings.length,
      totalBookedGuests,
      totalRevenue,
      refundRate: 0.05
    };
  }
};

