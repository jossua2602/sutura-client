import React from 'react';

interface SettingsBusinessTypeProps {
  readonly businessType: string;
  readonly onChange: (value: string) => void;
}

export default function SettingsBusinessType({
  businessType,
  onChange,
}: SettingsBusinessTypeProps) {
  const options = [
    {
      value: 'tailoring_shop',
      label: 'Tailoring Shop',
      desc: 'Custom measurements, job orders & production tracking',
      emoji: '🧵',
    },
    {
      value: 'fashion_designer',
      label: 'Fashion Designer',
      desc: 'Portfolio showcase, catalog of original designs & commissions',
      emoji: '👗',
    },
    {
      value: 'hybrid',
      label: 'Hybrid',
      desc: 'Both tailoring services and original fashion designs',
      emoji: '✨',
    },
  ];

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <h2 className="text-lg font-medium text-[#2D2A26] mb-2">Business Type</h2>
      <p className="text-sm text-[#827A73] mb-5">
        Select the type that best describes your business. This controls which features are highlighted on your
        public profile.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              businessType === opt.value
                ? 'border-[#9A8073] bg-[#FAF6F3] shadow-sm'
                : 'border-[#EBE6E0] hover:border-[#D1C7BD] bg-white'
            }`}
          >
            <div className="text-2xl mb-2">{opt.emoji}</div>
            <div className="font-semibold text-[#2D2A26] text-sm mb-1">{opt.label}</div>
            <div className="text-xs text-[#A8A19A] leading-snug">{opt.desc}</div>
            {businessType === opt.value && <div className="mt-2 text-xs font-medium text-[#9A8073]">✓ Selected</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
