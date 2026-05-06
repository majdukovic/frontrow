import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';

import type { RootTabParamList } from './types';

export const linking: LinkingOptions<RootTabParamList> = {
  prefixes: [Linking.createURL('/'), 'frontrow://', 'https://frontrow.app'],
  config: {
    screens: {
      Events: {
        screens: {
          EventsList: 'events',
          EventDetail: 'events/:id',
          BuyTicket: 'events/:eventId/buy',
        },
      },
      MyTickets: {
        screens: {
          MyTicketsList: 'tickets',
        },
      },
      Profile: {
        screens: {
          ProfileHome: 'profile',
          Login: 'profile/login',
          ForgotPassword: 'profile/forgot-password',
          Otp: 'profile/otp',
          ResetPassword: 'profile/reset-password',
          Premium: 'profile/premium',
        },
      },
      Debug: {
        screens: {
          DebugHome: 'debug',
        },
      },
    },
  },
};
