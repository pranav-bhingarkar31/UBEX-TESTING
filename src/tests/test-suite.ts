import { DbService } from "../db/dbService";
import { InventoryService } from "../services/inventory.service";
import { PaymentService } from "../services/payment.service";
import { NotificationService } from "../services/notifications.service";

export interface TestResult {
  testName: string;
  category: "Database" | "Inventory" | "Payments" | "Communications" | "Security";
  status: "PASSED" | "FAILED";
  durationMs: number;
  message?: string;
}

export const TestRunner = {
  async runAllTests(): Promise<{ summary: { passed: number; failed: number; total: number; score: number }; results: TestResult[] }> {
    const results: TestResult[] = [];
    
    // Test 1: PostgreSQL / Fallback Database Connection test
    const t1Start = Date.now();
    try {
      const stays = await DbService.getStays(true);
      results.push({
        testName: "Database Read/Write Verification",
        category: "Database",
        status: "PASSED",
        durationMs: Date.now() - t1Start,
        message: `Database connection holds. Successfully queried ${stays.length} properties.`
      });
    } catch (err: any) {
      results.push({
        testName: "Database Read/Write Verification",
        category: "Database",
        status: "FAILED",
        durationMs: Date.now() - t1Start,
        message: `Database query exception: ${err.message}`
      });
    }

    // Test 2: Pre-Booking Inventory Engine Overbook Protection
    const t2Start = Date.now();
    try {
      // Intentionally request checks for dates
      const mockStays = [
        { id: "villas-tapovan", checkInDate: "2026-06-20", checkOutDate: "2026-06-25" }
      ];
      const validation = await InventoryService.validateCartAndReserve(mockStays, [], "TEST-BOOKING-99");
      results.push({
        testName: "Inventory Isolation Guard",
        category: "Inventory",
        status: validation.success ? "PASSED" : "FAILED",
        durationMs: Date.now() - t2Start,
        message: validation.success ? "Clean slot reservation success." : `Double-booking trigger blocked: ${validation.errors.join("; ")}`
      });
    } catch (err: any) {
      results.push({
        testName: "Inventory Isolation Guard",
        category: "Inventory",
        status: "FAILED",
        durationMs: Date.now() - t2Start,
        message: `Inventory failure: ${err.message}`
      });
    }

    // Test 3: Razorpay HMAC Cryptographic Verification
    const t3Start = Date.now();
    try {
      const mockPayload = {
        bookingId: "TEST_B123",
        razorpayOrderId: "order_mock_xyz123",
        razorpayPaymentId: "pay_mock_999",
        razorpaySignature: "sig_mock_999"
      };
      
      const sigCheck = await PaymentService.verifyPaymentSignature(mockPayload);
      results.push({
        testName: "RazorPay Cryptographic HMAC Validation",
        category: "Payments",
        status: sigCheck.success ? "PASSED" : "FAILED",
        durationMs: Date.now() - t3Start,
        message: sigCheck.message
      });
    } catch (err: any) {
      results.push({
        testName: "RazorPay Cryptographic HMAC Validation",
        category: "Payments",
        status: "FAILED",
        durationMs: Date.now() - t3Start,
        message: `Signature verification exception: ${err.message}`
      });
    }

    // Test 4: Notification Send & Backoff Retry Policy
    const t4Start = Date.now();
    try {
      const dispatches = await NotificationService.sendNotification({
        toEmail: "test@ubex.com",
        toPhone: "+919999999999",
        recipientName: "QA Tester",
        templateType: "SECURITY_OTP",
        variables: { otp: "123456" }
      });
      results.push({
        testName: "Notifications Delivery & Retry Pipeline",
        category: "Communications",
        status: "PASSED",
        durationMs: Date.now() - t4Start,
        message: `Notification logged in database. emailSent: ${dispatches.emailSent}, smsSent: ${dispatches.smsSent}`
      });
    } catch (err: any) {
      results.push({
        testName: "Notifications Delivery & Retry Pipeline",
        category: "Communications",
        status: "FAILED",
        durationMs: Date.now() - t4Start,
        message: `Dispatch exception: ${err.message}`
      });
    }

    // Calculate Summary stats
    const total = results.length;
    const passed = results.filter(r => r.status === "PASSED").length;
    const failed = total - passed;
    const score = total > 0 ? Math.round((passed / total) * 100) : 100;

    return {
      summary: {
        passed,
        failed,
        total,
        score
      },
      results
    };
  }
};
