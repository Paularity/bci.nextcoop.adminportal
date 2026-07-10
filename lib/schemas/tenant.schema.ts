import { z } from "zod";

const administratorCreateSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("A valid email is required"),
    mobileNumber: z.string().trim().optional().or(z.literal("")),
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

const administratorUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("A valid email is required"),
    mobileNumber: z.string().trim().optional().or(z.literal("")),
  })
  .strict();

export const createTenantSchema = z
  .object({
    tenantCode: z
      .string()
      .trim()
      .min(2, "Tenant code is required")
      .max(32, "Tenant code too long")
      .regex(/^[A-Za-z0-9_-]+$/, "Tenant code may only contain letters, numbers, - or _"),
    cooperativeName: z.string().trim().min(2, "Cooperative name is required"),
    cooperativeAddress: z.string().trim().min(2, "Cooperative address is required"),
    administrator: administratorCreateSchema,
  })
  .strict();
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z
  .object({
    cooperativeName: z.string().trim().min(2, "Cooperative name is required"),
    cooperativeAddress: z.string().trim().min(2, "Cooperative address is required"),
    administrator: administratorUpdateSchema,
  })
  .strict();
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export const listTenantsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // When omitted, the API returns the entire (non-deleted) working set.
  // When present, must be a positive integer.
  pageSize: z.coerce.number().int().min(1).optional(),
  sort: z.enum(["tenantCode", "cooperativeName", "status", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;
