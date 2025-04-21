import { User } from '@/lib/types';

export function isUser(obj: any): obj is User {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.nickname === 'string' &&
      typeof obj.profile_image_path === 'string' &&
      typeof obj.role === 'string' 
    );
}