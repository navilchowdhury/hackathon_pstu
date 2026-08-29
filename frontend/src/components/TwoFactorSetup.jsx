import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { extractError } from '../api/client';
import { Button, Card } from './ui';

export default function TwoFactorSetup() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState(null);
  const [secret, setSecret] = useState('');

  const showQr = async () => {
    setLoading(true);
    try {
      const res = await authApi.setupTwoFactor();
      setQr(res.data.data.qrCodeUrl);
      setSecret(res.data.data.secret);
      setOpen(true);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={showQr} disabled={loading}>
        {loading ? 'Generating…' : 'Show 2FA QR Code'}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-navy-900/50"
            aria-label="Close 2FA setup"
            onClick={() => setOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-navy-800">Google Authenticator</h2>
            <p className="mt-2 text-sm text-slate-600">
              Scan this QR code in Google Authenticator. You will need the 6-digit code to send money.
            </p>
            {qr && (
              <img src={qr} alt="2FA QR code" className="mx-auto mt-4 h-48 w-48 rounded-xl border border-slate-200" />
            )}
            {secret && (
              <p className="mt-3 break-all text-center font-mono text-xs text-slate-500">
                Manual key: {secret}
              </p>
            )}
            <Button type="button" className="mt-5 w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
