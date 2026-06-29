import React from 'react';
import { Navigation, Store, Truck, ExternalLink } from 'lucide-react';

type FulfillmentType = 'shipping' | 'delivery' | 'pickup';

const COURIER_OPTIONS = [
  // Same-Day / Local Delivery
  { id: 'lalamove', label: 'Lalamove', type: 'delivery' },
  { id: 'grab', label: 'Grab Express', type: 'delivery' },
  { id: 'transportify', label: 'Transportify', type: 'delivery' },
  { id: 'toktok', label: 'Toktok', type: 'delivery' },
  { id: 'borzo', label: 'Borzo (Mr. Speedy)', type: 'delivery' },
  { id: 'joyride', label: 'JoyRide Delivery', type: 'delivery' },
  { id: 'angkas', label: 'Angkas Express', type: 'delivery' },
  { id: 'moveit', label: 'Move It Delivery', type: 'delivery' },
  { id: 'dingdong', label: 'Dingdong Delivery', type: 'delivery' },

  // Standard Shipping / Nationwide Express
  { id: 'jnt', label: 'J&T Express', type: 'shipping' },
  { id: 'lbc', label: 'LBC Express', type: 'shipping' },
  { id: 'flash', label: 'Flash Express', type: 'shipping' },
  { id: 'ninjavan', label: 'Ninja Van', type: 'shipping' },
  { id: 'jrs', label: 'JRS Express', type: 'shipping' },
  { id: '2go', label: '2GO Express', type: 'shipping' },
  { id: 'abest', label: 'Abest Express', type: 'shipping' },
  { id: 'entrego', label: 'Entrego', type: 'shipping' },
  { id: 'apcargo', label: 'AP Cargo', type: 'shipping' },
  { id: 'airspeed', label: 'Airspeed', type: 'shipping' },
  { id: 'xde', label: 'XDE Logistics', type: 'shipping' },
  { id: 'spx', label: 'SPX Express (Shopee)', type: 'shipping' },
];

interface JobFulfillmentCardProps {
  readonly fulfillmentType: FulfillmentType;
  readonly setFulfillmentType: (type: FulfillmentType) => void;
  readonly fulfillmentProvider: string;
  readonly setFulfillmentProvider: (provider: string) => void;
  readonly courierTracking: string;
  readonly setCourierTracking: (tracking: string) => void;
  readonly shippingAddress: string;
  readonly setShippingAddress: (address: string) => void;
  readonly supportedCouriers: string[];
}

export default function JobFulfillmentCard({
  fulfillmentType,
  setFulfillmentType,
  fulfillmentProvider,
  setFulfillmentProvider,
  courierTracking,
  setCourierTracking,
  shippingAddress,
  setShippingAddress,
  supportedCouriers,
}: JobFulfillmentCardProps) {
  const getFilteredCouriers = () => {
    const options = COURIER_OPTIONS.filter(c => c.type === fulfillmentType);
    if (supportedCouriers.length === 0) return options;
    const filtered = options.filter(c => supportedCouriers.includes(c.id));
    return filtered.length > 0 ? filtered : options;
  };

  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(() => {
            let FulfillIcon = Truck;
            if (fulfillmentType === 'delivery') FulfillIcon = Navigation;
            else if (fulfillmentType === 'pickup') FulfillIcon = Store;
            return fulfillmentType === 'delivery'
              ? <FulfillIcon className="w-5 h-5 text-blue-600 animate-pulse" />
              : <FulfillIcon className="w-5 h-5 text-blue-600" />;
          })()}
          <h2 className="text-lg font-medium text-[#2D2A26]">Fulfillment Details</h2>
        </div>
        {fulfillmentType !== 'pickup' && courierTracking?.startsWith('http') && (
          <a
            href={courierTracking}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
          >
            Track Delivery <ExternalLink size={12} />
          </a>
        )}
      </div>
      <p className="text-xs text-blue-700 bg-blue-100/60 px-3 py-2 rounded-lg">
        Update fulfillment method, service provider, and tracking details. Customers see this info.
      </p>

      <div>
        <span className="block text-sm font-medium text-blue-800 mb-2">Fulfillment Method</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'shipping', label: 'Shipping', icon: Truck },
            { id: 'delivery', label: 'Local Delivery', icon: Navigation },
            { id: 'pickup', label: 'Store Pickup', icon: Store },
          ].map(method => {
            const Icon = method.icon;
            const isSelected = fulfillmentType === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setFulfillmentType(method.id as 'shipping' | 'delivery' | 'pickup');
                  setFulfillmentProvider('');
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-100/50 text-blue-700 font-semibold shadow-sm'
                    : 'border-blue-200/40 bg-white/70 text-blue-600 hover:border-blue-300'
                }`}
              >
                <Icon size={14} className="mb-0.5" />
                <span className="text-[11px]">{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {fulfillmentType !== 'pickup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="courier-delivery-service" className="block text-xs font-semibold text-blue-800 mb-1">
              Service Provider / Courier
            </label>
            <select
              id="courier-delivery-service"
              value={fulfillmentProvider}
              onChange={e => setFulfillmentProvider(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
            >
              <option value="">— Select provider —</option>
              {getFilteredCouriers().map(c => (
                <option key={c.id} value={c.label}>{c.label}</option>
              ))}
              <option value="Other">Other / Self-Managed</option>
            </select>
          </div>
          <div>
            <label htmlFor="tracking-number" className="block text-xs font-semibold text-blue-800 mb-1">
              {fulfillmentType === 'shipping' ? 'Tracking Number' : 'Booking Link / Rider Contact'}
            </label>
            <input
              id="tracking-number"
              type="text"
              placeholder={fulfillmentType === 'shipping' ? 'e.g. J&T-12345678' : 'e.g. Grab Link / Contact'}
              value={courierTracking}
              onChange={e => setCourierTracking(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      )}

      {fulfillmentType === 'pickup' ? (
        <div className="bg-blue-100/30 border border-blue-200/50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
          <Store size={14} className="shrink-0" />
          <span>Customer will pick up garments in-store. (Shop address will be used)</span>
        </div>
      ) : (
        <div>
          <label htmlFor="shipping-address" className="block text-xs font-semibold text-blue-800 mb-1">
            {fulfillmentType === 'shipping' ? 'Shipping Address' : 'Delivery Address'}
          </label>
          <input
            id="shipping-address"
            type="text"
            placeholder="Customer's address details..."
            value={shippingAddress}
            onChange={e => setShippingAddress(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
          />
        </div>
      )}
    </div>
  );
}
