export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  data: string; // base64
}

export interface Activity {
  id: string;
  time: string;
  description: string;
  attachments?: Attachment[];
}

export interface CountryVisit {
  id: string;
  name: string;
  city: string;
  from: string;
  to: string;
}

export interface DayPlan {
  date: string; // ISO string
  country: string;
  city: string;
  activities: Activity[];
}

export interface Collaborator {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface TripData {
  arrivalDate: string;
  departureDate: string;
  countries: CountryVisit[];
  dailyPlans: DayPlan[];
  ownerId?: string;
  collaborators?: Collaborator[];
  collaboratorIds?: string[];
  lastUpdated?: number;
}
