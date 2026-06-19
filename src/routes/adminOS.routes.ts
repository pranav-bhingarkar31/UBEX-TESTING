import { Router } from "express";
import { AdminOSController } from "../controllers/adminOS.controller";
import { requireAdminJwt, requirePermission } from "../middleware/adminJwtAuth";

const router = Router();
const controller = new AdminOSController();

// All operational routes are protected by the active admin JWT verification middleware
router.use(requireAdminJwt);

/**
 * 1. MODULE 1: EXECUTIVE DASHBOARD
 */
router.get("/dashboard/stats", requirePermission("analytics:view"), controller.getDashboardStats.bind(controller));

/**
 * 2. MODULE 2: USER MANAGEMENT
 */
router.get("/users", requirePermission("admin:create"), controller.listUsers.bind(controller));
router.post("/users/:id/suspend", requirePermission("admin:create"), controller.toggleSuspension.bind(controller));
router.post("/users/:id/ban", requirePermission("admin:create"), controller.toggleBan.bind(controller));
router.post("/users/:id/verify", requirePermission("admin:create"), controller.verifyUser.bind(controller));
router.post("/users/:id/reset-password", requirePermission("admin:create"), controller.resetPassword.bind(controller));

/**
 * 3. MODULE 3: ROLE MANAGEMENT
 */
router.get("/roles", requirePermission("role:modify"), controller.getRoles.bind(controller));
router.post("/roles/assign", requirePermission("role:modify"), controller.assignRole.bind(controller));
router.post("/roles/remove", requirePermission("role:modify"), controller.removeRole.bind(controller));

/**
 * 4. MODULE 4: AUDIT CENTER
 */
router.get("/audit/logs", requirePermission("audit:read"), controller.getAuditLogs.bind(controller));
router.get("/audit/export", requirePermission("audit:export"), controller.exportAuditLogsCsv.bind(controller));

/**
 * 5. MODULE 5: SECURITY CENTER
 */
router.get("/security/events", requirePermission("audit:read"), controller.getSecurityEvents.bind(controller));

/**
 * 6. MODULE 6: NOTIFICATION CENTER
 */
router.get("/notifications", controller.getNotifications.bind(controller));
router.post("/notifications/:id/read", controller.markNotificationAsRead.bind(controller));
router.post("/notifications/create", controller.createNotification.bind(controller));

/**
 * 7. MODULE 7: SYSTEM HEALTH MONITORING
 */
router.get("/health", requirePermission("audit:read"), controller.getSystemHealth.bind(controller));

/**
 * MODULE 8: STAYS MANAGEMENT
 */
router.get("/stays", controller.getStays.bind(controller));
router.post("/stays", requirePermission("admin:create"), controller.createStay.bind(controller));
router.put("/stays/:id", requirePermission("admin:create"), controller.updateStay.bind(controller));
router.post("/stays/:id/archive", requirePermission("admin:create"), controller.toggleStayArchive.bind(controller));
router.delete("/stays/:id", requirePermission("admin:create"), controller.deleteStay.bind(controller));
router.post("/stays/:id/inventory", requirePermission("admin:create"), controller.updateStayInventory.bind(controller));

/**
 * MODULE 9: EXPERIENCE MANAGEMENT
 */
router.get("/experiences", controller.getExperiences.bind(controller));
router.post("/experiences", requirePermission("admin:create"), controller.createExperience.bind(controller));
router.put("/experiences/:id", requirePermission("admin:create"), controller.updateExperience.bind(controller));
router.post("/experiences/:id/archive", requirePermission("admin:create"), controller.toggleExperienceArchive.bind(controller));
router.delete("/experiences/:id", requirePermission("admin:create"), controller.deleteExperience.bind(controller));
router.post("/experiences/:id/schedule", requirePermission("admin:create"), controller.updateExperienceScheduling.bind(controller));
router.get("/experiences/:id/analytics", requirePermission("analytics:view"), controller.getExperienceAnalytics.bind(controller));

/**
 * MODULE 10: BOOKING MANAGEMENT
 */
router.get("/bookings", controller.getBookings.bind(controller));
router.put("/bookings/:id", requirePermission("admin:create"), controller.modifyBooking.bind(controller));
router.post("/bookings/refund", controller.refundBooking.bind(controller));
router.post("/bookings/:id/reassign", requirePermission("admin:create"), controller.reassignBooking.bind(controller));

/**
 * MODULE 11: SYSTEM SETTINGS (SUPER ADMIN)
 */
router.get("/system-settings", controller.getSystemSettings.bind(controller));
router.post("/system-settings", controller.saveSystemSettings.bind(controller));

export { router as adminOSRouter };
export default router;
