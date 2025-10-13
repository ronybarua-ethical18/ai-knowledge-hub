// Centralized cookie management
export const cookieUtils = {
  set: (name: string, value: string, maxAge: number) => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; secure; samesite=strict`;
  },

  get: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    const cookies = document.cookie.split(";");
    const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));
    return cookie ? cookie.split("=")[1] || null : null;
  },

  remove: (name: string) => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },

  clear: () => {
    if (typeof window === "undefined") return;
    cookieUtils.remove("accessToken");
    cookieUtils.remove("refreshToken");
    localStorage.removeItem("user");
  },
};
