export type UserRole = "USER" | "ADMIN" | "MANAGER";

export interface User {
    id: string;
    discordUserId: string;
    nickname: string;
    avatar: string;
    role: UserRole;
}

export interface Channel {
    id: string;
    name: string;
  }
  
  export interface ContentData {
    id: string;
    channelId: string;
    text: string;
    index: number;      // Added index for order tracking
    buttonId: string;  // Added reference to parent button
  }


export interface ButtonData {
    id: string;
    name: string;
    contents: ContentData[];
    index: number;     // Added index for order tracking
    groupId: string;   // Added reference to parent group
    guildId: string;
  }
  
  export interface GroupData {
    id: string;
    name: string;
    buttons: ButtonData[];
    index: number;     // Added index for order tracking
  }
  
  export interface DraggableItem {
    id: string;
    type: 'group' | 'button';
    index: number;
    parentId?: string; // For buttons, this is the groupId
  }
  
  export type ItemPosition = {
    id: string;
    type: 'group' | 'button';
    newIndex: number;
    newParentId?: string;
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
    players: string;
    characters: string[];
    price: number;
    time: number;
    contact?: string; // ✅ 추가된 연락처 필드 (선택값)
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
    formatType: "welcome" | "goodbye" | "announcement" | "custom";
    content: string;
    isEnabled: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Place {
    title: string;
    address: string;
    roadAddress: string;
    link: string;
    lat?: number;
    lng?: number;
  }

export interface LocalSearchModalProps {
    onSelect: (place: Place) => void;
  }