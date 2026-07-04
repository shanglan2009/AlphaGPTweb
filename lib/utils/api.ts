import { ApiResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}/api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "请求失败", timestamp: new Date().toISOString() };
    }
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络错误",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function postApi<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
