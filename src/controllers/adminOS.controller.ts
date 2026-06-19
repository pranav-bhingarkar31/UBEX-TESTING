import { Request, Response, NextFunction } from "express";
import { ApiResponse, ApiError, ApiErrorCode } from "../utils/apiResponse";
import { AdminOSService } from "../services/adminOS.service";
import { AdminStaysService } from "../services/admin/stays.service";
import { AdminExperiencesService } from "../services/admin/experiences.service";
import { AdminBookingsService } from "../services/admin/bookings.service";
import { localDb } from "../db/index";

export class AdminOSController {
  /**
   * 1. GET /api/v1/admin/dashboard/stats
   * Returns complete metrics dashboard card indicators.
   */
  public async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminOSService.getDashboardStats();
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Dashboard stats generated successfully.", stats, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. GET /api/v1/admin/users
   * Lists administrative operators and travelers, with options for fuzzy text query matching.
   */
  public async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : undefined;
      const users = await AdminOSService.listUsers(query);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Users list resolved successfully.", users, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:id/suspend
   * Toggles the user's suspension block state.
   */
  public async toggleSuspension(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, state } = req.body; // type: "Traveller" | "Operator", state: boolean
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!type || typeof state !== "boolean") {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Missing user type or state boolean variable.");
      }

      await AdminOSService.toggleUserSuspension(id, type, state, adminUserId, ipAddress, userAgent);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, `User suspension set to ${state}.`, null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:id/ban
   * Toggles the user's ban state.
   */
  public async toggleBan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, state } = req.body; // type: "Traveller" | "Operator", state: boolean
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!type || typeof state !== "boolean") {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Missing user type or state boolean variable.");
      }

      await AdminOSService.toggleUserBan(id, type, state, adminUserId, ipAddress, userAgent);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, `User ban set to ${state}.`, null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:id/verify
   * Validates/Verifies traveler identities.
   */
  public async verifyUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, state } = req.body; // type: "Traveller" | "Operator", state: boolean
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!type || typeof state !== "boolean") {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Missing user type or state boolean variable.");
      }

      await AdminOSService.verifyUserStatus(id, type, state, adminUserId, ipAddress, userAgent);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, `User verification status set to ${state}.`, null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:id/reset-password
   * Sets/Overrides passwords administratively.
   */
  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, plainPassword } = req.body; // type: "Traveller" | "Operator", plainPassword: string
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!type || !plainPassword || typeof plainPassword !== "string" || plainPassword.length < 8) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password must be a valid string of length 8 or more.");
      }

      await AdminOSService.forceResetPassword(id, type, plainPassword, adminUserId, ipAddress, userAgent);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, `Password override operation complete.`, null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. ROLE MANAGEMENT MODULE
   * GET /api/v1/admin/roles
   */
  public async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = await AdminOSService.getRolesAndBindings();
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Roles structure and user bindings fetched successfully.", meta, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/roles/assign
   */
  public async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleName } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!userId || !roleName) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Missing userId or roleName parameter.");
      }

      await AdminOSService.assignAdminRole(userId, roleName, adminUserId, ipAddress, userAgent);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, `Role '${roleName}' successfully assigned.`, null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/roles/remove
   */
  public async removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleName } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!userId || !roleName) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Missing userId or roleName parameter.");
      }

      await AdminOSService.revokeAdminRole(userId, roleName, adminUserId, ipAddress, userAgent);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, `Role '${roleName}' revoked from account successfully.`, null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. AUDIT CENTER MODULE
   * GET /api/v1/admin/audit/logs
   */
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
      const correlationIdArg = typeof req.query.correlationId === "string" ? req.query.correlationId : undefined;
      
      const logs = await AdminOSService.getAuditLogsFiltered({
        eventType,
        correlationId: correlationIdArg
      });
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Audit logs retrieved.", logs, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 5. SECURITY CENTER MODULE
   * GET /api/v1/admin/security/events
   */
  public async getSecurityEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await AdminOSService.getSecurityEventsFiltered();
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Security events timeline gathered.", events, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. NOTIFICATION CENTER MODULE
   * GET /api/v1/admin/notifications
   */
  public async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const notificationList = await AdminOSService.getNotifications(adminUserId);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Notifications payload received.", notificationList, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/notifications/:id/read
   */
  public async markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminOSService.markNotificationAsRead(id);
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "Notification designated as read.", null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/notifications/create
   */
  public async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, title, content } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      
      if (!type || !title || !content) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Missing type, title, or content variables.");
      }

      await AdminOSService.createNotificationRecord(type, title, content, adminUserId);
      const correlationId = req.correlationId || "";
      res.status(201).json(
        ApiResponse.success(201, "Custom operator notification spawned successfully.", null, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. SYSTEM HEALTH MONITORING MODULE
   * GET /api/v1/admin/health
   */
  public async getSystemHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await AdminOSService.getSystemHealthMetrics();
      const correlationId = req.correlationId || "";
      res.status(200).json(
        ApiResponse.success(200, "System health indexes calculated.", health, correlationId)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * MODULE 2: STAYS MANAGEMENT
   */
  public async getStays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeArchived = req.query.includeArchived !== "false";
      const stays = await AdminStaysService.getStays(includeArchived);
      res.status(200).json(ApiResponse.success(200, "Stays properties fetched.", stays, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async createStay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminStaysService.createStay(req.body, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(201).json(ApiResponse.success(201, "Stay property created.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async updateStay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminStaysService.updateStay(id, req.body, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Stay property updated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async toggleStayArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isArchived } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminStaysService.toggleStayArchive(id, isArchived, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Stay archive status updated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async deleteStay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      await AdminStaysService.deleteStay(id, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Stay property permanently deleted.", null, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async updateStayInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminStaysService.updateInventory(id, req.body, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Stay property inventory updated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  /**
   * MODULE 3: EXPERIENCE MANAGEMENT
   */
  public async getExperiences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeArchived = req.query.includeArchived !== "false";
      const exps = await AdminExperiencesService.getExperiences(includeArchived);
      res.status(200).json(ApiResponse.success(200, "Experiences fetched.", exps, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async createExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminExperiencesService.createExperience(req.body, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(201).json(ApiResponse.success(201, "Experience created.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async updateExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminExperiencesService.updateExperience(id, req.body, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Experience updated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async toggleExperienceArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isArchived } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminExperiencesService.toggleExperienceArchive(id, isArchived, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Experience archive state updated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async deleteExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      await AdminExperiencesService.deleteExperience(id, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Experience permanently deleted.", null, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async updateExperienceScheduling(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduledDates, capacity } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminExperiencesService.updateSchedulingAndCapacity(id, scheduledDates, capacity, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Experience schedule updated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async getExperienceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userPermissions = (req.adminPrincipal as any).permissions || [];
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const stats = await AdminExperiencesService.getExperienceAnalytics(id, userPermissions, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Experience business analytics compiled.", stats, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  /**
   * MODULE 4: BOOKING MANAGEMENT
   */
  public async getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : undefined;
      const list = await AdminBookingsService.searchBookings(query);
      res.status(200).json(ApiResponse.success(200, "Bookings solved successfully.", list, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async modifyBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminBookingsService.modifyBooking(id, req.body, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Booking updated successfully.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async refundBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId, challengeId, otp } = req.body;
      const adminPermissions = (req.adminPrincipal as any).permissions || [];
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminBookingsService.refundBooking(
        bookingId,
        challengeId,
        otp,
        adminPermissions,
        adminUserId,
        req.correlationId || "",
        req.ip || "127.0.0.1",
        req.headers["user-agent"] || ""
      );
      res.status(200).json(ApiResponse.success(200, "High-stakes refund complete.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async reassignBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { targetResource } = req.body;
      const adminUserId = req.adminPrincipal?.adminUserId || "";
      const result = await AdminBookingsService.reassignBooking(id, targetResource, adminUserId, req.ip, req.headers["user-agent"]);
      res.status(200).json(ApiResponse.success(200, "Booking reallocated.", result, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  /**
   * MODULE 5: AUDIT LOG CSV EXPORT
   */
  public async exportAuditLogsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminPermissions = (req.adminPrincipal as any).permissions || [];
      if (!adminPermissions.includes("audit:export")) {
        throw new ApiError(403, ApiErrorCode.AUTH_SESSION_EXPIRED, "Access Denied: Permission 'audit:export' required.");
      }

      const logs = await AdminOSService.getAuditLogsFiltered({});
      let csv = "ID,Admin ID,Event Type,Description,Correlation ID,IP Address,Created At\n";
      logs.forEach((l: any) => {
        csv += `"${l.id}","${l.adminUserId || ""}","${l.eventType}","${l.description.replace(/"/g, '""')}","${l.correlationId || ""}","${l.ipAddress || ""}","${l.createdAt}"\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * MODULE 8: SYSTEM SETTINGS (SUPER ADMIN)
   */
  public async getSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const s = localDb.getSystemSettings();
      res.status(200).json(ApiResponse.success(200, "System settings fetched.", s, req.correlationId));
    } catch (error) {
      next(error);
    }
  }

  public async saveSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminRoles = (req.adminPrincipal as any).roles || [];
      if (!adminRoles.includes("SUPER_ADMIN")) {
        throw new ApiError(403, ApiErrorCode.AUTH_SESSION_EXPIRED, "Access Denied: SUPER_ADMIN role required.");
      }

      localDb.saveSystemSettings(req.body);
      res.status(200).json(ApiResponse.success(200, "System settings persisted.", req.body, req.correlationId));
    } catch (error) {
      next(error);
    }
  }
}
