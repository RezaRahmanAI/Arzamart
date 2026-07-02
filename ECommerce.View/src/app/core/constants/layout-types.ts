import { LayoutTypeConfig, CustomField } from '../models/landing-page';

export const LAYOUT_TYPES: LayoutTypeConfig[] = [
  {
    type: 'A',
    name: 'টাইটেল + সাবটাইটেল + ছবি',
    description: 'হিরো-স্টাইল ব্যানার। কেন্দ্রীয় শিরোনাম, বর্ণনা এবং একটি বড় ছবি।',
    icon: 'Image',
    defaultFields: [
      { key: 'title', label: 'শিরোনাম', type: 'text', enabled: true },
      { key: 'subtitle', label: 'বর্ণনা', type: 'textarea', enabled: true },
      { key: 'image', label: 'ছবির URL', type: 'image', enabled: true },
    ]
  },
  {
    type: 'B',
    name: 'টাইটেল + রিচ টেক্সট + বাটন',
    description: 'কনটেন্ট সেকশন। শিরোনাম, সমৃদ্ধ টেক্সট এবং একটি কল-টু-অ্যাকশন বাটন।',
    icon: 'FileText',
    defaultFields: [
      { key: 'title', label: 'শিরোনাম', type: 'text', enabled: true },
      { key: 'richtext', label: 'বিস্তারিত লেখা', type: 'richtext', enabled: true },
      { key: 'button', label: 'বাটন লেবেল', type: 'button', enabled: true },
    ]
  },
  {
    type: 'C',
    name: 'টাইটেল + ছবির গ্রিড',
    description: 'গ্যালারি বা ফিচার শোকেস। ২-৪টি ছবির গ্রিড।',
    icon: 'LayoutGrid',
    defaultFields: [
      { key: 'title', label: 'শিরোনাম', type: 'text', enabled: true },
      { key: 'images', label: 'ছবির URL লিস্ট', type: 'images', enabled: true },
    ]
  },
  {
    type: 'D',
    name: 'টাইটেল + ফিচার কার্ড',
    description: 'কেন আমাদের / ফিচার লিস্ট। আইকন/টেক্সট কার্ড।',
    icon: 'LayoutDashboard',
    defaultFields: [
      { key: 'title', label: 'শিরোনাম', type: 'text', enabled: true },
      { key: 'features', label: 'ফিচার (প্রতিটি নতুন লাইনে)', type: 'textarea', enabled: true },
    ]
  },
  {
    type: 'E',
    name: 'টাইটেল + টেক্সট + ছবি + বাটন',
    description: 'ফুল CTA সেকশন। টেক্সট ও ছবির সমন্বয়ে একটি সম্পূর্ণ সেকশন।',
    icon: 'Image',
    defaultFields: [
      { key: 'title', label: 'শিরোনাম', type: 'text', enabled: true },
      { key: 'description', label: 'বর্ণনা', type: 'textarea', enabled: true },
      { key: 'image', label: 'ছবির URL', type: 'image', enabled: true },
      { key: 'button', label: 'বাটন লেবেল', type: 'button', enabled: true },
    ]
  }
];

export function getLayoutConfig(type: string): LayoutTypeConfig | undefined {
  return LAYOUT_TYPES.find(lt => lt.type === type);
}

export function createDefaultFields(layoutType: string): CustomField[] {
  const config = getLayoutConfig(layoutType);
  if (!config) return [];

  return config.defaultFields.map(f => ({
    ...f,
    value: getDefaultValue(f.type)
  }));
}

function getDefaultValue(type: string): any {
  switch (type) {
    case 'text': return '';
    case 'textarea': return '';
    case 'richtext': return '';
    case 'image': return '';
    case 'images': return [''];
    case 'button': return 'আরও জানুন';
    default: return '';
  }
}
