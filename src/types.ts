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
  activities: Activity[];
}

export interface TripData {
  arrivalDate: string;
  departureDate: string;
  countries: CountryVisit[];
  dailyPlans: DayPlan[];
}
