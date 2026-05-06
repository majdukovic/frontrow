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
          EventReviews: 'events/:eventId/reviews',
          Inbox: 'inbox',
        },
      },
      MyTickets: {
        screens: {
          MyTicketsList: 'tickets',
          TicketDetail: 'tickets/:id',
        },
      },
      Profile: {
        screens: {
          ProfileHome: 'profile',
          EditProfile: 'profile/edit',
          Following: 'profile/following',
          Login: 'profile/login',
          ForgotPassword: 'profile/forgot-password',
          Otp: 'profile/otp',
          ResetPassword: 'profile/reset-password',
          Premium: 'profile/premium',
          Settings: 'profile/settings',
          Language: 'profile/language',
          About: 'profile/about',
          PaymentMethods: 'profile/payment-methods',
          AddPaymentMethod: 'profile/payment-methods/add',
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
