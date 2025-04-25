import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper-fixed';

type LeadAlertBannerProps = {
  leadId: number;
  leadName: string;
  clientName?: string;
  status?: string;
  onDismiss: () => void;
  color?: 'yellow' | 'red' | 'green';
  message?: string;
};

/**
 * Alert banner for leads that require attention
 * Used for lead follow-up reminders and assigned leads
 */
export function LeadAlertBanner({
  leadId,
  leadName,
  clientName,
  status,
  onDismiss,
  color = 'yellow',
  message
}: LeadAlertBannerProps) {
  const [, navigate] = useLocation();

  // Define colors based on alert type
  const colorStyles = {
    yellow: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      button: 'bg-green-500 hover:bg-green-600'
    }
  };

  const styles = colorStyles[color];
  
  // Navigate to lead detail page
  const handleViewLead = () => {
    navigate(`/dispatch/leads/${leadId}`);
  };

  return (
    <MotionWrapper 
      animation="fade-up" 
      delay={0.1}
    >
      <Card className={`mb-3 ${styles.bg} ${styles.border} border-l-4 shadow-sm`}>
        <div className="relative p-4">
          <div className="absolute top-2 right-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-gray-400 hover:text-gray-500"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-start">
            <div className={`mr-3 mt-1 ${styles.icon}`}>
              {color === 'yellow' && <Clock className="h-5 w-5" />}
              {color === 'red' && <AlertTriangle className="h-5 w-5" />}
              {color === 'green' && <ArrowRight className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 pr-8">
              <h4 className="font-semibold text-gray-900">
                {message || (color === 'red' 
                  ? 'Urgent: Lead Requires Follow-up' 
                  : 'Lead Follow-up Reminder')}
              </h4>
              
              <div className="mt-1 text-sm text-gray-600">
                <p><span className="font-medium">Lead:</span> {leadName}</p>
                {clientName && (
                  <p><span className="font-medium">Client:</span> {clientName}</p>
                )}
                {status && (
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`
                      ${status === 'HandToDispatch' ? 'text-amber-500' : ''}
                      ${status === 'Active' ? 'text-green-500' : ''}
                      ${status === 'Unqualified' ? 'text-red-500' : ''}
                      font-medium
                    `}>
                      {status}
                    </span>
                  </p>
                )}
              </div>
              
              <div className="mt-3">
                <Button 
                  size="sm" 
                  className={`${styles.button} text-white`}
                  onClick={handleViewLead}
                >
                  View Lead Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </MotionWrapper>
  );
}