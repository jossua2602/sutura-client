import React from 'react';

interface SettingsBasicInfoProps {
  readonly formData: {
    readonly name: string;
    readonly description: string;
    readonly address: string;
    readonly landmark?: string;
    readonly city: string;
    readonly province: string;
    readonly phone: string;
    readonly email: string;
    readonly latitude: string;
    readonly longitude: string;
  };
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function SettingsBasicInfo({ formData, onChange }: SettingsBasicInfoProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info & Contact */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Basic Info & Contact</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="shop-name" className="text-sm font-medium text-[#524A44]">Shop Name</label>
              <input
                id="shop-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-email" className="text-sm font-medium text-[#524A44]">Contact Email</label>
              <input
                id="shop-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="shop-description" className="text-sm font-medium text-[#524A44]">Description</label>
            <textarea
              id="shop-description"
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={3}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="shop-address" className="text-sm font-medium text-[#524A44]">Address</label>
              <input
                id="shop-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-landmark" className="text-sm font-medium text-[#524A44]">Landmark</label>
              <input
                id="shop-landmark"
                type="text"
                name="landmark"
                value={formData.landmark ?? ''}
                onChange={onChange}
                placeholder="e.g. Near City Hall, Beside Jollibee"
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-city" className="text-sm font-medium text-[#524A44]">City</label>
              <input
                id="shop-city"
                type="text"
                name="city"
                value={formData.city}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-province" className="text-sm font-medium text-[#524A44]">Province</label>
              <input
                id="shop-province"
                type="text"
                name="province"
                value={formData.province}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-phone" className="text-sm font-medium text-[#524A44]">Contact Phone</label>
              <input
                id="shop-phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map Coordinates */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#2D2A26]">Map Coordinates</h2>
          <p className="text-sm text-[#827A73] mt-1">
            Required for your shop to appear on the customer map discovery interface. Right-click your location on
            Google Maps to copy the Latitude and Longitude.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="shop-latitude" className="text-sm font-medium text-[#524A44]">Latitude (e.g. 7.1907)</label>
            <input
              id="shop-latitude"
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={onChange}
              placeholder="7.1907"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="shop-longitude" className="text-sm font-medium text-[#524A44]">Longitude (e.g. 125.4553)</label>
            <input
              id="shop-longitude"
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={onChange}
              placeholder="125.4553"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
