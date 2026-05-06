import type { NavigatorScreenParams } from '@react-navigation/native';

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { id: string };
  BuyTicket: { eventId: string };
};

export type TicketsStackParamList = {
  MyTicketsList: undefined;
  TicketDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  ResetPassword: { resetToken: string };
  Premium: undefined;
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
