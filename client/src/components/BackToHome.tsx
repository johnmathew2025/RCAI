import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BackToHomeButton() {
  const navigate = useNavigate();
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={() => navigate('/')}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Home
    </Button>
  );
}

export function BackToHomeLink() {
  return (
    <Button variant="outline" asChild>
      <Link to="/" className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </Button>
  );
}

// Default export for backward compatibility
export default function BackToHome() {
  return <BackToHomeButton />;
}