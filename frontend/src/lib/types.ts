
export type UserRole = 'admin' | 'super' | 'regular' | 'visitor';

export interface User {
  id: string;
  discordId: string;
  displayName: string;
  avatar: string;
  role: UserRole;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  usage: string;
  category: string;
  requiredPermissions: string[];
  content?: string; // Markdown content
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  recommendations: number;
  content: string;
  tags: string[]; 
  password: string; 
  makers: string[];
  players: number; 
  characters: string[];
  price: number; 
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}


export interface Guild {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  memberCount: number;
  features: string[];
}

export interface MessageFormat {
  id: string;
  guildId: string;
  formatType: 'welcome' | 'goodbye' | 'announcement' | 'custom';
  content: string;
  isEnabled: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
