export default function DiscountCoupon({ onApply }) {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(null);

  const coupons = {
    'WELCOME10': { type: 'percentage', value: 10, description: '10% off first contribution' },
    'FRIEND20': { type: 'percentage', value: 20, description: '20% off with referral' },
    'EARLY50': { type: 'fixed', value: 50, description: 'ETB 50 off first pool' }
  };

  const applyCoupon = () => {
    const coupon = coupons[code.toUpperCase()];
    if (coupon) {
      setDiscount(coupon);
      onApply(coupon);
      toast.success(`Coupon applied! ${coupon.description}`);
    } else {
      toast.error('Invalid coupon code');
    }
  };

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button onClick={applyCoupon} className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm">Apply</button>
      </div>
      {discount && <p className="text-xs text-green-600 mt-1">✓ {discount.description} applied!</p>}
    </div>
  );
}
