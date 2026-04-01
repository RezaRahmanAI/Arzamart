-- SQL Script to add Adult/Wellness Products to arzamart database
-- Adult products are separate from regular products and stored in AdultProducts table

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRANSACTION;

DECLARE @Now DATETIME = GETUTCDATE();

-- 1. Premium Delay Spray
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Premium Delay Spray - 30ml',
    'premium-delay-spray-30ml',
    ' Clinically Tested Performance Spray',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    'Key Benefits',
    '• Extends performance duration by up to 30 minutes\n• Clinically tested formula\n• Water-based, non-greasy formula\n• Discreet packaging guaranteed\n• Suitable for daily use\n• Odorless and tasteless',
    'Possible Side Effects',
    '• Temporary numbness may occur\n• Avoid contact with eyes\n• Not for use by persons under 18\n• Wash hands after application\n• If irritation occurs, discontinue use',
    850.00,
    1200.00,
    1,
    'How to Use',
    '1. Shake well before use\n2. Apply 2-3 sprays to the head and shaft 10-15 minutes before intimacy\n3. Start with fewer sprays and adjust as needed\n4. Do not exceed 10 sprays per application\n5. Wash off before oral contact',
    @Now
);

-- 2. Herbal Vitality Capsules
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Herbal Vitality Capsules - 30 Capsules',
    'herbal-vitality-capsules-30',
    'Natural Energy & Performance Booster',
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800',
    'Key Benefits',
    '• Boosts energy and stamina naturally\n• Contains Tongkat Ali & Maca extract\n• Supports hormonal balance\n• 100% herbal formulation\n• No known side effects\n• Results within 2-4 weeks',
    'Possible Side Effects',
    '• Generally safe for most adults\n• Not recommended for those with heart conditions\n• Consult doctor if taking other medications\n• Not for pregnant or nursing women',
    1950.00,
    2500.00,
    1,
    'How to Use',
    '1. Take 1-2 capsules with water\n2. Best taken 30 minutes before meals\n3. Do not exceed 4 capsules per day\n4. For best results, use consistently for at least 4 weeks\n5. Store in cool, dry place',
    @Now
);

-- 3. Premium Silicone Lubricant
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Premium Silicone Lubricant - 100ml',
    'premium-silicone-lubricant-100ml',
    'Long-Lasting Premium Formula',
    'https://images.unsplash.com/photo-1607006333439-50585051c0c2?w=800',
    'Key Benefits',
    '• Ultra-smooth, long-lasting formula\n• 100% body-safe silicone\n• 5x longer lasting than water-based\n• Condom compatible\n• Fragrance-free & hypoallergenic\n• Perfect for sensitive skin',
    'Possible Side Effects',
    '• Keep away from eyes\n• Keep out of reach of children\n• If irritation occurs, discontinue use\n• Not a contraceptive',
    650.00,
    800.00,
    1,
    'How to Use',
    '1. Apply desired amount to intimate area or condom\n2. Reapply as needed\n3. Compatible with latex condoms\n4. Wash off with mild soap and water\n5. Use within 12 months of opening',
    @Now
);

-- 4. Performance Ring
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Premium Silicone Performance Ring',
    'premium-silicone-performance-ring',
    'Enhance & Prolong Performance',
    'https://images.unsplash.com/photo-1616690710400-a16d1c822e91?w=800',
    'Key Benefits',
    '• Helps maintain harder, longer-lasting erections\n• Made from premium body-safe silicone\n• Flexible and comfortable fit\n• Reusable and easy to clean\n• Discreet packaging\n• One size fits most',
    'Possible Side Effects',
    '• Do not use for more than 30 minutes at a time\n• Not recommended for men with blood clotting issues\n• Do not use if you have penile numbness\n• Stop use if you experience pain',
    450.00,
    600.00,
    1,
    'How to Use',
    '1. Roll the ring onto the shaft when semi-erect\n2. Position at the base of the penis\n3. Do not wear for more than 30 minutes\n4. Remove immediately if uncomfortable\n5. Clean with warm water and mild soap before and after use',
    @Now
);

