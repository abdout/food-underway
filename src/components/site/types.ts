export interface Merchant {
    id: string;
    name: string;
    domain: string;
    logoUrl?: string | null;
    address?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    website?: string | null;
    timezone?: string;
    locale?: string;
    planType?: string;
    maxStudents?: number;
    maxTeachers?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MerchantResult {
    success: boolean;
    data?: Merchant;
    error?: string;
}
