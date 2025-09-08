import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BackToHome() {
  const navigate = useNavigate();
  
  return (
    <Button 
      type="button" 
      variant="outline" 
      data-testid="back-home" 
      onClick={() => navigate('/admin')}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Home
    </Button>
  );
}