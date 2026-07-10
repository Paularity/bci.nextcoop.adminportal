export type TenantRow = {
  id: string;
  tenantCode: string;
  cooperativeName: string;
  cooperativeAddress: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  administrator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    mobileNumber: string | null;
  } | null;
};

export type TenantListMeta = {
  total: number;
  page: number;
  pageSize: number;
};
