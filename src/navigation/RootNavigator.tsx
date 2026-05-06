import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { theme } from '../theme';

import { EventsListScreen } from '../screens/EventsListScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { BuyTicketScreen } from '../screens/BuyTicketScreen';
import { MyTicketsListScreen } from '../screens/MyTicketsListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { DebugScreen } from '../screens/DebugScreen';
import { HapticDemo } from '../screens/capabilities/HapticDemo';
import { LocationDemo } from '../screens/capabilities/LocationDemo';
import { BiometricDemo } from '../screens/capabilities/BiometricDemo';
import { CameraDemo } from '../screens/capabilities/CameraDemo';
import { MicrophoneDemo } from '../screens/capabilities/MicrophoneDemo';
import { CalendarDemo } from '../screens/capabilities/CalendarDemo';
import { ShareDemo } from '../screens/capabilities/ShareDemo';
import { NotificationsDemo } from '../screens/capabilities/NotificationsDemo';
import type {
  DebugStackParamList,
  EventsStackParamList,
  ProfileStackParamList,
  RootTabParamList,
  TicketsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const TicketsStack = createNativeStackNavigator<TicketsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const DebugStack = createNativeStackNavigator<DebugStackParamList>();

function EventsNavigator() {
  return (
    <EventsStack.Navigator>
      <EventsStack.Screen
        name="EventsList"
        component={EventsListScreen}
        options={{ title: 'Events' }}
      />
      <EventsStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: '' }}
      />
      <EventsStack.Screen
        name="BuyTicket"
        component={BuyTicketScreen}
        options={{ title: 'Buy Ticket', presentation: 'modal' }}
      />
    </EventsStack.Navigator>
  );
}

function TicketsNavigator() {
  return (
    <TicketsStack.Navigator>
      <TicketsStack.Screen
        name="MyTicketsList"
        component={MyTicketsListScreen}
        options={{ title: 'My Tickets' }}
      />
    </TicketsStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Sign in', presentation: 'modal' }}
      />
      <ProfileStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ title: 'Premium' }}
      />
    </ProfileStack.Navigator>
  );
}

function DebugNavigator() {
  return (
    <DebugStack.Navigator>
      <DebugStack.Screen
        name="DebugHome"
        component={DebugScreen}
        options={{ title: 'QA Debug Menu' }}
      />
      <DebugStack.Screen name="HapticDemo" component={HapticDemo} options={{ title: 'Haptics' }} />
      <DebugStack.Screen
        name="LocationDemo"
        component={LocationDemo}
        options={{ title: 'Location' }}
      />
      <DebugStack.Screen
        name="BiometricDemo"
        component={BiometricDemo}
        options={{ title: 'Biometric' }}
      />
      <DebugStack.Screen name="CameraDemo" component={CameraDemo} options={{ title: 'Camera' }} />
      <DebugStack.Screen
        name="MicrophoneDemo"
        component={MicrophoneDemo}
        options={{ title: 'Microphone' }}
      />
      <DebugStack.Screen
        name="CalendarDemo"
        component={CalendarDemo}
        options={{ title: 'Calendar' }}
      />
      <DebugStack.Screen name="ShareDemo" component={ShareDemo} options={{ title: 'Share' }} />
      <DebugStack.Screen
        name="NotificationsDemo"
        component={NotificationsDemo}
        options={{ title: 'Notifications' }}
      />
    </DebugStack.Navigator>
  );
}

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IoniconName, focusedName?: IoniconName) {
  function TabIcon({ focused, color }: { focused: boolean; color: string }) {
    return <Ionicons name={focused ? (focusedName ?? name) : name} size={24} color={color} />;
  }
  return TabIcon;
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsNavigator}
        options={{
          tabBarIcon: tabIcon('musical-notes-outline', 'musical-notes'),
          tabBarAccessibilityLabel: 'Events tab',
          tabBarButtonTestID: 'tab.events',
        }}
      />
      <Tab.Screen
        name="MyTickets"
        component={TicketsNavigator}
        options={{
          title: 'My Tickets',
          tabBarIcon: tabIcon('ticket-outline', 'ticket'),
          tabBarAccessibilityLabel: 'My Tickets tab',
          tabBarButtonTestID: 'tab.myTickets',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: tabIcon('person-outline', 'person'),
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarButtonTestID: 'tab.profile',
        }}
      />
      <Tab.Screen
        name="Debug"
        component={DebugNavigator}
        options={{
          tabBarIcon: tabIcon('bug-outline', 'bug'),
          tabBarAccessibilityLabel: 'Debug tab',
          tabBarButtonTestID: 'tab.debug',
        }}
      />
    </Tab.Navigator>
  );
}
