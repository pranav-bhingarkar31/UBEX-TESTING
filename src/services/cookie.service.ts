import { Response } from "express";

/**
 * Service managing secure browser authorization and CSRF protection cookies.
 */
export const CookieService = {
  /**
   * Commits security authorization tokens and CSRF parameters to client response headers.
   */
  setAuthCookies(res: Response, accessToken: string, refreshToken: string, csrfToken?: string): void {
    // Access Token: Short-lived access state verification handle (15 minutes lifespan)
    res.cookie("admin_access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh Token: Long-lived rotating session key, secure only (12 hours absolute ceiling match)
    res.cookie("admin_refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });

    // Double-Submit CSRF Cookie (HttpOnly secure state pairing)
    if (csrfToken) {
      res.cookie("admin_csrf_token", csrfToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 12 * 60 * 60 * 1000, // Syncs with session lifetime
      });

      // Readable CSRF Cookie (Option B) for direct client access
      res.cookie("readable_csrf_token", csrfToken, {
        httpOnly: false, // Accessible by client scripts
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 12 * 60 * 60 * 1000,
      });
    }
  },

  /**
   * Purges administrative identification and CSRF cookies from headers upon signout request.
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie("admin_access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.clearCookie("admin_refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.clearCookie("admin_csrf_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.clearCookie("readable_csrf_token", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    });
  }
};
export default CookieService;
