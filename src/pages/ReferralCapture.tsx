import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setReferralCookie } from '@/lib/referral';
import { toast } from 'sonner';

const ReferralCapture = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (code) {
      setReferralCookie(code);
      toast.success(`Referral applied: ${code.toUpperCase()}`);
    }
    navigate('/', { replace: true });
  }, [code, navigate]);
  return null;
};

export default ReferralCapture;
