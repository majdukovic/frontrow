import type { NavigatorScreenParams } from '@react-navigation/native';

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { id: string };
  BuyTicket: { eventId: string };
  EventReviews: { eventId: string };
  Inbox: undefined;
};

export type TicketsStackParamList = {
  MyTicketsList: undefined;
  TicketDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Following: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  ResetPassword: { resetToken: string };
  Premium: undefined;
  Settings: undefined;
  Language: undefined;
  About: undefined;
  WebView: { url: string; title: string };
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
};

export type DebugStackParamList = {
  DebugHome: undefined;
  HapticDemo: undefined;
  LocationDemo: undefined;
  BiometricDemo: undefined;
  CameraDemo: undefined;
  MicrophoneDemo: undefined;
  CalendarDemo: undefined;
  ShareDemo: undefined;
  NotificationsDemo: undefined;
};

export type RootTabParamList = {
  Events: NavigatorScreenParams<EventsStackParamList> | undefined;
  MyTickets: NavigatorScreenParams<TicketsStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
  Debug: NavigatorScreenParams<DebugStackParamList> | undefined;
};
