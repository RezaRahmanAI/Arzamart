export interface SourcePage {
  id: number;
  name: string;
  isActive: boolean;
}

export interface SocialMediaSource {
  id: number;
  name: string;
  isActive: boolean;
}

export interface SourcePageCreate {
  name: string;
  isActive: boolean;
}

export interface SocialMediaSourceCreate {
  name: string;
  isActive: boolean;
}
