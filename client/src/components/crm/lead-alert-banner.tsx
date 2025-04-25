import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LeadAlertBannerProps {
  leadId: number;
  leadName: string;
  clientName: string;
  status: string;
  onDismiss: () => void;
  color: 'yellow' | 'red';
}

/**
 * AlertBanner component for lead notifications
 * Shows critical notifications for leads that require attention or follow-up
 * Yellow banners indicate newly assigned leads
 * Red banners indicate leads requiring urgent follow-up
 */
export function LeadAlertBanner({
  leadId,
  leadName,
  clientName,
  status,
  onDismiss,
  color = 'yellow'
}: LeadAlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    // Delay the actual dismiss callback to allow the animation to complete
    setTimeout(onDismiss, 300);
  };

  // Different styling based on alert type
  const bgColor = color === 'red' 
    ? 'bg-red-50 border-red-300' 
    : 'bg-amber-50 border-amber-300';
  
  const iconColor = color === 'red' 
    ? 'text-red-500' 
    : 'text-amber-500';
  
  const headingColor = color === 'red' 
    ? 'text-red-800' 
    : 'text-amber-800';
  
  const textColor = color === 'red' 
    ? 'text-red-700' 
    : 'text-amber-700';
  
  const StatusIcon = color === 'red' ? AlertCircle : AlertTriangle;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Card className={`${bgColor} border p-4 shadow-sm`}>
            <div className="flex items-start">
              <div className={`${iconColor} flex-shrink-0`}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${headingColor}`}>
                  {color === 'red' ? 'Lead Follow-up Required' : 'New Lead Assigned'}
                </h3>
                <div className={`mt-2 text-sm ${textColor}`}>
                  <p>
                    {color === 'red' 
                      ? `Lead "${leadName}" for ${clientName} requires follow-up. It has been in ${status} status for over 24 hours.` 
                      : `New lead "${leadName}" for ${clientName} has been assigned to you. Current status: ${status}`
                    }
                  </p>
                </div>
                <div className="mt-3 flex gap-x-3">
                  <Link href={`/crm/${leadId}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`font-medium ${color === 'red' ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      View Lead <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className={`${textColor} hover:bg-transparent`}
                onClick={handleDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}