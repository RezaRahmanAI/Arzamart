export interface AdultProduct {
    id: number;
    headline: string;
    slug: string;
    subtitle?: string;
    imgUrl: string;
    benefitsTitle?: string;
    benefitsContent?: string;
    sideEffectsTitle?: string;
    sideEffectsContent?: string;
    usageTitle?: string;
    usageContent?: string;
    price: number;
    compareAtPrice?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface AdultProductCreateUpdatePayload {
    headline: string;
    slug: string;
    subtitle?: string;
    imgUrl: string;
    benefitsTitle?: string;
    benefitsContent?: string;
    sideEffectsTitle?: string;
    sideEffectsContent?: string;
    usageTitle?: string;
    usageContent?: string;
    price: number;
    compareAtPrice?: number;
    isActive: boolean;
}
