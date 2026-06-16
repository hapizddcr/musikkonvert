// Standardized API responses — keep success/error shape consistent.

export function success<T>(data: T, init?: ResponseInit): Response {
  return Response.json(
    { success: true, data },
    { status: 200, ...init },
  );
}

export function created<T>(data: T): Response {
  return Response.json({ success: true, data }, { status: 201 });
}

export function badRequest(message: string, details?: unknown): Response {
  return Response.json(
    { success: false, error: message, details },
    { status: 400 },
  );
}

export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ success: false, error: message }, { status: 401 });
}

export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { success: false, error: "Rate limit exceeded. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) },
    },
  );
}

export function serverError(message = "Internal server error"): Response {
  return Response.json(
    { success: false, error: message },
    { status: 500 },
  );
}

export function methodNotAllowed(allowed: string[]): Response {
  return Response.json(
    { success: false, error: `Method not allowed. Use: ${allowed.join(", ")}` },
    {
      status: 405,
      headers: { Allow: allowed.join(", ") },
    },
  );
}
