import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

interface UserAvatarProps {
  user: User;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, className }) => {
  const getInitials = () => {
    const first = user.firstName.charAt(0);
    const last = user.lastName.charAt(0);
    return `${first}${last}`;
  };

  return (
    <Avatar className={cn('', className)}>
      <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
      <AvatarFallback className="bg-primary/10 text-primary">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;