-- 5. Women's Intimate Gel
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Hydrating Intimate Gel - 50ml',
    'hydrating-intimate-gel-50ml',
    'Comfort & Pleasure Enhancer',
    'https://images.unsplash.com/photo-1584635491400-83b5a4a3c7f7?w=800',
    'Key Benefits',
    '• Provides instant comfort and lubrication\n• pH-balanced formula\n• Water-based and easily absorbed\n• Enhances natural moisture\n• Dermatologically tested\n• Suitable for daily intimate use',
    'Possible Side Effects',
    '• Avoid contact with eyes\n• Keep out of reach of children\n• Discontinue use if irritation occurs\n• Not a contraceptive',
    750.00,
    950.00,
    1,
    'How to Use',
    '1. Apply a small amount to the intimate area\n2. Reapply as needed\n3. Can be used with or without condoms\n4. Safe for daily use\n5. Store in cool, dry place away from direct sunlight',
    @Now
);

-- 6. Intimate Wash - Men
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Men''s Intimate Hygiene Wash - 150ml',
    'mens-intimate-hygiene-wash-150ml',
    'Daily Protection & Freshness',
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
    'Key Benefits',
    '• pH-balanced formula for men\n• Provides 24-hour freshness\n• Reduces unwanted odors\n• Antibacterial protection\n• Gentle on sensitive skin\n• Dermatologically tested',
    'Possible Side Effects',
    '• For external use only\n• Avoid contact with eyes\n• Keep out of reach of children\n• Discontinue use if irritation occurs',
    550.00,
    700.00,
    1,
    'How to Use',
    '1. Use daily during shower\n2. Apply a small amount to intimate area\n3. Lather and rinse thoroughly\n4. Use morning and evening for best results\n5. Pat dry gently',
    @Now
);

-- 7. Intimate Wash - Women
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Women''s Intimate Hygiene Wash - 150ml',
    'womens-intimate-hygiene-wash-150ml',
    'Daily Protection & Comfort',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    'Key Benefits',
    '• Specially formulated for women''s pH\n• Gentle feminine hygiene\n• Helps maintain natural balance\n• Provides all-day freshness\n• Mild and soap-free formula\n• Gynecologist tested',
    'Possible Side Effects',
    '• For external use only\n• Avoid contact with eyes\n• Keep out of reach of children\n• Discontinue use if irritation occurs',
    550.00,
    700.00,
    1,
    'How to Use',
    '1. Use daily during bath or shower\n2. Apply to external intimate area\n3. Rinse thoroughly with water\n4. Use once or twice daily\n5. Pat dry gently',
    @Now
);

-- 8. Premium Condoms - 12 Pack
INSERT INTO AdultProducts (Headline, Slug, Subtitle, ImgUrl, BenefitsTitle, BenefitsContent, SideEffectsTitle, SideEffectsContent, Price, CompareAtPrice, IsActive, UsageTitle, UsageContent, CreatedAt)
VALUES (
    'Premium Dotted Condoms - 12 Pack',
    'premium-dotted-condoms-12-pack',
    'Extra Sensation & Protection',
    'https://images.unsplash.com/photo-1620381703979-8fc00abc9d50?w=800',
    'Key Benefits',
    '• Premium quality latex\n• Extra dotted texture for enhanced pleasure\n• 0.03mm ultra-thin for maximum sensitivity\n• 100% electronically tested\n• Each condom individually sealed\n• Pleasant scent',
    'Possible Side Effects',
    '• Latex allergy: Discontinue use if allergic reaction occurs\n• Single use only - never reuse\n• Do not use with oil-based lubricants\n• If condom breaks, consult doctor',
    450.00,
    550.00,
    1,
    'How to Use',
    '1. Check expiry date before use\n2. Carefully open the packet\n3. Pinch the tip and roll onto erect penis\n4. Ensure no air bubbles\n5. Dispose responsibly after use',
    @Now
);

COMMIT;
SELECT 'Successfully added 8 adult/wellness products.' AS Result;
